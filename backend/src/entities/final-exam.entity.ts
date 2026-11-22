import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Course } from './course.entity';
import { ExamQuestion } from './exam-question.entity';

@Entity('final_exams')
export class FinalExam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  courseId: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column({ default: 'Course Final Certification Exam' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', default: 30 })
  timeLimitMinutes: number;

  @Column({ type: 'int', default: 60 })
  passingScorePercent: number;

  @OneToMany(() => ExamQuestion, (q) => q.exam, { cascade: true })
  questions: ExamQuestion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
