import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiChatLog } from '../../entities/ai-chat-log.entity';
import { Course } from '../../entities/course.entity';
import { Chapter } from '../../entities/chapter.entity';
import { LessonBlock } from '../../entities/lesson-block.entity';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiChatLog, Course, Chapter, LessonBlock]),
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
