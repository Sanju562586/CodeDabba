import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FinalExamService } from './final-exam.service';
import { SubmitExamDto } from './dto/submit-exam.dto';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('courses/:courseId/exam')
export class FinalExamController {
  constructor(private readonly finalExamService: FinalExamService) {}

  @Get()
  @UseGuards(AuthGuard)
  async getExamDetails(
    @Request() req: any,
    @Param('courseId') courseId: string,
  ) {
    return this.finalExamService.getExamDetails(courseId, req.user.id);
  }

  @Post('start')
  @UseGuards(AuthGuard)
  async startExam(
    @Request() req: any,
    @Param('courseId') courseId: string,
  ) {
    return this.finalExamService.startExam(courseId, req.user.id);
  }

  @Post('submit')
  @UseGuards(AuthGuard)
  async submitExam(
    @Request() req: any,
    @Param('courseId') courseId: string,
    @Body() dto: SubmitExamDto,
  ) {
    return this.finalExamService.submitExam(
      courseId,
      req.user.id,
      dto.answers || {},
    );
  }
}
