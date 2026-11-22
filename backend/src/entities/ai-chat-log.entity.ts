import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Course } from './course.entity';

@Entity('ai_chat_logs')
export class AiChatLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  courseId: string;

  @ManyToOne(() => Course, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column({ nullable: true })
  chapterId: string;

  @Column('text')
  userMessage: string;

  @Column('text')
  aiReply: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
