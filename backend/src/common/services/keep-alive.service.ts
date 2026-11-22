import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Automatically ping self every 12 minutes to keep free cloud host (Render) awake
   */
  @Cron('0 */12 * * * *')
  async keepServerAlive() {
    const backendUrl =
      this.configService.get<string>('RENDER_EXTERNAL_URL') ||
      this.configService.get<string>('API_URL') ||
      this.configService.get<string>('APP_URL');

    if (!backendUrl || backendUrl.includes('localhost') || backendUrl.includes('127.0.0.1')) {
      return; // Skip on local development
    }

    try {
      const cleanUrl = backendUrl.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
      const healthUrl = `${cleanUrl}/api/v1/health`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(healthUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        this.logger.log(`[KeepAlive] Self-ping successful: server kept warm on free host`);
      }
    } catch (err: any) {
      this.logger.warn(`[KeepAlive] Self-ping failed: ${err.message}`);
    }
  }
}
