import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
import {
  DoubtSession,
  DoubtSessionStatus,
} from '../../entities/doubt-session.entity';
import { Course } from '../../entities/course.entity';
import { Enrollment } from '../../entities/enrollment.entity';
import { EnrollmentStatus } from '../../entities/student-profile.entity';
import { Role, User } from '../../entities/user.entity';
import { CreateDoubtSessionDto } from './dto/create-doubt-session.dto';

@Injectable()
export class DoubtSessionsService {
  constructor(
    @InjectRepository(DoubtSession)
    private readonly sessionRepository: Repository<DoubtSession>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Schedule a new live doubt session
   */
  async createSession(mentorId: string, userRole: Role, dto: CreateDoubtSessionDto) {
    const course = await this.courseRepository.findOne({
      where: { id: dto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (userRole !== Role.ADMIN && course.mentorId !== mentorId) {
      throw new ForbiddenException('Only the assigned mentor or an admin can schedule sessions for this course');
    }

    const scheduledDate = new Date(dto.scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      throw new BadRequestException('Invalid scheduledAt date format');
    }

    // Auto-generate free Jitsi meeting link if mentor did not paste a custom Zoom/Google Meet link
    let meetingUrl = dto.meetingUrl?.trim();
    if (!meetingUrl) {
      const roomSlug = `codedabba-doubt-${dto.courseId.slice(0, 8)}-${Date.now()}`;
      meetingUrl = `https://meet.jit.si/${roomSlug}`;
    }

    const session = this.sessionRepository.create({
      courseId: dto.courseId,
      mentorId,
      title: dto.title,
      description: dto.description || undefined,
      meetingUrl,
      scheduledAt: scheduledDate,
      durationMinutes: dto.durationMinutes || 45,
      status: DoubtSessionStatus.SCHEDULED,
    });

    return await this.sessionRepository.save(session);
  }

  /**
   * Get all scheduled sessions for a course
   */
  async getSessionsForCourse(courseId: string) {
    return await this.sessionRepository.find({
      where: { courseId },
      relations: ['mentor'],
      order: { scheduledAt: 'ASC' },
    });
  }

  /**
   * Get upcoming sessions for a user across all active enrolled courses
   */
  async getUpcomingForUser(userId: string, role: Role) {
    const nowMinusOneHour = new Date(Date.now() - 60 * 60 * 1000);

    if (role === Role.MENTOR) {
      return await this.sessionRepository.find({
        where: {
          mentorId: userId,
          scheduledAt: MoreThanOrEqual(nowMinusOneHour),
          status: In([DoubtSessionStatus.SCHEDULED, DoubtSessionStatus.LIVE]),
        },
        relations: ['course'],
        order: { scheduledAt: 'ASC' },
        take: 10,
      });
    }

    // For students:
    const enrollments = await this.enrollmentRepository.find({
      where: {
        userId,
        status: EnrollmentStatus.ACTIVE,
      },
      select: ['courseId'],
    });

    if (!enrollments.length) {
      return [];
    }

    const courseIds = enrollments.map((e) => e.courseId);

    return await this.sessionRepository.find({
      where: {
        courseId: In(courseIds),
        scheduledAt: MoreThanOrEqual(nowMinusOneHour),
        status: In([DoubtSessionStatus.SCHEDULED, DoubtSessionStatus.LIVE]),
      },
      relations: ['course', 'mentor'],
      order: { scheduledAt: 'ASC' },
      take: 10,
    });
  }

  /**
   * Cancel or delete a session
   */
  async cancelSession(sessionId: string, userId: string, role: Role) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (role !== Role.ADMIN && session.mentorId !== userId) {
      throw new ForbiddenException('Not authorized to cancel this session');
    }

    session.status = DoubtSessionStatus.CANCELLED;
    return await this.sessionRepository.save(session);
  }

  /**
   * Update session status (e.g., mark LIVE or COMPLETED)
   */
  async updateStatus(
    sessionId: string,
    status: DoubtSessionStatus,
    userId: string,
    role: Role,
  ) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (role !== Role.ADMIN && session.mentorId !== userId) {
      throw new ForbiddenException('Not authorized to update this session');
    }

    session.status = status;
    return await this.sessionRepository.save(session);
  }
}
