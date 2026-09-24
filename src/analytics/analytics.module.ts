import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { DashboardController } from './dashboard.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  controllers: [AnalysisController, DashboardController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
