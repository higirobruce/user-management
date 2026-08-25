import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
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
  @ApiOperation({ summary: 'List mission reports held in Joget' })
  @ApiResponse({ status: 200, description: 'Reports with file metadata.' })
  @ApiResponse({ status: 502, description: 'Joget rejected the request.' })
  listReports() {
    return this.jogetService.listReports();
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
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(file.fileName)}"`,
    );
    res.end(file.buffer);
  }
}
