import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

interface TokenResponse {
  status: string,
  message: string,
  data: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    refresh_expires_in: number;
    token_type: string;
    scope?: string;
  }
}

// Upstream PMS/IAM failures must not leak as 401/403 to the SPA — the SPA's
// auth interceptor would interpret that as a session expiry and log the user
// out. Remap auth-shaped upstream errors to 502 (bad gateway).
function mapUpstreamStatus(error: any): number {
  const upstream = error?.response?.status;
  if (upstream === 401 || upstream === 403) return 502;
  return upstream || 500;
}

@Injectable()
export class PmsIntegrationService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) { }

  private async getAccessToken(): Promise<string> {
    const url = this.configService.get<string>('AUTH_BASE_URL') + this.configService.get<string>('AUTH_URL');
    const username = this.configService.get<string>('AUTH_USERNAME');
    const password = this.configService.get<string>('AUTH_PASSWORD');
    const totp = this.configService.get<string>('AUTH_TOTP');


    const requestBody = {
      username,
      password,
      totp,
    };

    try {
      const response$ = this.httpService.post<TokenResponse>(
        url,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-REALM': this.configService.get<string>('X_REALM'),
          },
        },
      );
      const { data } = await firstValueFrom(response$);
      return data.data.access_token;
    } catch (error) {
      console.log(error)
      throw new HttpException(
        'Failed to retrieve access token',
        mapUpstreamStatus(error),
        {
          cause: error,
        },
      );
    }
  }

  async fetchProjects(institutionName: string): Promise<any> {
    const token = await this.getAccessToken();
    const projectsUrl = this.configService.get<string>('API_BASE_URL') + this.configService.get<string>('PROJECTS_API_URL');
    const realmHeader = this.configService.get<string>('X_REALM');

    try {
      const response$ = this.httpService.get(
        `${projectsUrl}/${institutionName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-REALM': realmHeader,
          },
        },
      );
      const { data } = await firstValueFrom(response$);
      return data;
    } catch (error) {
      console.log(error.response)
      throw new HttpException(
        'Failed to fetch projects',
        mapUpstreamStatus(error),
      );
    }
  }

  async fetchAllMegaProjects(): Promise<any> {
    const token = await this.getAccessToken();
    const megaProjectsUrl = this.configService.get<string>('API_BASE_URL') + this.configService.get<string>('MEGAPROJECTS_API_URL');
    const realmHeader = this.configService.get<string>('X_REALM');

    try {
      const response$ = this.httpService.get(
        `${megaProjectsUrl}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-REALM': realmHeader,
          },
        },
      );
      const { data } = await firstValueFrom(response$);
      return data;
    } catch (error) {
      // console.log(error.response)
      throw new HttpException(
        'Failed to fetch projects',
        mapUpstreamStatus(error),
      );
    }
  }

  async fetchAllPrograms(): Promise<any> {
    const token = await this.getAccessToken();
    const programsUrl = this.configService.get<string>('API_BASE_URL') + this.configService.get<string>('MEGAPROJECTS_PROGRAMS_API_URL');
    const realmHeader = this.configService.get<string>('X_REALM');

    try {
      const response$ = this.httpService.get(
        `${programsUrl}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-REALM': realmHeader,
          },
        },
      );
      const { data } = await firstValueFrom(response$);
      return data;
    } catch (error) {
      // console.log(error.response)
      throw new HttpException(
        'Failed to fetch projects',
        mapUpstreamStatus(error),
      );
    }
  }

  async fetchSectoList(): Promise<any> {
      const token = await this.getAccessToken();
      const sectorsUrl = this.configService.get<string>('API_BASE_URL') + this.configService.get<string>('SECTORS_API_URL');
      const realmHeader = this.configService.get<string>('X_REALM');

      try {
        const response$ = this.httpService.get(
          `${sectorsUrl}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-REALM': realmHeader,
            },
          },
        );
        const { data } = await firstValueFrom(response$);
        return data;
      } catch (error) {
        console.log(error)
        throw new HttpException(
          'Failed to fetch sectors',
          mapUpstreamStatus(error),
        );
      }
  }

  async fetchInstitutionList(): Promise<any> {
      const token = await this.getAccessToken();
      const institutionsUrl = this.configService.get<string>('API_BASE_URL') + this.configService.get<string>('INSTITUTIONS_API_URL');
      const realmHeader = this.configService.get<string>('X_REALM');

      try {
        const response$ = this.httpService.get(
          `${institutionsUrl}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'X-REALM': realmHeader,
            },
          },
        );
        const { data } = await firstValueFrom(response$);
        return data;
      } catch (error) {
        // console.log(error.response)
        throw new HttpException(
          'Failed to fetch institutions',
          mapUpstreamStatus(error),
        );
      }
  }

  async fetchProjectsByProgramId(programId: string, institutionName: string): Promise<any> {
    const token = await this.getAccessToken();
    const projectsUrl = this.configService.get<string>('API_BASE_URL') + this.configService.get<string>('PROJECTS_PROGRAM_API_URL');
    const realmHeader = this.configService.get<string>('X_REALM');

    try {
      const response$ = this.httpService.get(
        `${projectsUrl}/${programId}/${institutionName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-REALM': realmHeader,
          },
        },
      );
      const { data } = await firstValueFrom(response$);
      return data;
    } catch (error) {
      // console.log(error.response)
      throw new HttpException(
        'Failed to fetch projects',
        mapUpstreamStatus(error),
      );
    }
  }

  async fetchProjectsParallel(institutions: string[]): Promise<any[]> {
    return Promise.all(institutions.map((inst) => this.fetchProjects(inst)));
  }
}
