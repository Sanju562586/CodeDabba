import {
  Controller,
  Get,
  Patch,
  Param,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  async getNotifications(
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    const take = limit ? Math.min(parseInt(limit, 10), 100) : 30;
    return this.notificationsService.getUserNotifications(req.user.id, take);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }
}
