import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { QueryDashboardDto } from './dto/query-analytics.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser, DashboardSummaryDto } from '../common/api-types';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  get(@CurrentUser() user: AuthUser, @Query() query: QueryDashboardDto): Promise<DashboardSummaryDto> {
    return this.analyticsService.getDashboard(user.userId, query.month);
  }
}
