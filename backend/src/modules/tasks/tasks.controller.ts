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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ReorderTaskItemDto } from './dto/reorder-task.dto';
import { SubmitTaskDto } from './dto/submit-task.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../entities/user.entity';

@Controller('chapters/:chapterId/tasks')
@UseGuards(AuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // --- Student-Facing Endpoints ---

  @Get('student')
  getStudentTasks(
    @Param('chapterId') chapterId: string,
    @Request() req: any,
  ) {
    return this.tasksService.getStudentChapterTasks(chapterId, req.user.id);
  }

  @Get('progress')
  getChapterTaskProgress(
    @Param('chapterId') chapterId: string,
    @Request() req: any,
  ) {
    return this.tasksService.getChapterTaskProgress(chapterId, req.user.id);
  }

  @Post(':id/submit')
  submitTask(
    @Param('chapterId') chapterId: string,
    @Param('id') id: string,
    @Body() submitTaskDto: SubmitTaskDto,
    @Request() req: any,
  ) {
    return this.tasksService.submitTask(
      chapterId,
      id,
      req.user,
      submitTaskDto,
    );
  }

  // --- Mentor / Admin Course Authoring Endpoints ---

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.MENTOR, Role.ADMIN)
  create(
    @Param('chapterId') chapterId: string,
    @Body() createTaskDto: CreateTaskDto,
    @Request() req: any,
  ) {
    return this.tasksService.create(chapterId, createTaskDto, req.user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.MENTOR, Role.ADMIN)
  findAll(@Param('chapterId') chapterId: string) {
    return this.tasksService.findAll(chapterId);
  }

  @Patch('reorder')
  @UseGuards(RolesGuard)
  @Roles(Role.MENTOR, Role.ADMIN)
  reorder(
    @Param('chapterId') chapterId: string,
    @Body() items: ReorderTaskItemDto[],
    @Request() req: any,
  ) {
    return this.tasksService.reorder(chapterId, items, req.user.id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.MENTOR, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req: any,
  ) {
    return this.tasksService.update(id, updateTaskDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.MENTOR, Role.ADMIN)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.tasksService.remove(id, req.user.id);
  }
}
