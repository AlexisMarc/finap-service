import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { QueryDashboardDto } from './dto/query-analytics.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser, DashboardSummaryDto } from '../common/api-types.js';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  get(@CurrentUser() user: AuthUser, @Query() query: QueryDashboardDto): Promise<DashboardSummaryDto> {
    return this.analyticsService.getDashboard(user.userId, query.month);
  }
}
