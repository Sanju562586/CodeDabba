import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Hackathon } from './hackathon.entity';

export enum RoundStatus {
  UPCOMING = 'upcoming',
  SUBMISSION_ACTIVE = 'active',
  EVALUATION_ACTIVE = 'judging',
  RESULT_DECLARED = 'result_declared',
  CLOSED = 'closed',
}

@Entity('hackathon_rounds')
export class HackathonRound {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  hackathonId: string;

  @ManyToOne(() => Hackathon, (hackathon) => hackathon.rounds, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'hackathonId' })
  hackathon: Hackathon;

  @Column({ default: 1 })
  roundNumber: number;

  @Column({ default: 'Round' })
  title: string;

  @Column('text', { nullable: true })
  description: string;

  // Timeline Sub-phases
  @Column({
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  submissionStart: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  submissionEnd: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  evaluationStart: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  evaluationEnd: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  resultTime: Date;

  @Column({
    type: 'enum',
    enum: RoundStatus,
    default: RoundStatus.UPCOMING,
  })
  status: RoundStatus;

  @Column({ default: false })
  isScoringFinalized: boolean;

  @Column({ default: false })
  isElimination: boolean;

  @Column('decimal', { precision: 5, scale: 2, default: 0, nullable: true })
  eliminationThreshold: number;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  weightagePercentage: number;

  @Column({ default: false })
  allowZip: boolean;

  @Column({ default: false })
  allowGithub: boolean;

  @Column({ default: false })
  allowVideo: boolean;

  @Column({ default: true })
  allowDescription: boolean;

  @Column({ default: 50 })
  maxFileSizeMb: number;

  @Column('simple-array', { nullable: true })
  allowedFileTypes: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
