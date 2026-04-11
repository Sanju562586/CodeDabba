import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as dns from 'dns';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule'; // Import ScheduleModule
import { MailerModule } from '@nestjs-modules/mailer'; // Add import
import { File } from './entities/file.entity'; // Add import
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './auth/auth.module';
import { User } from './entities/user.entity';
import { StudentProfile } from './entities/student-profile.entity';
import { MentorProfile } from './entities/mentor-profile.entity';
import { Course } from './entities/course.entity';
import { Module as CourseModule } from './entities/module.entity'; // Rename to avoid conflict with @nestjs/common Module
import { Chapter } from './entities/chapter.entity';
import { Submission } from './entities/submission.entity';
import { Enrollment } from './entities/enrollment.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { MentorApplication } from './entities/mentor-application.entity';
import { Otp } from './entities/otp.entity';
import { CoursesModule } from './modules/courses/courses.module'; // Import Module, not controller
import { LessonBlock } from './entities/lesson-block.entity';
import { MentorApplicationsModule } from './modules/mentor-applications/mentor-applications.module';
import { OtpModule } from './modules/otp/otp.module';
import { ChaptersModule } from './modules/chapters/chapters.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { Task } from './entities/task.entity';
import { TaskOption } from './entities/task-option.entity';
import { TestCase } from './entities/test-case.entity';
import { Progress } from './entities/progress.entity';
import { Hackathon } from './entities/hackathon.entity';
import { HackathonRound } from './entities/hackathon-round.entity';
import { HackathonRegistration } from './entities/hackathon-registration.entity';
import { HackathonTeam } from './entities/hackathon-team.entity';
import { HackathonTeamInvitation } from './entities/hackathon-team-invitation.entity';
import { HackathonMentor } from './entities/hackathon-mentor.entity';
import { HackathonTeamMember } from './entities/hackathon-team-member.entity';
import { HackathonTeamMentorAssignment } from './entities/hackathon-team-mentor-assignment.entity';
import { HackathonSubmission } from './entities/hackathon-submission.entity';
import { HackathonScore } from './entities/hackathon-score.entity';
import { HackathonLeaderboard } from './entities/hackathon-leaderboard.entity';
import { HackathonActivityLog } from './entities/hackathon-activity-log.entity';
import { HackathonPayment } from './entities/hackathon-payment.entity';
import { Certificate } from './entities/certificate.entity';
import { HackathonsModule } from './modules/hackathons/hackathons.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(), // Enable ScheduleModule
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const mailConfig = {
          transport: {
            host: configService.get('MAIL_HOST', 'smtp.gmail.com'),
            port: parseInt(configService.get('MAIL_PORT', '587')),
            secure: false, // true for 465, false for other ports
            family: 4, // Force IPv4 (fixes Render deployment issues)
            auth: {
              user: configService.get('MAIL_USER'),
              pass: configService.get('MAIL_PASSWORD'),
            },
            // Add timeout and connection settings for production
            connectionTimeout: 60000,
            greetingTimeout: 30000,
            socketTimeout: 60000,
          },
          defaults: {
            from: configService.get('MAIL_FROM', `"CodeDabba" <noreply@codedabba.com>`),
          },
        };

        console.log('[MAILER CONFIG] Initializing with:', {
          host: mailConfig.transport.host,
          port: mailConfig.transport.port,
          secure: mailConfig.transport.secure,
          user: mailConfig.transport.auth.user ? '***' : 'NOT SET',
          from: mailConfig.defaults.from,
        });

        return mailConfig;
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const url = configService.get<string>('DATABASE_URL');
        if (!url) {
          throw new Error('DATABASE_URL environment variable is not defined');
        }

        return {
          type: 'postgres',
          url: url,
          entities: [
            User,
            StudentProfile,
            MentorProfile,
            Course,
            CourseModule,
            Task,
            TaskOption,
            TestCase,
            Chapter,
            Submission,
            Enrollment,
            RefreshToken,
            MentorApplication,
            Otp,
            File,
            LessonBlock,
            Progress,
            Hackathon,
            HackathonRound,
            HackathonRegistration,
            HackathonTeam,
            HackathonTeamInvitation,
            HackathonMentor,
            HackathonTeamMember,
            HackathonTeamMentorAssignment,
            HackathonSubmission,
            HackathonScore,
            HackathonLeaderboard,
            HackathonActivityLog,
            HackathonPayment,
            Certificate,
          ],
          synchronize: true, // Auto-create tables (dev only)
          ssl: {
            rejectUnauthorized: false,
          },
        };
      },
    }),
    UsersModule,
    AuthModule,
    MentorApplicationsModule,
    OtpModule,
    CoursesModule,
    ChaptersModule,
    TasksModule,
    HackathonsModule,
    CertificatesModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
