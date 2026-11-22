import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { CompilerService } from './compiler.service';
import { Task } from '../../entities/task.entity';
import { TaskOption } from '../../entities/task-option.entity';
import { TestCase } from '../../entities/test-case.entity';
import { Chapter } from '../../entities/chapter.entity';
import { Submission } from '../../entities/submission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Task,
      TaskOption,
      TestCase,
      Chapter,
      Submission,
    ]),
  ],
  controllers: [TasksController],
  providers: [TasksService, CompilerService],
  exports: [TasksService, CompilerService],
})
export class TasksModule {}
