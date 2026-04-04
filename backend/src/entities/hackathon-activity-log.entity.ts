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
  // Hackathon Lifecycle
  HACKATHON_CREATED = 'hackathon_created',
  HACKATHON_UPDATED = 'hackathon_updated',
  HACKATHON_DELETED = 'hackathon_deleted',
  PHASE_TRANSITION = 'phase_transition',
  TIMELINE_UPDATED = 'timeline_updated',

  // Registration & Roles
  USER_REGISTERED = 'user_registered',
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  ROLE_ASSIGNED = 'role_assigned',
  MENTOR_ASSIGNED = 'mentor_assigned',

  // Team Actions
  TEAM_CREATED = 'team_created',
  TEAM_MEMBER_ADDED = 'team_member_added',
  TEAM_MEMBER_REMOVED = 'team_member_removed',
  TEAM_NAME_CHANGED = 'team_name_changed',
  TEAM_APPROVED = 'team_approved',
  TEAM_REJECTED = 'team_rejected',
  TEAM_LOCKED = 'team_locked',

  // Submission Activity
  SUBMISSION_CREATED = 'submission_created',
  SUBMISSION_UPDATED = 'submission_updated',
  SUBMISSION_BLOCKED = 'submission_blocked',

  // Evaluation System
  EVALUATION_STARTED = 'evaluation_started',
  EVALUATION_SUBMITTED = 'evaluation_submitted',
  EVALUATION_EDITED = 'evaluation_edited',
  EVALUATION_BLOCKED = 'evaluation_blocked',
  SCORE_AGGREGATED = 'score_aggregated',
  LEADERBOARD_GENERATED = 'leaderboard_generated',

  // Certificates
  CERTIFICATE_GENERATED = 'certificate_generated',
  CERTIFICATE_DOWNLOADED = 'certificate_downloaded',
  CERTIFICATE_VIEWED = 'certificate_viewed',
  VERIFICATION_ACCESSED = 'verification_accessed',

  // System & Security
  SYSTEM_TRIGGER = 'system_trigger',
  SECURITY_ALERT = 'security_alert',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  API_FAILURE = 'api_failure',

  // Legacy (Keep for compatibility)
  REGISTRATION = 'registration',
  MENTOR_ASSIGNMENT = 'mentor_assignment',
  SUBMISSION = 'submission',
  SCORE_UPDATE = 'score_update',
  ROUND_FINALIZATION = 'round_finalization',
  STATUS_CHANGE = 'status_change',
  TEAM_APPROVAL = 'team_approval',
  ELIMINATION = 'elimination',
}

export enum LogStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  BLOCKED = 'BLOCKED',
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

  @Column({
    type: 'enum',
    enum: LogStatus,
    default: LogStatus.SUCCESS,
  })
  status: LogStatus;

  @Column({ nullable: true })
  phase: string;

  @Column({ nullable: true })
  roundId: string;

  @Column('text')
  description: string;

  // Snapshots at time of log
  @Column({ nullable: true })
  actorName: string;

  @Column({ nullable: true })
  actorRole: string;

  @Column({ nullable: true })
  entityType: string;

  @Column({ nullable: true })
  entityId: string;

  @Column('jsonb', { nullable: true })
  metadata: any;

  @Column('jsonb', { nullable: true })
  prevState: any;

  @Column('jsonb', { nullable: true })
  newState: any;

  @Column({ nullable: true })
  performedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'performedById' })
  performedBy: User;

  @Column({ nullable: true })
  ipAddress: string;

  @CreateDateColumn()
  createdAt: Date;
}
