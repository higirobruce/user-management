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
 * Configurable because the column name varies by form; the datalist this was
 * first written against no longer exposes one (see README notes).
 */
const DEFAULT_FILE_COLUMN = 'c_uploaded_document';

/** The datalist is small and rarely changes; avoid re-fetching it per download. */
const LIST_CACHE_TTL_MS = 60_000;

export interface JogetReport {
  id: string;
  fileName: string | null;
  hasFile: boolean;
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

  /** Normalised list for the frontend: raw Joget fields plus file metadata. */
  async listReports(): Promise<{ total: number; data: JogetReport[] }> {
    const response = await this.fetchList();
    const rows = response.data ?? [];

    return {
      total: response.total ?? rows.length,
      data: rows.map((row) => {
        const href = this.extractHref(row);
        return {
          ...row,
          id: row.id,
          hasFile: href !== null,
          fileName: href ? this.fileNameFromHref(href) : null,
        } as JogetReport;
      }),
    };
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
