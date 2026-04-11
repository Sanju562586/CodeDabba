import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { RazorpayService } from './razorpay.service';
import { HackathonPayment } from '../../entities/hackathon-payment.entity';
import { Hackathon } from '../../entities/hackathon.entity';
import { HackathonRound } from '../../entities/hackathon-round.entity';
import { HackathonTeam } from '../../entities/hackathon-team.entity';
import { User } from '../../entities/user.entity';
import { Course } from '../../entities/course.entity';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HackathonPayment,
      Hackathon,
      HackathonRound,
      HackathonTeam,
      User,
      Course,
    ]),
    CoursesModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, RazorpayService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
