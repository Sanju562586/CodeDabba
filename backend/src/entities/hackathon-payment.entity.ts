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
import { User } from './user.entity';
import { HackathonTeam } from './hackathon-team.entity';
import { Hackathon } from './hackathon.entity';
import { HackathonRound } from './hackathon-round.entity';
import { Course } from './course.entity';

export enum PaymentType {
  REGISTRATION = 'REGISTRATION',
  ROUND = 'ROUND',
  COURSE = 'COURSE',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED',
}

@Entity('hackathon_payments')
@Index(['userId', 'hackathonId', 'roundId', 'paymentType'], { unique: true })
@Index(['userId', 'courseId', 'paymentType'], { unique: true })
export class HackathonPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  teamId: string;

  @ManyToOne(() => HackathonTeam, { nullable: true })
  @JoinColumn({ name: 'teamId' })
  team: HackathonTeam;

  @Column({ nullable: true })
  courseId: string;

  @ManyToOne(() => Course, { nullable: true })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @Column({ nullable: true })
  hackathonId: string;

  @ManyToOne(() => Hackathon)
  @JoinColumn({ name: 'hackathonId' })
  hackathon: Hackathon;

  @Column({ nullable: true })
  roundId: string;

  @ManyToOne(() => HackathonRound, { nullable: true })
  @JoinColumn({ name: 'roundId' })
  round: HackathonRound;

  @Column({
    type: 'enum',
    enum: PaymentType,
  })
  paymentType: PaymentType;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'INR' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ nullable: true })
  orderId: string;

  @Column({ nullable: true })
  transactionId: string;

  @Column()
  payerId: string;

  @Column({ nullable: true })
  teamName: string;

  @Column({ nullable: true })
  participantCount: number;

  @Column({ nullable: true })
  invoiceNumber: string;

  @Column({ nullable: true })
  receiptUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;
}
