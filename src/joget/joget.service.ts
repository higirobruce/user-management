import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

/**
 * Joget column holding the upload — an HTML anchor string, not a URL.
 * Overridable via JOGET_FILE_COLUMN, since the name varies by form.
 */
const DEFAULT_FILE_COLUMN = 'c_uploaded_document';

/** The datalist is small and rarely changes; avoid re-fetching it per download. */
const LIST_CACHE_TTL_MS = 60_000;

export interface JogetReport {
  id: string;
  fileName: string | null;
  hasFile: boolean;
  /** Mime type of the embedded file, charset stripped. */
  contentType?: string | null;
  /** Size of the decoded file in bytes (not the base64 length). */
  size?: number;
  [key: string]: any;
}

export interface JogetFile {
  buffer: Buffer;
  fileName: string;
  contentType: string;
}

interface JogetListResponse {
  total?: number;
  data?: Record<string, any>[];
}

// Joget rejecting our Basic Auth is a server-side misconfiguration, not a
// problem with the caller's session. Passing 401/403 straight through would
// make the SPA's auth interceptor log the user out, so remap to 502.
function mapUpstreamStatus(error: any): number {
  const upstream = error?.response?.status;
  if (upstream === 401 || upstream === 403) return 502;
  return upstream || 500;
}

@Injectable()
export class JogetService {
  private readonly logger = new Logger(JogetService.name);
  private listCache: { fetchedAt: number; response: JogetListResponse } | null =
    null;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get baseUrl(): string {
    return (
      this.configService.get<string>('JOGET_BASE_URL') ?? ''
    ).replace(/\/+$/, '');
  }

  private get auth() {
    return {
      username: this.configService.get<string>('JOGET_USERNAME') ?? '',
      password: this.configService.get<string>('JOGET_PASSWORD') ?? '',
    };
  }

  private get listUrl(): string {
    const appId = this.configService.get<string>('JOGET_APP_ID');
    const listId = this.configService.get<string>('JOGET_REPORTS_DATALIST_ID');
    return `${this.baseUrl}/jw/web/json/data/list/${appId}/${listId}`;
  }

  /**
   * Step 1a — the raw datalist. Cached briefly so opening several PDFs in a
   * row doesn't re-hit Joget for the same 20-odd rows.
   */
  private async fetchList(): Promise<JogetListResponse> {
    if (
      this.listCache &&
      Date.now() - this.listCache.fetchedAt < LIST_CACHE_TTL_MS
    ) {
      return this.listCache.response;
    }

    try {
      const response$ = this.httpService.get<JogetListResponse>(this.listUrl, {
        auth: this.auth,
      });
      const { data } = await firstValueFrom(response$);
      this.listCache = { fetchedAt: Date.now(), response: data ?? {} };
      return this.listCache.response;
    } catch (error) {
      this.logger.error(
        `Failed to fetch Joget datalist: ${error?.message}`,
        error?.response?.data,
      );
      throw new HttpException(
        'Failed to fetch reports from Joget',
        mapUpstreamStatus(error),
      );
    }
  }

  private get fileColumn(): string {
    return (
      this.configService.get<string>('JOGET_FILE_COLUMN') ?? DEFAULT_FILE_COLUMN
    );
  }

  /** Pulls the href out of the anchor Joget stores in the file column. */
  private extractHref(record: Record<string, any>): string | null {
    const cell = record?.[this.fileColumn];
    if (typeof cell !== 'string' || cell.trim() === '') return null;

    const match = cell.match(/href\s*=\s*["']([^"']+)["']/i);
    if (!match) return null;

    // Joget escapes the anchor, so the href can still carry &amp;. Trailing
    // dots are an upstream artefact ("MINICT.pdf."). %20 is left encoded on
    // purpose — decoding it breaks the download.
    return match[1].replace(/&amp;/g, '&').trim().replace(/\.+$/, '');
  }

  private fileNameFromHref(href: string): string {
    const last = href.split('/').filter(Boolean).pop() ?? 'document.pdf';
    try {
      return decodeURIComponent(last);
    } catch {
      return last;
    }
  }

  /** Raw Joget fields plus file metadata — no bytes fetched. */
  private normalise(row: Record<string, any>): JogetReport {
    const href = this.extractHref(row);
    return {
      ...row,
      id: row.id,
      hasFile: href !== null,
      fileName: href ? this.fileNameFromHref(href) : null,
    } as JogetReport;
  }

