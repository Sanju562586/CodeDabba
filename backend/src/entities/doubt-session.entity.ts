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
import { Course } from './course.entity';
import { User } from './user.entity';

export enum DoubtSessionStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('doubt_sessions')
export class DoubtSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  courseId: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column()
  mentorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'mentorId' })
  mentor: User;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column()
  meetingUrl: string;

  @Column({ type: 'timestamp' })
  scheduledAt: Date;

  @Column({ type: 'int', default: 45 })
  durationMinutes: number;

  @Column({
    type: 'enum',
    enum: DoubtSessionStatus,
    default: DoubtSessionStatus.SCHEDULED,
  })
  status: DoubtSessionStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
