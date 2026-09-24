import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller.js';
import { DashboardController } from './dashboard.controller.js';
import { AnalyticsService } from './analytics.service.js';

@Module({
  controllers: [AnalysisController, DashboardController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
