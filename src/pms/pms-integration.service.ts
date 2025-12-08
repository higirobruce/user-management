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

@Injectable()
export class PmsIntegrationService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) { }

  private async getAccessToken(): Promise<string> {
    const url = this.configService.get<string>('AUTH_URL');
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
      console.log(data)
      return data.data.access_token;
    } catch (error) {
      console.log(error)
      throw new HttpException(
        'Failed to retrieve access token',
        error.response?.status || 500,
        {
          cause: error,
        },
      );
    }
  }

  async fetchProjects(institutionName: string): Promise<any> {
    const token = await this.getAccessToken();
    const projectsUrl = this.configService.get<string>('PROJECTS_API_URL');
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
        error.response?.status || 500,
      );
    }
  }

  async fetchAllMegaProjects(): Promise<any> {
    const token = await this.getAccessToken();
    const megaProjectsUrl = this.configService.get<string>('MEGAPROJECTS_API_URL');
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
        error.response?.status || 500,
      );
    }
  }

  async fetchAllPrograms(): Promise<any> {
    const token = await this.getAccessToken();
    const programsUrl = this.configService.get<string>('MEGAPROJECTS_PROGRAMS_API_URL');
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
        error.response?.status || 500,
      );
    }
  }

  async fetchProjectsByProgramId(programId: string, institutionName: string): Promise<any> {
    const token = await this.getAccessToken();
    const projectsUrl = this.configService.get<string>('PROJECTS_PROGRAM_API_URL');
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
        error.response?.status || 500,
      );
    }
  }

  async fetchProjectsParallel(institutions: string[]): Promise<any[]> {
    return Promise.all(institutions.map((inst) => this.fetchProjects(inst)));
  }
}
