import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { MailerModule } from '@nestjs-modules/mailer';

// Entities
import { User } from './entities/user.entity';
import { StudentProfile } from './entities/student-profile.entity';
import { MentorProfile } from './entities/mentor-profile.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Otp } from './entities/otp.entity';
import { File } from './entities/file.entity';
import { MentorApplication } from './entities/mentor-application.entity';
import { Course } from './entities/course.entity';
import { Module as CourseModule } from './entities/module.entity';
import { Chapter } from './entities/chapter.entity';
import { LessonBlock } from './entities/lesson-block.entity';
import { Task } from './entities/task.entity';
import { TaskOption } from './entities/task-option.entity';
import { TestCase } from './entities/test-case.entity';
import { Submission } from './entities/submission.entity';
import { Enrollment } from './entities/enrollment.entity';
import { Progress } from './entities/progress.entity';
import { Certificate } from './entities/certificate.entity';
import { Hackathon } from './entities/hackathon.entity';
import { HackathonRound } from './entities/hackathon-round.entity';
import { HackathonRegistration } from './entities/hackathon-registration.entity';
import { HackathonTeam } from './entities/hackathon-team.entity';
import { HackathonTeamInvitation } from './entities/hackathon-team-invitation.entity';
import { HackathonTeamMember } from './entities/hackathon-team-member.entity';
import { HackathonTeamMentorAssignment } from './entities/hackathon-team-mentor-assignment.entity';
import { HackathonMentor } from './entities/hackathon-mentor.entity';
import { HackathonSubmission } from './entities/hackathon-submission.entity';
import { HackathonScore } from './entities/hackathon-score.entity';
import { HackathonLeaderboard } from './entities/hackathon-leaderboard.entity';
import { HackathonActivityLog } from './entities/hackathon-activity-log.entity';
import { HackathonPayment } from './entities/hackathon-payment.entity';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OtpModule } from './modules/otp/otp.module';
import { MentorApplicationsModule } from './modules/mentor-applications/mentor-applications.module';
import { CoursesModule } from './modules/courses/courses.module';
import { ChaptersModule } from './modules/chapters/chapters.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { HackathonsModule } from './modules/hackathons/hackathons.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { FilesModule } from './modules/files/files.module';

const logger = new Logger('AppModule');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get('MAIL_HOST', 'smtp.gmail.com'),
          port: parseInt(configService.get('MAIL_PORT', '587')),
          secure: false,
          family: 4, // Force IPv4 — fixes Render deployment issues
          auth: {
            user: configService.get('MAIL_USER'),
            pass: configService.get('MAIL_PASSWORD'),
          },
          connectionTimeout: 60_000,
          greetingTimeout: 30_000,
          socketTimeout: 60_000,
        },
        defaults: {
          from: configService.get('MAIL_FROM', '"CodeDabba" <noreply@codedabba.com>'),
        },
      }),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('DATABASE_URL');
        if (!url) throw new Error('DATABASE_URL environment variable is not defined');

        return {
          type: 'postgres',
          url,
          entities: [
            User, StudentProfile, MentorProfile,
            RefreshToken, Otp, File, MentorApplication,
            Course, CourseModule, Chapter, LessonBlock,
            Task, TaskOption, TestCase,
            Submission, Enrollment, Progress, Certificate,
            Hackathon, HackathonRound, HackathonRegistration,
            HackathonTeam, HackathonTeamInvitation, HackathonTeamMember,
            HackathonTeamMentorAssignment, HackathonMentor,
            HackathonSubmission, HackathonScore,
            HackathonLeaderboard, HackathonActivityLog, HackathonPayment,
          ],
          synchronize: true, // Dev only — use migrations in production
          ssl: { rejectUnauthorized: false },
        };
      },
    }),

    // Feature Modules
    AuthModule,
    UsersModule,
    OtpModule,
    MentorApplicationsModule,
    FilesModule,
    CoursesModule,
    ChaptersModule,
    TasksModule,
    HackathonsModule,
    CertificatesModule,
    PaymentsModule,
  ],
})
export class AppModule {}
