import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificatesService } from './certificates.service';
import { CertificatesController } from './certificates.controller';
import { Certificate } from '../../entities/certificate.entity';
import { User } from '../../entities/user.entity';
import { Hackathon } from '../../entities/hackathon.entity';
import { HackathonTeam } from '../../entities/hackathon-team.entity';
import { HackathonLeaderboard } from '../../entities/hackathon-leaderboard.entity';
import { HackathonActivityLog } from '../../entities/hackathon-activity-log.entity';
import { HackathonsModule } from '../hackathons/hackathons.module';
import { Course } from '../../entities/course.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Certificate,
      User,
      Hackathon,
      HackathonTeam,
      HackathonLeaderboard,
      HackathonActivityLog,
      Course,
    ]),
    HackathonsModule,
  ],
  controllers: [CertificatesController],
  providers: [CertificatesService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
