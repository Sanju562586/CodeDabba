import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Hackathon } from './hackathon.entity';
import { User } from './user.entity';

export enum ActivityType {
  REGISTRATION = 'registration',
  MENTOR_ASSIGNMENT = 'mentor_assignment',
  SUBMISSION = 'submission',
  SCORE_UPDATE = 'score_update',
  ROUND_FINALIZATION = 'round_finalization',
  STATUS_CHANGE = 'status_change',
  TEAM_APPROVAL = 'team_approval',
  ELIMINATION = 'elimination',
}

@Entity('hackathon_activity_logs')
export class HackathonActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  hackathonId: string;

  @ManyToOne(() => Hackathon)
  @JoinColumn({ name: 'hackathonId' })
  hackathon: Hackathon;

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  activityType: ActivityType;

  @Column('text')
  description: string;

  @Column('jsonb', { nullable: true })
  metadata: any;

  @Column({ nullable: true })
  performedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'performedById' })
  performedBy: User;

  @CreateDateColumn()
  createdAt: Date;
}
