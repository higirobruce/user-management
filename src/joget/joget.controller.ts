import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JogetService } from './joget.service';

@ApiTags('Joget Reports')
@ApiBearerAuth()
@Controller('joget/reports')
@UseGuards(JwtAuthGuard)
export class JogetController {
  constructor(private readonly jogetService: JogetService) {}

  @Get()
  @ApiOperation({ summary: 'List quarterly reports held in Joget' })
  @ApiQuery({
    name: 'includeFiles',
    required: false,
    description:
      'Default true — inlines each file as a base64 data URI. Pass false for ' +
      'metadata only, then fetch bytes from :recordId/file on demand.',
  })
  @ApiResponse({ status: 200, description: 'Reports, with or without files.' })
  @ApiResponse({ status: 502, description: 'Joget rejected the request.' })
  listReports(@Query('includeFiles') includeFiles?: string) {
    return this.jogetService.listReports(includeFiles !== 'false');
  }

  @Get(':recordId')
  @ApiOperation({ summary: 'One report, with its file metadata' })
  @ApiParam({ name: 'recordId', description: 'The `id` from the report list' })
  @ApiResponse({ status: 200, description: 'The report record.' })
  @ApiResponse({ status: 404, description: 'No such report.' })
  getReport(@Param('recordId') recordId: string) {
    return this.jogetService.getReport(recordId);
  }

  @Get(':recordId/file')
  @ApiOperation({
    summary: 'Stream a report PDF, fetched from Joget server-side',
  })
  @ApiParam({ name: 'recordId', description: 'The `id` from the report list' })
  @ApiResponse({ status: 200, description: 'The PDF bytes.' })
  @ApiResponse({ status: 404, description: 'No such report, or it has no file.' })
  async getReportFile(
    @Param('recordId') recordId: string,
    @Res() res: Response,
  ) {
    const file = await this.jogetService.getReportFile(recordId);

    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Length', file.buffer.length);
    // Plain `filename` for older clients, RFC 5987 `filename*` for the real
    // name — encodeURIComponent alone would surface "Revisit%20.pdf" as the
    // literal saved filename.
    const ascii = file.fileName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    );
    res.end(file.buffer);
  }
}
