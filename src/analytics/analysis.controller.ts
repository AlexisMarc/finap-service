import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { QueryByCategoryDto, QueryEvolutionDto, QueryRangeDto } from './dto/query-analytics.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type {
  AnalysisEvolutionDto,
  AnalysisSummaryDto,
  AuthUser,
  CategoryBreakdownDto,
} from '../common/api-types';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  summary(@CurrentUser() user: AuthUser, @Query() query: QueryRangeDto): Promise<AnalysisSummaryDto> {
    return this.analyticsService.getSummary(user.userId, query.from, query.to);
  }

  @Get('by-category')
  byCategory(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryByCategoryDto,
  ): Promise<CategoryBreakdownDto[]> {
    return this.analyticsService.getBreakdown(user.userId, query.from, query.to, query.type);
  }

  @Get('evolution')
  evolution(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryEvolutionDto,
  ): Promise<AnalysisEvolutionDto> {
    return this.analyticsService.getEvolution(user.userId, query.from, query.to, query.interval);
  }
}
