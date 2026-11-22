import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { DoubtSessionsService } from './doubt-sessions.service';
import { CreateDoubtSessionDto } from './dto/create-doubt-session.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../entities/user.entity';
import { DoubtSessionStatus } from '../../entities/doubt-session.entity';

@Controller('doubt-sessions')
export class DoubtSessionsController {
  constructor(
    private readonly doubtSessionsService: DoubtSessionsService,
  ) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.MENTOR, Role.ADMIN)
  async create(@Request() req: any, @Body() dto: CreateDoubtSessionDto) {
    return this.doubtSessionsService.createSession(
      req.user.id,
      req.user.role,
      dto,
    );
  }

  @Get('my-upcoming')
  @UseGuards(AuthGuard)
  async getMyUpcoming(@Request() req: any) {
    return this.doubtSessionsService.getUpcomingForUser(
      req.user.id,
      req.user.role,
    );
  }

  @Get('course/:courseId')
  @UseGuards(AuthGuard)
  async getByCourse(@Param('courseId') courseId: string) {
    return this.doubtSessionsService.getSessionsForCourse(courseId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.MENTOR, Role.ADMIN)
  async cancel(@Request() req: any, @Param('id') id: string) {
    return this.doubtSessionsService.cancelSession(
      id,
      req.user.id,
      req.user.role,
    );
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.MENTOR, Role.ADMIN)
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body('status') status: DoubtSessionStatus,
  ) {
    return this.doubtSessionsService.updateStatus(
      id,
      status,
      req.user.id,
      req.user.role,
    );
  }
}
