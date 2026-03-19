import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AlertsService } from '../../alerts/alerts.service';

export const EMAIL_ALERT_QUEUE = 'email-alert';
export const SEND_ALERT_JOB = 'send-alert';

@Processor(EMAIL_ALERT_QUEUE)
export class EmailAlertProcessor {
  private readonly logger = new Logger(EmailAlertProcessor.name);

  constructor(private readonly alertsService: AlertsService) {}

  @Process(SEND_ALERT_JOB)
  async handleSendAlert(job: Job<{ alertId: string; isTest: boolean }>) {
    const { alertId, isTest } = job.data;

    this.logger.log(`Processing email alert job: ${alertId}, isTest: ${isTest}`);

    try {
      if (isTest) {
        await this.alertsService.sendTestEmail(alertId);
      } else {
        await this.alertsService.processScheduledAlerts();
      }

      this.logger.log(`Email alert job completed: ${alertId}`);
    } catch (error) {
      this.logger.error(`Email alert job failed: ${alertId} - ${error.message}`);
      throw error;
    }
  }
}
