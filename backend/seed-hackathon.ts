import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { HackathonsService } from './src/modules/hackathons/hackathons.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, Role } from './src/entities/user.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const hackathonsService = app.get(HackathonsService);
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));

  const admin = await userRepository.findOne({ where: { role: Role.ADMIN } });
  if (!admin) {
    console.error('No admin found');
    process.exit(1);
  }

  const payload = {
    title: "CodeDabba Genesis 2026",
    description: "This hackathon is designed to test innovation, teamwork, and problem-solving skills. Participants will form squads, collaborate, and build impactful solutions within a structured timeline. Each phase is time-bound and automated to simulate a real-world competitive environment.",
    rules: "Participants must register within the registration window.\nTeams (or solo players) must adhere to submission deadlines.\nPlagiarism will result in immediate disqualification.\nAll submissions must include required deliverables.\nMentor decisions during evaluation are final.",
    evaluationCriteria: "Innovation & Creativity (30%)\nTechnical Implementation (30%)\nProblem Understanding (20%)\nPresentation & Clarity (20%)",
    registrationStart: "2026-03-29T11:57:00+05:30",
    registrationEnd: "2026-03-29T12:02:00+05:30",
    mentorSelectionStart: "2026-03-29T12:03:00+05:30",
    mentorSelectionEnd: "2026-03-29T12:07:00+05:30",
    approvalStart: "2026-03-29T12:08:00+05:30",
    approvalEnd: "2026-03-29T12:12:00+05:30",
    maxTeamSize: 1,
    maxParticipants: 0,
    allowIndividual: true,
    allowTeam: false,
    rounds: [
      {
        title: "Idea Phase",
        submissionStart: "2026-03-29T12:13:00+05:30",
        submissionEnd: "2026-03-29T12:18:00+05:30",
        evaluationStart: "2026-03-29T12:19:00+05:30",
        evaluationEnd: "2026-03-29T12:23:00+05:30",
        resultTime: "2026-03-29T12:24:00+05:30",
        weightagePercentage: 100,
        allowZip: true,
        allowGithub: true,
        allowVideo: true,
        allowDescription: true
      }
    ]
  };

  try {
    const result = await hackathonsService.create(admin, payload as any);
    console.log('Hackathon created successfully! ID:', result.id);
  } catch (error) {
    console.error('Failed to create hackathon:', error);
  }

  await app.close();
  process.exit(0);
}

bootstrap();
