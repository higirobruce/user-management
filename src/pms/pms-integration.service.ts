import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

@Injectable()
export class PmsIntegrationService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private async getAccessToken(): Promise<string> {
    const url = this.configService.get<string>('AUTH_URL');
    const clientId = this.configService.get<string>('AUTH_CLIENT_ID');
    const clientSecret = this.configService.get<string>('AUTH_CLIENT_SECRET');
    const grantType = this.configService.get<string>('AUTH_GRANT_TYPE', 'client_credentials');

    console.log('----', url, clientId, clientSecret, grantType)
    const formData = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: grantType,
    });

    try {
      const response$ = this.httpService.post<TokenResponse>(url, formData.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      const { data } = await firstValueFrom(response$);
      return data.access_token;
    } catch (error) {
      console.log(error)
      throw new HttpException('Failed to retrieve access token', error.response?.status || 500, {
        cause: error,
      });
    }
  }

  async fetchProjects(institutionName: string): Promise<any> {
    const token = await this.getAccessToken();
    const projectsUrl = this.configService.get<string>('PROJECTS_API_URL');
    const realmHeader = this.configService.get<string>('PROJECTS_API_X_REALM');

    try {
      const response$ = this.httpService.get(`${projectsUrl}/${institutionName}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-REALM': realmHeader,
        },
      });
      const { data } = await firstValueFrom(response$);
      return data;
    } catch (error) {
      throw new HttpException('Failed to fetch projects', error.response?.status || 500);
    }
  }

  async fetchProjectsParallel(institutions: string[]): Promise<any[]> {
    return Promise.all(institutions.map((inst) => this.fetchProjects(inst)));
  }
}