  /**
   * Replaces the anchor in the file column with the file itself, as a base64
   * data URI. JSON cannot carry raw bytes, so base64 is the transport — it
   * costs ~33% over the wire but drops straight into an <iframe>, an <img>,
   * or react-pdf with no second request.
   */
  private async embedFile(report: JogetReport): Promise<JogetReport> {
    const href = this.extractHref(report);
    if (!href || !href.startsWith('/jw/')) {
      return { ...report, [this.fileColumn]: null, contentType: null, size: 0 };
    }

    try {
      const file = await this.download(`${this.baseUrl}${href}`).catch(
        async (error) => {
          if (error?.response?.status === 404) {
            return this.download(`${this.baseUrl}${href}.`);
          }
          throw error;
        },
      );
      // Strip the charset Joget appends — it has no meaning on binary and
      // makes the data URI awkward for consumers.
      const mime = file.contentType.split(';')[0].trim();
      return {
        ...report,
        [this.fileColumn]: `data:${mime};base64,${file.data.toString('base64')}`,
        contentType: mime,
        size: file.data.length,
      };
    } catch (error) {
      // One bad file must not sink the whole list.
      this.logger.warn(
        `Could not embed file for ${report.id}: ${error?.message}`,
      );
      return { ...report, [this.fileColumn]: null, contentType: null, size: 0 };
    }
  }

  /**
   * Every row. With `includeFiles` (the default) each attachment is inlined
   * as a base64 data URI, so one call is enough. Pass false to get metadata
   * only — much lighter for a list view where the user previews one report
   * at a time and can pull the bytes from `:recordId/file` on demand.
   */
  async listReports(
    includeFiles = true,
  ): Promise<{ total: number; data: JogetReport[] }> {
    const response = await this.fetchList();
    const rows = response.data ?? [];
    const total = response.total ?? rows.length;

    if (!includeFiles) {
      return { total, data: rows.map((row) => this.normalise(row)) };
    }

    const data = await Promise.all(
      rows.map((row) => this.embedFile(this.normalise(row))),
    );

    return { total, data };
  }

  /** One row, same shape as a `listReports()` entry. */
  async getReport(recordId: string): Promise<JogetReport> {
    const response = await this.fetchList();
    const row = (response.data ?? []).find((r) => r?.id === recordId);
    if (!row) {
      throw new NotFoundException(`Report ${recordId} not found`);
    }
    return this.embedFile(this.normalise(row));
  }

  /**
   * Steps 1a + 1b — resolve the record's href, then pull the bytes from Joget
   * server-side with Basic Auth. Credentials never reach the browser, and the
   * browser never talks to Joget, which is what removes the CORS problem.
   */
  async getReportFile(recordId: string): Promise<JogetFile> {
    const response = await this.fetchList();
    const rows = response.data ?? [];
    const record = rows.find((row) => row?.id === recordId);

    if (!record) {
      // The datalist endpoint may paginate; say so rather than reporting a
      // flat "not found" when the row simply wasn't on the page we fetched.
      const total = response.total ?? rows.length;
      const hint =
        rows.length < total
          ? ` (only ${rows.length} of ${total} rows were returned by Joget)`
          : '';
      throw new NotFoundException(`Report ${recordId} not found${hint}`);
    }

    const href = this.extractHref(record);
    if (!href) {
      throw new NotFoundException(`Report ${recordId} has no attached file`);
    }

    if (!href.startsWith('/jw/')) {
      this.logger.warn(`Refusing unexpected Joget href: ${href}`);
      throw new NotFoundException(`Report ${recordId} has no usable file link`);
    }

    const fileName = this.fileNameFromHref(href);
    const url = `${this.baseUrl}${href}`;

    // The guide notes the stored href sometimes needs its trailing dot to
    // resolve, so fall back to the un-stripped form on a 404.
    const downloaded = await this.download(url).catch(async (error) => {
      if (error?.response?.status === 404) {
        return this.download(`${url}.`);
      }
      throw error;
    });

    return {
      buffer: downloaded.data,
      fileName,
      contentType: downloaded.contentType,
    };
  }

  private async download(
    url: string,
  ): Promise<{ data: Buffer; contentType: string }> {
    try {
      const response$ = this.httpService.get(url, {
        auth: this.auth,
        responseType: 'arraybuffer',
      });
      const response = await firstValueFrom(response$);
      const contentType =
        response.headers?.['content-type']?.toString() ?? 'application/pdf';

      // Joget serves its error and login pages as 200-with-HTML from file
      // URLs. Streaming that back labelled application/pdf would hand the
      // frontend a corrupt document, so fail loudly instead.
      if (contentType.includes('text/html')) {
        this.logger.error(`Joget returned an HTML page for ${url}`);
        throw new HttpException(
          'Joget did not return a file for this report',
          502,
        );
      }

      return { data: Buffer.from(response.data), contentType };
    } catch (error) {
      if (error instanceof HttpException) throw error; // already meaningful
      if (error?.response?.status === 404) throw error; // let the caller retry
      this.logger.error(
        `Failed to download Joget file ${url}: ${error?.message}`,
      );
      throw new HttpException(
        'Failed to download file from Joget',
        mapUpstreamStatus(error),
      );
    }
  }
}
