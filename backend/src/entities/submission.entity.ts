import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Chapter } from './chapter.entity';
import { Task } from './task.entity';

export enum SubmissionStatus {
  PENDING = 'PENDING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
}

@Entity()
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.submissions)
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Chapter, (chapter) => chapter.submissions, {
    nullable: true,
  })
  chapter: Chapter;

  @Column({ nullable: true })
  chapterId: string;

  @Column({ nullable: true })
  taskId: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column({ type: 'text', nullable: true })
  code: string;

  @Column({ nullable: true })
  selectedOptionId: string;

  @Column({
    type: 'text',
    default: SubmissionStatus.PENDING,
  })
  status: SubmissionStatus;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ type: 'text', nullable: true })
  output: string;

  @Column({ type: 'int', default: 0 })
  passedTests: number;

  @Column({ type: 'int', default: 0 })
  totalTests: number;

  @Column({ type: 'int', default: 0 })
  pointsAwarded: number;

  @CreateDateColumn()
  createdAt: Date;
}
