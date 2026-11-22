import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { FinalExam } from './final-exam.entity';

export interface ExamQuestionOption {
  id: string;
  text: string;
}

@Entity('exam_questions')
export class ExamQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  examId: string;

  @ManyToOne(() => FinalExam, (e) => e.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examId' })
  exam: FinalExam;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'json' })
  options: ExamQuestionOption[];

  @Column()
  correctOptionId: string;

  @Column({ type: 'int', default: 1 })
  points: number;

  @Column({ type: 'text', nullable: true })
  explanation?: string;

  @Column({ type: 'int', default: 0 })
  orderIndex: number;

  @CreateDateColumn()
  createdAt: Date;
}
