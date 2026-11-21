import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { MentorApplicationsService } from './mentor-applications.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../entities/user.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('mentor-applications')
export class MentorApplicationsController {
  constructor(
    private readonly mentorApplicationsService: MentorApplicationsService,
  ) {}

  @Post()
  create(@Body() createDto: any) {
    return this.mentorApplicationsService.create(createDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll() {
    return this.mentorApplicationsService.findAll();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.mentorApplicationsService.approve(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @Post(':id/reject')
  reject(@Param('id') id: string) {
    return this.mentorApplicationsService.reject(id);
  }
}
