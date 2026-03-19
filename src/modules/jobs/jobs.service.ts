import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { AlertsService } from '../alerts/alerts.service';
import { DashboardService } from '../dashboard/dashboard.service';
import {
  AUDIO_PROCESSING_QUEUE,
  PROCESS_AUDIO_JOB,
} from './processors/audio-processing.processor';
import { EMAIL_ALERT_QUEUE, SEND_ALERT_JOB } from './processors/email-alert.processor';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectQueue(EMAIL_ALERT_QUEUE) private emailAlertQueue: Queue,
    @InjectQueue(AUDIO_PROCESSING_QUEUE) private audioProcessingQueue: Queue,
    private readonly alertsService: AlertsService,
    private readonly dashboardService: DashboardService,
    private readonly prisma: PrismaService,
  ) {}

  // Run every minute: check and process scheduled email alerts
  @Cron(CronExpression.EVERY_MINUTE)
  async emailAlertJob() {
    this.logger.debug('Running email alert scheduled check');
    try {
      await this.alertsService.processScheduledAlerts();
    } catch (error) {
      this.logger.error(`Email alert job error: ${error.message}`);
    }
  }

  // Run every 5 minutes: process pending audios
  @Cron('*/5 * * * *')
  async audioPendingProcessingJob() {
    this.logger.debug('Running audio pending processing job');
    try {
      const pendingAudios = await this.prisma.audio.findMany({
        where: { status: 'pending' },
        take: 50, // Process in batches of 50
        orderBy: { uploadedAt: 'asc' },
      });

      for (const audio of pendingAudios) {
        await this.audioProcessingQueue.add(
          PROCESS_AUDIO_JOB,
          { audioId: audio.id },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: true,
            removeOnFail: false,
          },
        );
      }

      if (pendingAudios.length > 0) {
        this.logger.log(`Queued ${pendingAudios.length} audio files for processing`);
      }
    } catch (error) {
      this.logger.error(`Audio processing job error: ${error.message}`);
    }
  }

  // Run daily at 2am: cleanup old audit logs
  @Cron('0 2 * * *')
  async auditLogCleanupJob() {
    this.logger.log('Running audit log cleanup job');
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const result = await this.prisma.auditLog.deleteMany({
        where: { createdAt: { lt: ninetyDaysAgo } },
      });

      this.logger.log(`Audit log cleanup: deleted ${result.count} old entries`);
    } catch (error) {
      this.logger.error(`Audit cleanup job error: ${error.message}`);
    }
  }

  // Run every hour: pre-compute and log dashboard stats
  @Cron(CronExpression.EVERY_HOUR)
  async dashboardCacheJob() {
    this.logger.debug('Running dashboard cache warm-up job');
    try {
      // Pre-compute stats for all periods to warm up any caching layer
      await Promise.all([
        this.dashboardService.getStats('7d'),
        this.dashboardService.getStats('30d'),
        this.dashboardService.getSourceDistribution(),
      ]);

      this.logger.debug('Dashboard cache warm-up completed');
    } catch (error) {
      this.logger.error(`Dashboard cache job error: ${error.message}`);
    }
  }

  async enqueueSendTestAlert(alertId: string) {
    return this.emailAlertQueue.add(
      SEND_ALERT_JOB,
      { alertId, isTest: true },
      { attempts: 1, removeOnComplete: true },
    );
  }

  async enqueueAudioProcessing(audioId: string) {
    return this.audioProcessingQueue.add(
      PROCESS_AUDIO_JOB,
      { audioId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }
}
