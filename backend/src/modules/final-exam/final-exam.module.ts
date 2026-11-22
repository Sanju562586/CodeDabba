import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinalExam } from '../../entities/final-exam.entity';
import { ExamQuestion } from '../../entities/exam-question.entity';
import { ExamAttempt } from '../../entities/exam-attempt.entity';
import { Course } from '../../entities/course.entity';
import { Chapter } from '../../entities/chapter.entity';
import { Progress } from '../../entities/progress.entity';
import { CertificatesModule } from '../certificates/certificates.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FinalExamController } from './final-exam.controller';
import { FinalExamService } from './final-exam.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FinalExam,
      ExamQuestion,
      ExamAttempt,
      Course,
      Chapter,
      Progress,
    ]),
    CertificatesModule,
    NotificationsModule,
  ],
  controllers: [FinalExamController],
  providers: [FinalExamService],
  exports: [FinalExamService],
})
export class FinalExamModule {}
