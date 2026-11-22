import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoubtSession } from '../../entities/doubt-session.entity';
import { Course } from '../../entities/course.entity';
import { Enrollment } from '../../entities/enrollment.entity';
import { User } from '../../entities/user.entity';
import { DoubtSessionsController } from './doubt-sessions.controller';
import { DoubtSessionsService } from './doubt-sessions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DoubtSession, Course, Enrollment, User]),
  ],
  controllers: [DoubtSessionsController],
  providers: [DoubtSessionsService],
  exports: [DoubtSessionsService],
})
export class DoubtSessionsModule {}
