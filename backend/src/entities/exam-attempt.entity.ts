import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { FinalExam } from './final-exam.entity';
import { User } from './user.entity';

export enum ExamAttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  TIMED_OUT = 'TIMED_OUT',
}

@Entity('exam_attempts')
export class ExamAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  examId: string;

  @ManyToOne(() => FinalExam, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examId' })
  exam: FinalExam;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @Index()
  courseId: string;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt?: Date;

  @Column({ type: 'json', nullable: true })
  answers?: Record<string, string>; // questionId -> selectedOptionId

  @Column({ type: 'int', default: 0 })
  score: number;

  @Column({ type: 'int', default: 0 })
  totalQuestions: number;

  @Column({ type: 'int', default: 0 })
  percentage: number;

  @Column({
    type: 'enum',
    enum: ExamAttemptStatus,
    default: ExamAttemptStatus.IN_PROGRESS,
  })
  status: ExamAttemptStatus;

  @Column({ type: 'boolean', default: false })
  passed: boolean;

  @Column({ nullable: true })
  grade?: string; // DISTINCTION, FIRST_CLASS, PASS, FAIL

  @Column({ nullable: true })
  certificateId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
