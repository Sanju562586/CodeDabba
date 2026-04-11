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
import { Hackathon } from './hackathon.entity';

export enum CertificateType {
  PARTICIPATION = 'participation',
  WINNER = 'winner',
  TOP_RANK = 'top_rank',
  COURSE_COMPLETION = 'course_completion',
}

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  certificateId: string; // CD-<YEAR>-<HACKID>-<USERID>

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  hackathonId: string;

  @ManyToOne(() => Hackathon, { nullable: true })
  @JoinColumn({ name: 'hackathonId' })
  hackathon: Hackathon;

  @Column({ nullable: true })
  courseId: string;

  @ManyToOne(() => Course, { nullable: true })
  @JoinColumn({ name: 'courseId' })
  course: Course | null;

  @Column({
    type: 'enum',
    enum: CertificateType,
    default: CertificateType.PARTICIPATION,
  })
  type: CertificateType;

  @Column({ nullable: true })
  teamName: string;

  @Column({ nullable: true })
  position: string; // e.g. "1st Place", "Finalist"

  @Column()
  fileUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  metadata: string; // JSON string for any extra data
}
