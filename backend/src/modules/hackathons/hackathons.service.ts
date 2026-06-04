import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  MoreThan,
  LessThanOrEqual,
  In,
  DataSource,
  IsNull,
} from 'typeorm';
import { Hackathon, HackathonStatus } from '../../entities/hackathon.entity';
import {
  HackathonRound,
  RoundStatus,
} from '../../entities/hackathon-round.entity';
import {
  HackathonRegistration,
  RegistrationType,
} from '../../entities/hackathon-registration.entity';
import {
  HackathonTeam,
  TeamStatus,
} from '../../entities/hackathon-team.entity';
import {
  HackathonTeamInvitation,
  InvitationStatus,
} from '../../entities/hackathon-team-invitation.entity';
import {
  HackathonMentor,
  MentorAssignmentType,
} from '../../entities/hackathon-mentor.entity';
import { HackathonTeamMentorAssignment } from '../../entities/hackathon-team-mentor-assignment.entity';
import {
  HackathonTeamMember,
  TeamMemberRole,
} from '../../entities/hackathon-team-member.entity';
import { HackathonSubmission } from '../../entities/hackathon-submission.entity';
import { HackathonScore } from '../../entities/hackathon-score.entity';
import { HackathonLeaderboard } from '../../entities/hackathon-leaderboard.entity';
import { User, Role } from '../../entities/user.entity';
import {
  HackathonActivityLog,
  ActivityType,
  LogStatus,
} from '../../entities/hackathon-activity-log.entity';
import { HackathonsLoggingService } from './hackathons-logging.service';
import { CreateHackathonDto } from './dto/create-hackathon.dto';
import {
  RegisterHackathonDto,
  RegisterMemberDto,
} from './dto/register-hackathon.dto';
import { v4 as uuid } from 'uuid';
import * as cloudinary from 'cloudinary';

@Injectable()
export class HackathonsService {
  private readonly logger = new Logger(HackathonsService.name);
  constructor(
    @InjectRepository(Hackathon)
    private hackathonsRepository: Repository<Hackathon>,
    @InjectRepository(HackathonRound)
    private roundsRepository: Repository<HackathonRound>,
    @InjectRepository(HackathonRegistration)
    private registrationsRepository: Repository<HackathonRegistration>,
    @InjectRepository(HackathonTeam)
    private teamsRepository: Repository<HackathonTeam>,
    @InjectRepository(HackathonTeamInvitation)
    private invitationsRepository: Repository<HackathonTeamInvitation>,
    @InjectRepository(HackathonMentor)
    private mentorsRepository: Repository<HackathonMentor>,
    @InjectRepository(HackathonTeamMentorAssignment)
    private teamMentorAssignmentsRepository: Repository<HackathonTeamMentorAssignment>,
    @InjectRepository(HackathonTeamMember)
    private teamMembersRepository: Repository<HackathonTeamMember>,
    @InjectRepository(HackathonSubmission)
    private submissionsRepository: Repository<HackathonSubmission>,
    @InjectRepository(HackathonScore)
    private scoresRepository: Repository<HackathonScore>,
    @InjectRepository(HackathonLeaderboard)
    private leaderboardRepository: Repository<HackathonLeaderboard>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(HackathonActivityLog)
    private activityLogsRepository: Repository<HackathonActivityLog>,
    private dataSource: DataSource,
    private readonly mailerService: MailerService,
    private readonly loggingService: HackathonsLoggingService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    const now = new Date();

    // --- PHASE 0 & 1: Registration Management ---
    // Open Registration
    const toOpenReg = await this.hackathonsRepository.find({
      where: {
        status: HackathonStatus.DRAFT,
        registrationStart: LessThanOrEqual(now),
      },
    });
    for (const h of toOpenReg) {
      const prevState = h.status;
      h.status = HackathonStatus.REGISTRATION_OPEN;
      await this.hackathonsRepository.save(h);
      await this.logActivity(
        h.id,
        ActivityType.PHASE_TRANSITION,
        `Automated Protocol: Registration for "${h.title}" opened.`,
        'SYSTEM',
        { prevState, newState: h.status },
        LogStatus.SUCCESS,
        undefined,
        h.status,
      );
    }

    // Close Registration 
    const toCloseReg = await this.hackathonsRepository.find({
      where: {
        status: HackathonStatus.REGISTRATION_OPEN,
        registrationEnd: LessThanOrEqual(now),
      },
    });
    for (const h of toCloseReg) {
      // Transition to Mentor Selection if defined, otherwise go straight to Squad Approval
      if (h.mentorSelectionEnd && h.mentorSelectionEnd > now) {
        h.status = HackathonStatus.MENTOR_SELECTION;
        await this.hackathonsRepository.save(h);
        await this.transitionToTeamsForming(h.id); 
        await this.logActivity(
          h.id,
          ActivityType.STATUS_CHANGE,
          `Registration closed for "${h.title}". Mentor Selection Phase initiated.`,
          'SYSTEM',
        );
      } else {
        h.status = HackathonStatus.APPROVAL_IN_PROGRESS;
        await this.hackathonsRepository.save(h);
        await this.transitionToTeamsForming(h.id); 
        await this.performMentorDistribution(h.id);
        await this.logActivity(
          h.id,
          ActivityType.STATUS_CHANGE,
          `Registration closed for "${h.title}". Squad Approval Phase initiated. Teams assigned to Archons.`,
          'SYSTEM',
        );
      }
    }

    // Handle manual override for MENTOR_SELECTION state if it exists
    const toApproval = await this.hackathonsRepository.find({
      where: {
        status: HackathonStatus.MENTOR_SELECTION,
        mentorSelectionEnd: LessThanOrEqual(now),
      },
    });
    for (const h of toApproval) {
      h.status = HackathonStatus.APPROVAL_IN_PROGRESS;
      await this.hackathonsRepository.save(h);
      await this.transitionToTeamsForming(h.id);
      await this.performMentorDistribution(h.id);
      await this.logActivity(
        h.id,
        ActivityType.STATUS_CHANGE,
        `Deployment status: Squad Approval In Progress. Mentors assigned.`,
        'SYSTEM',
      );
    }

    // --- PHASE 4: Competition Ready ---
    const toReady = await this.hackathonsRepository.find({
      where: {
        status: HackathonStatus.APPROVAL_IN_PROGRESS,
        approvalEnd: LessThanOrEqual(now),
      },
    });
    for (const h of toReady) {
      h.status = HackathonStatus.READY_FOR_ROUND_1;
      await this.hackathonsRepository.save(h);
      await this.logActivity(
        h.id,
        ActivityType.STATUS_CHANGE,
        `Readiness confirmed. Combat Rounds available.`,
        'SYSTEM',
      );
    }

    // --- ROUND ENGINE: Sub-status Transitions ---
    const allRounds = await this.roundsRepository.find({
      relations: ['hackathon'],
      order: { hackathonId: 'ASC', roundNumber: 'ASC' },
    });

    for (const round of allRounds) {
      let statusChanged = false;
      const hId = round.hackathonId;

      // 1. UPCOMING -> SUBMISSION_ACTIVE
      if (
        round.status === RoundStatus.UPCOMING &&
        now >= round.submissionStart &&
        now < round.submissionEnd
      ) {
        round.status = RoundStatus.SUBMISSION_ACTIVE;
        statusChanged = true;
        // Sync Hackathon level status
        await this.hackathonsRepository.update(hId, {
          status: HackathonStatus.ROUND_ACTIVE,
        });
      }
      // 2. SUBMISSION_ACTIVE -> EVALUATION_ACTIVE
      else if (
        round.status === RoundStatus.SUBMISSION_ACTIVE &&
        now >= round.submissionEnd
      ) {
        round.status = RoundStatus.EVALUATION_ACTIVE;
        statusChanged = true;
        // Sync Hackathon level status
        await this.hackathonsRepository.update(hId, {
          status: HackathonStatus.ROUND_EVALUATION,
        });
      }
      // 3. EVALUATION_ACTIVE -> RESULT_DECLARED
      else if (
        round.status === RoundStatus.EVALUATION_ACTIVE &&
        now >= round.evaluationEnd
      ) {
        round.status = RoundStatus.RESULT_DECLARED;
        statusChanged = true;
        // Auto-calculate rankings
        await this.performRoundCalculation(round.id);
        // Sync Hackathon level status
        await this.hackathonsRepository.update(hId, {
          status: HackathonStatus.ROUND_RESULTS,
        });
      }
      // 4. RESULT_DECLARED -> CLOSED
      else if (
        round.status === RoundStatus.RESULT_DECLARED &&
        now >= round.resultTime
      ) {
        round.status = RoundStatus.CLOSED;
        statusChanged = true;
        // Apply eliminations and promotions
        await this.applyEliminationsAndPromotions(round.id);

        // Check if this was the final round
        const totalRounds = allRounds.filter(
          (r) => r.hackathonId === hId,
        ).length;
        if (round.roundNumber === totalRounds) {
          await this.hackathonsRepository.update(hId, {
            status: HackathonStatus.COMPLETED,
          });
        }
      }

      if (statusChanged) {
        await this.roundsRepository.save(round);
        await this.logActivity(
          hId,
          ActivityType.STATUS_CHANGE,
          `Round ${round.roundNumber} transition: ${round.status}`,
          'SYSTEM',
        );
      }
    }

    // 5. Expire invitations
    await this.invitationsRepository.update(
      { status: InvitationStatus.PENDING, expiresAt: LessThanOrEqual(now) },
      { status: InvitationStatus.EXPIRED },
    );
  }

  private async logActivity(
    hackathonId: string,
    activityType: ActivityType,
    description: string,
    actorIdOrEntity?: string | User | any,
    metadata?: any,
    status: LogStatus = LogStatus.SUCCESS,
    roundId?: string,
    phase?: string,
  ) {
    try {
      let actor: User | any = null;
      if (typeof actorIdOrEntity === 'string') {
        if (actorIdOrEntity !== 'SYSTEM') {
          actor = await this.usersRepository.findOne({
            where: { id: actorIdOrEntity },
          });
        }
      } else {
        actor = actorIdOrEntity;
      }

      return await this.loggingService.log({
        hackathonId,
        activityType,
        description,
        actor,
        metadata,
        status,
        roundId,
        phase,
      });
    } catch (error) {
      this.logger.error(`Audit Log Fail: ${activityType} - ${description}`, error);
    }
  }

  async create(
    user: User,
    createHackathonDto: CreateHackathonDto,
  ): Promise<Hackathon> {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can create hackathons');
    }

    const { rounds, ...hackathonData } = createHackathonDto;

    const hackathon = this.hackathonsRepository.create({
      ...hackathonData,
      createdById: user.id,
      status: HackathonStatus.DRAFT,
      rounds: rounds.map((round, index) => ({
        ...round,
        roundNumber: index + 1,
      })),
    });

    const saved = await this.hackathonsRepository.save(hackathon);
    await this.logActivity(
      saved.id,
      ActivityType.HACKATHON_CREATED,
      `Hackathon "${saved.title}" initialized as Draft by ${user.name}.`,
      user,
      { dto: createHackathonDto },
      LogStatus.SUCCESS,
      undefined,
      'DRAFT',
    );
    return saved;
  }

  async findAll(query: any = {}, userId?: string): Promise<any[]> {
    const { status } = query;
    const queryBuilder = this.hackathonsRepository
      .createQueryBuilder('hackathon')
      .leftJoinAndSelect('hackathon.rounds', 'rounds')
      .loadRelationCountAndMap(
        'hackathon.registrationCount',
        'hackathon.registrations',
      )
      .orderBy('hackathon.createdAt', 'DESC');

    if (status) {
      queryBuilder.where('hackathon.status = :status', { status });
    }

    const hackathons = await queryBuilder.getMany();

    // Calculate teamCount for each hackathon
    const hackathonsWithCounts = await Promise.all(
      hackathons.map(async (h) => {
        const teamCount = await this.registrationsRepository.count({
          where: [
            {
              hackathonId: h.id,
              registrationType: RegistrationType.INDIVIDUAL,
            },
            { hackathonId: h.id, isTeamLead: true },
          ],
        });
        return { ...h, teamCount };
      }),
    );

    if (!userId) return hackathonsWithCounts;

    const myRegistrations = await this.registrationsRepository.find({
      where: { studentId: userId },
    });

    const registeredIds = new Set(myRegistrations.map((r) => r.hackathonId));

    return hackathonsWithCounts.map((h) => ({
      ...h,
      isRegistered: registeredIds.has(h.id),
    }));
  }

  async findOne(id: string, userId?: string): Promise<any> {
    const hackathon = await this.hackathonsRepository
      .createQueryBuilder('hackathon')
      .leftJoinAndSelect('hackathon.rounds', 'rounds')
      .leftJoinAndSelect('hackathon.createdBy', 'createdBy')
      .leftJoinAndSelect('hackathon.mentors', 'mentors')
      .leftJoinAndSelect('mentors.mentor', 'mentor')
      .loadRelationCountAndMap(
        'hackathon.registrationCount',
        'hackathon.registrations',
      )
      .where('hackathon.id = :id', { id })
      .getOne();

    if (!hackathon) throw new NotFoundException('Hackathon not found');

    let registration: HackathonRegistration | null = null;
    if (userId) {
      registration = await this.registrationsRepository.findOne({
        where: { hackathonId: id, studentId: userId },
        relations: ['team'],
      });
    }

    const teamCount = await this.registrationsRepository.count({
      where: [
        { hackathonId: id, registrationType: RegistrationType.INDIVIDUAL },
        { hackathonId: id, isTeamLead: true },
      ],
    });

    return {
      ...hackathon,
      teamCount,
      userRegistration: registration
        ? {
            ...registration,
            teamStatus: registration.team?.status,
            rejectReason: registration.team?.rejectReason,
          }
        : null,
    };
  }

  async getHackathonTeams(user: User, hackathonId: string) {
    if (user.role === Role.ADMIN) {
      return await this.teamsRepository.find({
        where: { hackathonId },
        relations: ['lead', 'members', 'members.student'],
      });
    }

    // Mentor only gets assigned teams unless global
    const mentorConfig = await this.mentorsRepository.findOne({
      where: { hackathonId, mentorId: user.id },
    });

    if (!mentorConfig) {
      return [];
    }

    if (mentorConfig.assignmentType === MentorAssignmentType.GLOBAL) {
      return await this.teamsRepository.find({
        where: { hackathonId },
        relations: ['lead', 'members', 'members.student'],
      });
    }

    const assignments = await this.teamMentorAssignmentsRepository.find({
      where: { mentorId: user.id },
      relations: ['team', 'team.lead', 'team.members', 'team.members.student'],
    });

    return assignments
      .map((a) => a.team)
      .filter((t) => t && t.hackathonId === hackathonId);
  }

  async updateStatus(
    user: User,
    id: string,
    status: HackathonStatus,
  ): Promise<Hackathon> {
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin only');
    }

    const hackathon = await this.hackathonsRepository.findOne({
      where: { id },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    const prevState = hackathon.status;
    hackathon.status = status;
    await this.hackathonsRepository.save(hackathon);
    await this.logActivity(
      id,
      ActivityType.PHASE_TRANSITION,
      `Hackathon phase transitioned from ${prevState} to ${status} by Admin ${user.name}.`,
      user,
      { prevState, newState: status },
      LogStatus.SUCCESS,
      undefined,
      status,
    );
    return hackathon;
  }

  async distributeTeamsToMentors(user: User, hackathonId: string) {
    if (user.role !== Role.ADMIN) throw new ForbiddenException('Admin only');

    const hackathon = await this.hackathonsRepository.findOne({
      where: { id: hackathonId },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');
    // Allow re-distribution so new unassigned teams can get a mentor
    // if (hackathon.isMentorDistributed) throw new BadRequestException('Personnel distribution already finalized');

    const result = await this.performMentorDistribution(hackathonId);

    hackathon.isMentorDistributed = true;
    await this.hackathonsRepository.save(hackathon);
    await this.logActivity(
      hackathonId,
      ActivityType.MENTOR_ASSIGNMENT,
      `Strategic Archon distribution completed for hackathon by Admin "${user.name}".`,
      user,
      { mentorCount: result.assignedSquads },
      LogStatus.SUCCESS,
      undefined,
      hackathon.status,
    );
    return result;
  }

  private async performMentorDistribution(hackathonId: string) {
    // 1. Get all mentors for this hackathon
    const mentors = await this.mentorsRepository.find({
      where: { hackathonId },
      relations: ['mentor'],
    });

    if (mentors.length === 0)
      return {
        message: 'No mentors registered for this hackathon',
        assignedSquads: 0,
        personnelCount: 0,
        ratio: '0',
      };

    // 2. Get all teams pending distribution (status PENDING_APPROVAL)
    const teams = await this.teamsRepository.find({
      where: { hackathonId, status: TeamStatus.PENDING_APPROVAL },
    });

    if (teams.length === 0)
      return {
        message: 'No squads requiring assignment',
        assignedSquads: 0,
        personnelCount: mentors.length,
        ratio: '0',
      };

    // 3. Clear existing specific assignments for THESE teams to avoid duplicates/confusion
    const teamIds = teams.map((t) => t.id);
    await this.teamMentorAssignmentsRepository.delete({ teamId: In(teamIds) });

    // 4. Shuffle both for max randomness
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
    const shuffledMentors = [...mentors].sort(() => Math.random() - 0.5);

    // 5. Equally divide
    const assignments: HackathonTeamMentorAssignment[] = [];
    shuffledTeams.forEach((team, index) => {
      const mentor = shuffledMentors[index % shuffledMentors.length];
      const assignment = this.teamMentorAssignmentsRepository.create({
        teamId: team.id,
        mentorId: mentor.mentorId,
      });
      assignments.push(assignment);
    });

    if (assignments.length > 0) {
      await this.teamMentorAssignmentsRepository.save(assignments);
    }

    return {
      assignedSquads: assignments.length,
      personnelCount: mentors.length,
      ratio:
        mentors.length > 0
          ? (assignments.length / mentors.length).toFixed(1)
          : '0',
    };
  }
  async register(
    user: User,
    hackathonId: string,
    registerDto: RegisterHackathonDto,
  ): Promise<any> {
    const hackathon = await this.hackathonsRepository.findOne({
      where: { id: hackathonId },
      relations: ['rounds'],
    });

    if (!hackathon) throw new NotFoundException('Hackathon not found');
    if (hackathon.status !== HackathonStatus.REGISTRATION_OPEN) {
      throw new BadRequestException(
        'Registration is not open for this hackathon',
      );
    }

    const now = new Date();
    if (now < hackathon.registrationStart) {
      throw new BadRequestException(
        `Registration hasn't started yet. It starts on ${hackathon.registrationStart.toLocaleString()}`,
      );
    }
    if (now > hackathon.registrationEnd) {
      throw new BadRequestException(
        `Registration period ended on ${hackathon.registrationEnd.toLocaleString()}`,
      );
    }

    // Check participant cap
    if (hackathon.maxParticipants > 0) {
      const currentParticipants = await this.registrationsRepository.count({
        where: { hackathonId },
      });
      if (currentParticipants >= hackathon.maxParticipants) {
        throw new BadRequestException(
          'The arena is full! Maximum participation limit reached.',
        );
      }
    }

    // Check if already registered
    const existing = await this.registrationsRepository.findOne({
      where: { hackathonId, studentId: user.id },
    });
    if (existing)
      throw new ConflictException(
        'You are already registered for this hackathon',
      );

    // Check if has pending invitations (to prevent double joining)
    const pendingInvite = await this.invitationsRepository.findOne({
      where: {
        hackathonId,
        invitedEmail: user.email,
        status: InvitationStatus.PENDING,
      },
    });
    if (pendingInvite)
      throw new ConflictException(
        'You have a pending invitation for this hackathon. Please accept or decline it first.',
      );

    // Individual registration
    if (registerDto.registrationType === RegistrationType.INDIVIDUAL) {
      if (!hackathon.allowIndividual)
        throw new BadRequestException('Individual registration not allowed');

      const registration = this.registrationsRepository.create({
        hackathonId,
        studentId: user.id,
        registrationType: RegistrationType.INDIVIDUAL,
        status: 'registered',
        name: registerDto.name,
        mobile: registerDto.mobile,
        collegeEmail: registerDto.collegeEmail,
        highestQualification: registerDto.highestQualification,
      });
      const saved = await this.registrationsRepository.save(registration);
      await this.logActivity(
        hackathonId,
        ActivityType.REGISTRATION,
        `New operative enlisted: "${user.name}"`,
        user.id,
      );
      return saved;
    }

    // Team registration
    if (registerDto.registrationType === RegistrationType.TEAM) {
      if (!hackathon.allowTeam)
        throw new BadRequestException('Team registration not allowed');

      const teamMembers = registerDto.members || [];
      if (teamMembers.length + 1 > hackathon.maxTeamSize) {
        throw new BadRequestException(
          `Team size exceeds maximum limit of ${hackathon.maxTeamSize}`,
        );
      }

      // Create Team
      const team = this.teamsRepository.create({
        hackathonId,
        name: registerDto.teamName,
        leadId: user.id,
        status: TeamStatus.FORMING,
      });
      await this.teamsRepository.save(team);

      // Save lead registration
      const leadRegistration = this.registrationsRepository.create({
        hackathonId,
        studentId: user.id,
        registrationType: RegistrationType.TEAM,
        teamId: team.id,
        isTeamLead: true,
        status: 'registered',
        name: registerDto.name,
        mobile: registerDto.mobile,
        collegeEmail: registerDto.collegeEmail,
        highestQualification: registerDto.highestQualification,
      });

      await this.registrationsRepository.save(leadRegistration);

      // Create member invitations
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 48);
      // Don't exceed registration end
      if (expiryDate > hackathon.registrationEnd) {
        expiryDate.setTime(hackathon.registrationEnd.getTime());
      }

      for (const memberDto of teamMembers) {
        // Check if member already invited/registered
        const alreadyInvited = await this.invitationsRepository.findOne({
          where: { hackathonId, invitedEmail: memberDto.email },
        });
        if (
          alreadyInvited &&
          alreadyInvited.status === InvitationStatus.PENDING
        )
          continue;

        const invitation = this.invitationsRepository.create({
          hackathonId,
          teamName: registerDto.teamName,
          invitedEmail: memberDto.email,
          invitedName: memberDto.name,
          invitedMobile: memberDto.mobile,
          invitedTrack:
            memberDto.collegeEmail || memberDto.highestQualification,
          invitedById: user.id,
          status: InvitationStatus.PENDING,
          token: uuid(),
          expiresAt: expiryDate,
        });

        await this.invitationsRepository.save(invitation);

        // Send Email Invitation
        await this.sendHackathonInvitation(
          invitation,
          hackathon.title,
          user.name,
        );
      }

      const result = {
        message: 'Registration successful. Squad summons dispatched.',
        teamId: team.id,
      };
      await this.logActivity(
        hackathonId,
        ActivityType.REGISTRATION,
        `New squad registered: "${registerDto.teamName}"`,
        user.id,
      );
      return result;
    }
  }

  private async sendHackathonInvitation(
    invitation: HackathonTeamInvitation,
    hackathonTitle: string,
    inviterName: string,
  ) {
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    try {
      await this.mailerService.sendMail({
        to: invitation.invitedEmail,
        subject: `⚔️ You've Been Recruited for ${hackathonTitle}!`,
        html: `
                    <div style="font-family: Arial, sans-serif; padding: 40px; background-color: #000; color: #fff; border-radius: 30px; border: 1px solid #333;">
                        <h2 style="color: #F0ABFC; font-style: italic; text-transform: uppercase;">The Arena Awaits</h2>
                        <p style="font-size: 16px; line-height: 1.6;">Hi <strong>${invitation.invitedName || 'Warrior'}</strong>,</p>
                        <p style="font-size: 16px; line-height: 1.6;">
                            <strong>${inviterName}</strong> has recruited you to join their squad <strong>"${invitation.teamName}"</strong> for the upcoming hackathon:
                        </p>
                        <h3 style="color: #fff; font-size: 24px; text-transform: uppercase; margin: 30px 0;">🏆 ${hackathonTitle}</h3>
                        <p style="font-size: 14px; color: #888; margin-bottom: 40px;">You have been enlisted as part of this squad. Secure your spot by clicking the button below.</p>
                        
                        <a href="${appUrl}/hackathons/invitations?token=${invitation.token}" style="display: inline-block; padding: 18px 36px; background-color: #F0ABFC; color: #000; text-decoration: none; border-radius: 12px; font-weight: 900; text-transform: uppercase; font-style: italic; letter-spacing: 1px;">Accept Mission</a>
                        
                        <p style="margin-top: 50px; font-size: 12px; color: #555;">
                            This invitation expires on ${invitation.expiresAt.toLocaleString()}.<br>
                            If you do not have an account yet, sign up using this same email and your mission will be automatically synchronized.
                        </p>
                    </div>
                `,
      });
    } catch (error) {
      console.error('Failed to send hackathon invitation email:', error);
    }
  }

  async syncInvitations(userId: string, email: string) {
    // No direct sync needed anymore since we match by email in getInvitations
  }

  async getInvitations(email: string) {
    return await this.invitationsRepository.find({
      where: { invitedEmail: email, status: InvitationStatus.PENDING },
      relations: ['hackathon', 'invitedBy'],
    });
  }

  async acceptInvitation(user: User, invitationIdOrToken: string) {
    return await this.dataSource.transaction(async (manager) => {
      const invitationRepo = manager.getRepository(HackathonTeamInvitation);
      const registrationRepo = manager.getRepository(HackathonRegistration);
      const teamRepo = manager.getRepository(HackathonTeam);
      const hackathonRepo = manager.getRepository(Hackathon);

      const invitation = await invitationRepo.findOne({
        where: [
          {
            id: invitationIdOrToken,
            invitedEmail: user.email,
            status: InvitationStatus.PENDING,
          },
          {
            token: invitationIdOrToken,
            invitedEmail: user.email,
            status: InvitationStatus.PENDING,
          },
        ],
        relations: ['hackathon'],
      });

      if (!invitation)
        throw new NotFoundException('Invitation not found or no longer active');

      // 1. Check if hackathon registration is still open (both date and status)
      const hackathon = invitation.hackathon;
      const now = new Date();
      if (
        hackathon.status !== HackathonStatus.REGISTRATION_OPEN ||
        now > hackathon.registrationEnd
      ) {
        // Auto-expire invitation if we tried to accept it but reg is closed
        invitation.status = InvitationStatus.EXPIRED;
        await invitationRepo.save(invitation);
        throw new BadRequestException(
          'Registration for this hackathon is closed',
        );
      }

      if (invitation.expiresAt < now) {
        invitation.status = InvitationStatus.EXPIRED;
        await invitationRepo.save(invitation);
        throw new BadRequestException('Invitation has expired');
      }

      // 2. Find or create team (Atomic)
      let team = await teamRepo.findOne({
        where: {
          hackathonId: invitation.hackathonId,
          name: invitation.teamName,
        },
      });

      if (!team) {
        team = teamRepo.create({
          hackathonId: invitation.hackathonId,
          name: invitation.teamName,
          leadId: invitation.invitedById,
          status: TeamStatus.FORMING,
        });
        await teamRepo.save(team);
      }

      // 3. Team Slot Reservation Logic: Check team size within transaction
      const currentMembers = await registrationRepo.count({
        where: { teamId: team.id },
      });

      if (currentMembers >= hackathon.maxTeamSize) {
        throw new BadRequestException(
          `This squad is already at full capacity (${hackathon.maxTeamSize} warriors)`,
        );
      }

      // 4. Multi-registration prevention
      const existingReg = await registrationRepo.findOne({
        where: { hackathonId: invitation.hackathonId, studentId: user.id },
      });
      if (existingReg)
        throw new ConflictException(
          'You are already registered for this hackathon',
        );

      // 5. Atomic acceptance
      invitation.status = InvitationStatus.ACCEPTED;
      invitation.acceptedAt = new Date();
      await invitationRepo.save(invitation);

      // Create registration record
      const registration = registrationRepo.create({
        hackathonId: invitation.hackathonId,
        studentId: user.id,
        registrationType: RegistrationType.TEAM,
        teamId: team.id,
        isTeamLead: false,
        status: 'registered',
        name: invitation.invitedName || user.name,
        mobile: invitation.invitedMobile,
        collegeEmail: invitation.invitedTrack?.includes('@')
          ? invitation.invitedTrack
          : undefined,
        highestQualification: !invitation.invitedTrack?.includes('@')
          ? invitation.invitedTrack
          : undefined,
      });

      return await registrationRepo.save(registration);
    });
  }

  async declineInvitation(user: User, invitationId: string) {
    const invitation = await this.invitationsRepository.findOne({
      where: {
        id: invitationId,
        invitedEmail: user.email,
        status: InvitationStatus.PENDING,
      },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');

    invitation.status = InvitationStatus.DECLINED;
    return await this.invitationsRepository.save(invitation);
  }

  async getMyRegistrations(userId: string) {
    const registrations = await this.registrationsRepository.find({
      where: { studentId: userId },
      relations: ['hackathon', 'team'],
      order: { createdAt: 'DESC' },
    });

    return await Promise.all(
      registrations.map(async (reg) => {
        if (reg.teamId) {
          const members = await this.registrationsRepository.find({
            where: { teamId: reg.teamId },
            relations: ['student'],
          });
          return {
            ...reg,
            teamName: reg.team?.name,
            teamMembers: members.map((m) => ({
              id: m.student?.id,
              name: m.name || m.student?.name,
              email: m.student?.email,
              isTeamLead: m.isTeamLead,
            })),
          };
        }
        return reg;
      }),
    );
  }

  async getTeamDetails(userId: string, hackathonId: string) {
    const registration = await this.registrationsRepository.findOne({
      where: {
        hackathonId,
        studentId: userId,
        registrationType: RegistrationType.TEAM,
      },
      relations: ['team', 'hackathon'],
    });

    if (!registration || !registration.teamId) {
      throw new NotFoundException('Team registration not found');
    }

    const members = await this.registrationsRepository.find({
      where: { teamId: registration.teamId },
      relations: ['student'],
    });

    const invitations = await this.invitationsRepository.find({
      where: {
        hackathonId,
        teamName: registration.team.name,
        status: InvitationStatus.PENDING,
      },
    });

    return {
      team: registration.team,
      hackathon: registration.hackathon,
      isLead: registration.isTeamLead,
      members: members.map((m) => ({
        id: m.id,
        studentId: m.student?.id,
        name: m.name || m.student?.name,
        email: m.student?.email || m.invitedEmail,
        isTeamLead: m.isTeamLead,
        joinedAt: m.createdAt,
      })),
      invitations,
    };
  }

  async inviteMember(
    user: User,
    hackathonId: string,
    memberDto: RegisterMemberDto,
  ) {
    const registration = await this.registrationsRepository.findOne({
      where: { hackathonId, studentId: user.id },
      relations: ['team', 'hackathon'],
    });

    if (!registration || !registration.isTeamLead) {
      throw new ForbiddenException(
        'Only the team lead can recruit new warriors',
      );
    }

    const hackathon = registration.hackathon;
    const now = new Date();
    if (hackathon.status !== HackathonStatus.REGISTRATION_OPEN) {
      throw new BadRequestException(
        'The recruitment office is currently closed.',
      );
    }

    const currentMembers = await this.registrationsRepository.count({
      where: { teamId: registration.teamId },
    });
    const pendingInvites = await this.invitationsRepository.count({
      where: {
        hackathonId,
        teamName: registration.team.name,
        status: InvitationStatus.PENDING,
      },
    });

    if (currentMembers + pendingInvites >= hackathon.maxTeamSize) {
      throw new BadRequestException(
        `Team capacity reached (${hackathon.maxTeamSize} warriors max including pending invites)`,
      );
    }

    // Check if user is already registered for this hackathon
    const existingStudent = await this.usersRepository.findOne({
      where: { email: memberDto.email },
    });
    if (existingStudent) {
      const existingReg = await this.registrationsRepository.findOne({
        where: { hackathonId, studentId: existingStudent.id },
      });
      if (existingReg)
        throw new ConflictException(
          'This warrior is already enlisted in another squad',
        );
    }

    // Check for existing pending/accepted invitation (to avoid unique constraint error)
    const existingInvite = await this.invitationsRepository.findOne({
      where: { hackathonId, invitedEmail: memberDto.email },
    });

    if (existingInvite) {
      if (existingInvite.status === InvitationStatus.PENDING) {
        throw new ConflictException(
          'A summons has already been sent to this warrior',
        );
      }
      if (existingInvite.status === InvitationStatus.ACCEPTED) {
        throw new ConflictException(
          'This warrior has already accepted a summons for this battlefield',
        );
      }
      // If declined or expired, we can potentially reuse or delete/recreate.
      // For now, let's delete if it's not pending/accepted so we can re-invite.
      await this.invitationsRepository.remove(existingInvite);
    }

    // Create Invitation
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 48);
    if (expiryDate > hackathon.registrationEnd) {
      expiryDate.setTime(hackathon.registrationEnd.getTime());
    }

    const invitation = this.invitationsRepository.create({
      hackathonId,
      teamName: registration.team.name,
      invitedEmail: memberDto.email,
      invitedName: memberDto.name,
      invitedMobile: memberDto.mobile,
      invitedTrack: memberDto.collegeEmail || memberDto.highestQualification,
      invitedById: user.id,
      status: InvitationStatus.PENDING,
      token: uuid(),
      expiresAt: expiryDate,
    });

    await this.invitationsRepository.save(invitation);
    await this.sendHackathonInvitation(invitation, hackathon.title, user.name);

    return invitation;
  }

  async removeMember(user: User, hackathonId: string, registrationId: string) {
    const leadReg = await this.registrationsRepository.findOne({
      where: { hackathonId, studentId: user.id },
      relations: ['hackathon'],
    });

    if (!leadReg || !leadReg.isTeamLead) {
      throw new ForbiddenException('Only the lead can exile members');
    }

    if (leadReg.hackathon.status !== HackathonStatus.REGISTRATION_OPEN) {
      throw new BadRequestException(
        'The mission has moved past the recruitment phase. Squad composition is frozen.',
      );
    }

    const targetReg = await this.registrationsRepository.findOne({
      where: { id: registrationId, teamId: leadReg.teamId },
    });

    if (!targetReg)
      throw new NotFoundException('Member not found in your squad');
    if (targetReg.studentId === user.id)
      throw new BadRequestException(
        'The lead cannot abandon their own squad. Pass leadership or disband instead.',
      );

    return await this.registrationsRepository.remove(targetReg);
  }

  async revokeInvitation(
    user: User,
    hackathonId: string,
    invitationId: string,
  ) {
    const leadReg = await this.registrationsRepository.findOne({
      where: { hackathonId, studentId: user.id },
    });

    if (!leadReg || !leadReg.isTeamLead) {
      throw new ForbiddenException('Only the lead can revoke summons');
    }

    const invitation = await this.invitationsRepository.findOne({
      where: {
        id: invitationId,
        hackathonId,
        invitedById: user.id,
        status: InvitationStatus.PENDING,
      },
    });

    if (!invitation)
      throw new NotFoundException('Summons not found or already processed');

    invitation.status = InvitationStatus.DECLINED; // Or just delete it? Declined is fine.
    return await this.invitationsRepository.save(invitation);
  }

  async initiateMentorSelection(hackathonId: string) {
    const hackathon = await this.hackathonsRepository.findOne({
      where: { id: hackathonId },
    });
    if (!hackathon) return;

    hackathon.status = HackathonStatus.MENTOR_SELECTION;
    await this.hackathonsRepository.save(hackathon);

    await this.transitionToTeamsForming(hackathonId);
  }

  async transitionToTeamsForming(hackathonId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const hRepo = manager.getRepository(Hackathon);
      const regRepo = manager.getRepository(HackathonRegistration);
      const teamRepo = manager.getRepository(HackathonTeam);
      const inviteRepo = manager.getRepository(HackathonTeamInvitation);
      const teamMemberRepo = manager.getRepository(HackathonTeamMember);

      const hackathon = await hRepo.findOne({ where: { id: hackathonId } });
      if (!hackathon) throw new NotFoundException('Hackathon not found');

      // 1. Expire all pending invitations
      await inviteRepo.update(
        { hackathonId, status: InvitationStatus.PENDING },
        { status: InvitationStatus.EXPIRED },
      );

      // 2. Handle Individual Registrations (Solo Teams)
      const individuals = await regRepo.find({
        where: {
          hackathonId,
          registrationType: RegistrationType.INDIVIDUAL,
          status: 'registered',
        },
        relations: ['student'],
      });

      for (const ind of individuals) {
        // Create a solo team
        const team = teamRepo.create({
          hackathonId,
          name: ind.student?.name || ind.name || 'Solo Participant',
          leadId: ind.studentId,
          status: TeamStatus.PENDING_APPROVAL,
          isLocked: false,
        });
        await teamRepo.save(team);

        // Add as leader in team_members
        const member = teamMemberRepo.create({
          teamId: team.id,
          studentId: ind.studentId,
          role: TeamMemberRole.LEADER,
        });
        await teamMemberRepo.save(member);

        // Update registration to link to team
        ind.teamId = team.id;
        ind.registrationType = RegistrationType.TEAM;
        ind.isTeamLead = true;
        await regRepo.save(ind);
      }

      // 3. Finalize Existing Teams (Teams created via Invitation)
      const teams = await teamRepo.find({
        where: { hackathonId, status: TeamStatus.FORMING },
      });

      for (const team of teams) {
        const members = await regRepo.find({
          where: { teamId: team.id },
        });

        if (members.length >= 1) {
          team.status = TeamStatus.PENDING_APPROVAL;
          team.isLocked = false;
          await teamRepo.save(team);

          // Sync into team_members table
          for (const m of members) {
            const teamMember = teamMemberRepo.create({
              teamId: team.id,
              studentId: m.studentId,
              role: m.isTeamLead
                ? TeamMemberRole.LEADER
                : TeamMemberRole.MEMBER,
            });
            await teamMemberRepo.save(teamMember);
          }
        } else {
          // Empty team? Reject or delete. Let's reject.
          team.status = TeamStatus.REJECTED;
          team.rejectReason = 'Team had no confirmed members';
          await teamRepo.save(team);
        }
      }

      // 5. Perform Automatic Mentor Distribution
      try {
        const distributionResult =
          await this.performMentorDistribution(hackathonId);
        hackathon.isMentorDistributed = true;
        await hRepo.save(hackathon);
      } catch (distError) {
        console.error(
          `Automatic distribution failed for ${hackathonId}:`,
          distError,
        );
      }
    });
  }

  async getAvailableMentors(hackathonId: string) {
    // 1. Get all mentors
    const allMentors = await this.usersRepository.find({
      where: { role: Role.MENTOR },
    });

    // 2. Get already assigned mentors
    const assigned = await this.mentorsRepository.find({
      where: { hackathonId },
    });
    const assignedIds = new Set(assigned.map((a) => a.mentorId));

    // 3. Filter
    return allMentors.filter((m) => !assignedIds.has(m.id));
  }

  async assignMentors(
    hackathonId: string,
    mentorIds: string[],
    type: MentorAssignmentType,
  ) {
    const hackathon = await this.hackathonsRepository.findOne({
      where: { id: hackathonId },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    const now = new Date();
    if (hackathon.mentorSelectionStart && now < hackathon.mentorSelectionStart) {
      throw new BadRequestException('Mentor selection phase has not started yet');
    }
    if (hackathon.mentorSelectionEnd && now > hackathon.mentorSelectionEnd) {
      throw new BadRequestException('Mentor selection phase has ended');
    }

    // 1. Get current assignments for this hackathon
    const currentAssignments = await this.mentorsRepository.find({
      where: { hackathonId },
    });

    const currentMentorIds = new Set(currentAssignments.map((a) => a.mentorId));
    const targetMentorIds = new Set(mentorIds);

    // 2. Identify mentors to remove (those currently assigned but not in the target list)
    const toRemove = currentAssignments.filter(
      (a) => !targetMentorIds.has(a.mentorId),
    );

    // 3. Identify mentors to add (those in the target list but not currently assigned)
    const toAdd = mentorIds.filter((id) => !currentMentorIds.has(id));

    // 4. Execute sync
    if (toRemove.length > 0) {
      await this.mentorsRepository.remove(toRemove);
    }

    if (toAdd.length > 0) {
      const assignments = toAdd.map((mId) =>
        this.mentorsRepository.create({
          hackathonId,
          mentorId: mId,
          assignmentType: type,
        }),
      );
      await this.mentorsRepository.save(assignments);
    }

    // Automatically trigger team distributions to newly added mentors if the hackathon has passed the registration close phase.
    if (hackathon.status === HackathonStatus.APPROVAL_IN_PROGRESS || hackathon.status === HackathonStatus.MENTOR_SELECTION || (hackathon.registrationEnd && now > hackathon.registrationEnd)) {
      await this.performMentorDistribution(hackathonId);
    }

    return {
      message: 'Archon Council records synchronized.',
      added: toAdd.length,
      removed: toRemove.length,
    };
  }

  async removeMentor(hackathonId: string, mentorId: string) {
    const assignment = await this.mentorsRepository.findOne({
      where: { hackathonId, mentorId },
    });

    if (!assignment) {
      throw new NotFoundException('Mentor not found in this hackathon');
    }

    await this.mentorsRepository.remove(assignment);
    return { message: 'Mentor removed from mission roster.' };
  }

  async assignMentorToTeam(
    hackathonId: string,
    mentorId: string,
    teamId: string,
  ) {
    const mentorConfig = await this.mentorsRepository.findOne({
      where: { hackathonId, mentorId },
    });

    if (!mentorConfig)
      throw new BadRequestException(
        'Mentor must be assigned to hackathon first',
      );

    const existing = await this.teamMentorAssignmentsRepository.findOne({
      where: { teamId, mentorId },
    });

    if (existing) return existing;

    const assignment = this.teamMentorAssignmentsRepository.create({
      teamId,
      mentorId,
    });
    return await this.teamMentorAssignmentsRepository.save(assignment);
  }

  async getTeamApprovalList(user: User, hackathonId: string) {
    const hackathon = await this.hackathonsRepository.findOne({
      where: { id: hackathonId },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');
    if (hackathon.status !== HackathonStatus.APPROVAL_IN_PROGRESS) {
      throw new BadRequestException('Team approval phase is not active');
    }

    // Admins can see all pending teams
    if (user.role === Role.ADMIN) {
      return await this.teamsRepository.find({
        where: { hackathonId, status: TeamStatus.PENDING_APPROVAL },
        relations: ['lead', 'hackathon'],
      });
    }

    // Check if mentor is GLOBAL for this hackathon
    const mentorConfig = await this.mentorsRepository.findOne({
      where: { hackathonId, mentorId: user.id },
    });

    if (mentorConfig?.assignmentType === MentorAssignmentType.GLOBAL) {
      return await this.teamsRepository.find({
        where: { hackathonId, status: TeamStatus.PENDING_APPROVAL },
        relations: ['lead', 'hackathon'],
      });
    }

    // Mentors only see teams specifically assigned to them for review
    const specificAssignments = await this.teamMentorAssignmentsRepository.find(
      {
        where: { mentorId: user.id },
        relations: ['team', 'team.lead', 'team.hackathon'],
      },
    );

    return specificAssignments
      .map((a) => a.team)
      .filter(
        (t) =>
          t &&
          t.hackathonId === hackathonId &&
          t.status === TeamStatus.PENDING_APPROVAL,
      );
  }

  async getMentorHackathons(mentorId: string) {
    const assignments = await this.mentorsRepository.find({
      where: { mentorId },
      relations: ['hackathon'],
    });

    const hackathonMap = new Map();

    assignments.forEach((a) => {
      if (!a.hackathon) return;
      const existing = hackathonMap.get(a.hackathon.id);
      // Prioritize GLOBAL if multiple assignments exist
      if (!existing || a.assignmentType === MentorAssignmentType.GLOBAL) {
        hackathonMap.set(a.hackathon.id, {
          ...a.hackathon,
          assignmentType: a.assignmentType,
        });
      }
    });

    return Array.from(hackathonMap.values());
  }

  async getMentorTeams(mentorId: string, hackathonId: string) {
    const hackathon = await this.hackathonsRepository.findOne({ where: { id: hackathonId } });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    // Visibility is persistent and bypasses hackathon status restrictions.

    // Check if mentor is GLOBAL for this hackathon
    const mentorConfig = await this.mentorsRepository.findOne({
      where: { hackathonId, mentorId },
    });

    if (mentorConfig?.assignmentType === MentorAssignmentType.GLOBAL) {
      return await this.teamsRepository.find({
        where: { hackathonId },
        relations: ['lead', 'members', 'members.student', 'hackathon'],
      });
    }

    const assignments = await this.teamMentorAssignmentsRepository.find({
      where: { mentorId },
      relations: [
        'team',
        'team.lead',
        'team.members',
        'team.members.student',
        'team.hackathon',
      ],
    });

    return assignments
      .map((a) => a.team)
      .filter((t) => t && t.hackathonId === hackathonId);
  }

  async approveTeam(user: User, teamId: string) {
    const team = await this.teamsRepository.findOne({
      where: { id: teamId },
      relations: ['hackathon', 'lead'],
    });
    if (!team) throw new NotFoundException('Team not found');

    // New Tactical Mandate: Admins are Observers. Only assigned Mentors (Archons) can execute recruitment decisions.
    if (user.role === Role.ADMIN) {
      throw new ForbiddenException(
        'Admins are only permitted to observe the deployment phase. Deployment clearance must be granted by an assigned Archon.',
      );
    }

    if (team.status !== TeamStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        'Only squads pending approval can be approved',
      );
    }

    const now = new Date();
    if (team.hackathon.approvalEnd && now > team.hackathon.approvalEnd) {
      throw new BadRequestException(
        'Approval phase has ended. No further decisions allowed.',
      );
    }

    const assigned = await this.teamMentorAssignmentsRepository.findOne({
      where: { teamId, mentorId: user.id },
    });

    if (!assigned) {
      const globalMentor = await this.mentorsRepository.findOne({
        where: {
          hackathonId: team.hackathonId,
          mentorId: user.id,
          assignmentType: MentorAssignmentType.GLOBAL,
        },
      });
      if (!globalMentor)
        throw new ForbiddenException(
          'This squad is not assigned to you for tactical clearance',
        );
    }

    team.status = TeamStatus.APPROVED;
    team.isLocked = true;
    team.approvedAt = new Date();
    team.approvedById = user.id;
    await this.teamsRepository.save(team);

    await this.logActivity(
      team.hackathonId,
      ActivityType.TEAM_APPROVED,
      `Squad "${team.name}" cleared for deployment by Archon ${user.name}.`,
      user,
      { teamId: team.id, teamName: team.name, leader: team.lead?.name },
      LogStatus.SUCCESS,
      undefined,
      'APPROVAL_PHASE',
    );

    // Send Approval Email
    try {
      const teamMembers = await this.teamMembersRepository.find({
        where: { teamId: team.id },
        relations: ['student'],
      });

      const emails = [
        team.lead.email,
        ...teamMembers.map((m) => m.student?.email),
      ].filter(Boolean);
      // Deduplicate emails just in case
      const uniqueEmails = Array.from(new Set(emails));

      await this.mailerService.sendMail({
        to: uniqueEmails,
        subject: `Squad Deployment Approved: ${team.hackathon.title}`,
        html: `
                <div style="font-family: Arial, sans-serif; background: #000; color: #fff; padding: 40px; border-radius: 20px; border: 1px solid #10b981;">
                    <h2 style="color: #10b981; text-transform: uppercase; letter-spacing: 2px;">Deployment Confirmed</h2>
                    <p style="font-size: 16px;">Greetings, <strong>${team.name}</strong> Operatives.</p>
                    <p>Your squad has been cleared by HQ for engagement in <strong>${team.hackathon.title}</strong>.</p>
                    <p>Prepare for round one protocols. Godspeed.</p>
                    <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">This is an automated transmission from CodeDabba Command Central.</p>
                </div>
            `,
      });
    } catch (e) {
      console.error('Failed to send approval email', e);
    }

    await this.checkHackathonReady(team.hackathonId);
    return team;
  }

  async rejectTeam(user: User, teamId: string, reason: string) {
    const team = await this.teamsRepository.findOne({
      where: { id: teamId },
      relations: ['hackathon', 'lead'],
    });
    if (!team) throw new NotFoundException('Team not found');

    // New Tactical Mandate: Admins are Observers. Only assigned Mentors (Archons) can execute exile protocols.
    if (user.role === Role.ADMIN) {
      throw new ForbiddenException(
        'Admins are only permitted to observe the deployment phase. Exile protocols must be initiated by an assigned Archon.',
      );
    }

    if (team.status !== TeamStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        'Only squads pending approval can be rejected',
      );
    }

    const now = new Date();
    if (team.hackathon.approvalEnd && now > team.hackathon.approvalEnd) {
      throw new BadRequestException(
        'Approval phase has ended. No further decisions allowed.',
      );
    }

    const assigned = await this.teamMentorAssignmentsRepository.findOne({
      where: { teamId, mentorId: user.id },
    });

    if (!assigned) {
      const globalMentor = await this.mentorsRepository.findOne({
        where: {
          hackathonId: team.hackathonId,
          mentorId: user.id,
          assignmentType: MentorAssignmentType.GLOBAL,
        },
      });
      if (!globalMentor)
        throw new ForbiddenException(
          'This squad is not assigned to you for tactical review',
        );
    }

    team.status = TeamStatus.REJECTED;
    team.rejectReason = reason;
    team.isLocked = true;
    await this.teamsRepository.save(team);

    await this.logActivity(
      team.hackathonId,
      ActivityType.TEAM_REJECTED,
      `Squad "${team.name}" deployment denied by Archon ${user.name}. Reason: ${reason}`,
      user,
      { teamId: team.id, teamName: team.name, reason },
      LogStatus.SUCCESS,
      undefined,
      'APPROVAL_PHASE',
    );

    // Send Rejection Email
    try {
      const teamMembers = await this.teamMembersRepository.find({
        where: { teamId: team.id },
        relations: ['student'],
      });

      const emails = [
        team.lead.email,
        ...teamMembers.map((m) => m.student?.email),
      ].filter(Boolean);
      const uniqueEmails = Array.from(new Set(emails));

      await this.mailerService.sendMail({
        to: uniqueEmails,
        subject: `Selection Update: ${team.hackathon.title}`,
        html: `
                <div style="font-family: Arial, sans-serif; background: #000; color: #fff; padding: 40px; border-radius: 20px; border: 1px solid #ef4444;">
                    <h2 style="color: #ef4444; text-transform: uppercase; letter-spacing: 2px;">Selection Update</h2>
                    <p style="font-size: 16px;">Greetings, <strong>${team.name}</strong> Operatives.</p>
                    <p>We regret to inform you that your squad was not selected for deployment in <strong>${team.hackathon.title}</strong> at this time.</p>
                    <div style="background: #111; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; font-weight: bold; color: #ef4444;">Reason from Mentor:</p>
                        <p style="margin: 5px 0 0 0; color: #ccc; font-style: italic;">${reason}</p>
                    </div>
                    <p>Keep training. Your time will come.</p>
                    <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">This is an automated transmission from CodeDabba Command Central.</p>
                </div>
            `,
      });
    } catch (e) {
      console.error('Failed to send rejection email', e);
    }

    await this.checkHackathonReady(team.hackathonId);
    return team;
  }

  async checkHackathonReady(hackathonId: string) {
    const pendingCount = await this.teamsRepository.count({
      where: { hackathonId, status: TeamStatus.PENDING_APPROVAL },
    });

    if (pendingCount === 0) {
      await this.hackathonsRepository.update(
        { id: hackathonId, status: HackathonStatus.APPROVAL_IN_PROGRESS },
        { status: HackathonStatus.READY_FOR_ROUND_1 },
      );
    }
  }

  async getTeamRoundStatus(teamId: string, hackathonId: string) {
    const team = await this.teamsRepository.findOne({
      where: { id: teamId },
      relations: ['members', 'members.student'],
    });
    if (!team) throw new NotFoundException('Team not found');

    const rounds = await this.roundsRepository.find({
      where: { hackathonId },
      order: { roundNumber: 'ASC' },
    });

    // Determine current round (first active/upcoming or most recent result)
    const currentRound =
      rounds.find((r) => r.status === RoundStatus.SUBMISSION_ACTIVE) ||
      rounds.find((r) => r.status === RoundStatus.EVALUATION_ACTIVE) ||
      rounds.find((r) => r.status === RoundStatus.RESULT_DECLARED) ||
      rounds.find((r) => r.status === RoundStatus.UPCOMING) ||
      rounds.filter((r) => r.status === RoundStatus.CLOSED).pop();

    if (!currentRound) return { team, currentRound: null, submissions: [] };

    const submissions = await this.submissionsRepository.find({
      where: { teamId, roundId: currentRound.id },
      order: { submittedAt: 'DESC' },
    });

    // Enrich submissions with scores if the round is in EVALUATION, RESULT_DECLARED or CLOSED
    const enrichedSubmissions: any[] = [];
    for (const sub of submissions) {
      if (
        currentRound.status === RoundStatus.EVALUATION_ACTIVE ||
        currentRound.status === RoundStatus.RESULT_DECLARED ||
        currentRound.status === RoundStatus.CLOSED
      ) {
        const scores = await this.scoresRepository.find({
          where: { submissionId: sub.id },
          relations: ['mentor'],
        });
        enrichedSubmissions.push({
          ...sub,
          mentorScores: scores.map((s) => ({
            score: s.score,
            remarks: s.remarks,
            mentorName: s.mentor?.name || 'Anonymous Mentor',
          })),
        });
      } else {
        enrichedSubmissions.push(sub);
      }
    }

    return {
      team,
      currentRound,
      submissions: enrichedSubmissions,
      isEliminated: team.status === TeamStatus.ELIMINATED,
    };
  }

  async submitRound(
    user: User,
    teamId: string,
    roundId: string,
    dto: any,
    file?: any,
  ) {
    const now = new Date();

    // 1. Core Validations
    const team = await this.teamsRepository.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');

    const round = await this.roundsRepository.findOne({
      where: { id: roundId },
    });
    if (!round)
      throw new NotFoundException('Mission parameters (round) not found');

    const isMember = await this.teamMembersRepository.findOne({
      where: { teamId, studentId: user.id },
    });

    // Check if user is member/lead of the team
    if (!isMember && team.leadId !== user.id && user.role !== Role.ADMIN) {
      await this.logActivity(
        round.hackathonId,
        ActivityType.UNAUTHORIZED_ACCESS,
        `Unauthorized submission attempt for squad "${team.name}" by user "${user.name}". Access denied.`,
        user,
        { teamId, roundId, actorId: user.id },
        LogStatus.BLOCKED,
        roundId,
        'SUBMISSION_ACTIVE',
      );
      throw new ForbiddenException(
        'You are not authorized to submit for this squad',
      );
    }

    const hackathon = await this.hackathonsRepository.findOne({
      where: { id: round.hackathonId },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    // 2. State Rules
    if (team.status === TeamStatus.ELIMINATED)
      throw new BadRequestException(
        'Squad has been eliminated from active duty',
      );
    if (team.status !== TeamStatus.APPROVED)
      throw new BadRequestException(
        'Squad eligibility not cleared for deployment',
      );

    if (round.status !== RoundStatus.SUBMISSION_ACTIVE) {
      throw new BadRequestException(
        `Round is ${round.status.replace('_', ' ')}. Submissions are only accepted during SUBMISSION ACTIVE status.`,
      );
    }

    if (now > round.submissionEnd) {
      throw new BadRequestException(
        'Deadline has passed. External signal blocked.',
      );
    }

    // 3. Round-Specific Requirements
    if (round.allowGithub && !dto.githubLink && user.role !== Role.ADMIN) {
      throw new BadRequestException(
        'Repository link is required for this mission',
      );
    }

    let documentUrl = null;
    if (file && round.allowDocument) {
      if (file.size > round.maxFileSizeMb * 1024 * 1024) {
        throw new BadRequestException(
          `Payload too large. Max: ${round.maxFileSizeMb} MB`,
        );
      }
      // Cloudinary upload (simplified)
      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.v2.uploader.upload_stream(
            {
              folder: `hackathons/${hackathon.id}/round-${round.roundNumber}/${team.name}`,
              resource_type: 'auto',
              public_id: `submission-v${Date.now()}`,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          );
          uploadStream.end(file.buffer);
        });
        documentUrl = (result as any).secure_url;
      } catch (err) {
        throw new BadRequestException(
          'Teleportation failed (File upload error)',
        );
      }
    }

    // 4. Submission Logic
    return await this.dataSource.transaction(async (manager) => {
      const subRepo = manager.getRepository(HackathonSubmission);

      // Check if squad already submitted for this round
      const existingSubmission = await subRepo.findOne({
        where: { teamId, roundId },
      });

      if (existingSubmission) {
        await this.logActivity(
          round.hackathonId,
          ActivityType.SUBMISSION_BLOCKED,
          `Resubmission attempt blocked for squad "${team?.name}". Strict "one submission" protocol enforced.`,
          user,
          { teamId, roundId, attempt: dto },
          LogStatus.BLOCKED,
          roundId,
          hackathon.status,
        );
        throw new BadRequestException(
          'Squad has already submitted for this mission. Resubmissions or edits are strictly prohibited.',
        );
      }

      const submission = subRepo.create({
        hackathonId: round.hackathonId,
        teamId,
        roundId,
        documentUrl: documentUrl || dto.documentUrl, // Support both direct upload and link
        githubLink: dto.githubLink,
        videoUrl: dto.videoUrl,
        description: dto.description,
      });

      const saved = await subRepo.save(submission);

      // Optional: Update Hackathon status to ROUND_ACTIVE if it was just READY
      if (hackathon.status === HackathonStatus.READY_FOR_ROUND_1) {
        await manager
          .getRepository(Hackathon)
          .update(hackathon.id, { status: HackathonStatus.ROUND_ACTIVE });
      }

      // Log submission activity
      await this.logActivity(
        round.hackathonId,
        ActivityType.SUBMISSION_CREATED,
        `Squad "${team?.name || 'Unknown'}" successfully submitted mission artifact for Round ${round.roundNumber}.`,
        user,
        { submissionId: saved.id, github: dto.githubLink, video: dto.videoUrl },
        LogStatus.SUCCESS,
        roundId,
        hackathon.status,
      );

      return saved;
    });
  }

  async getTeamSubmissions(teamId: string, roundId: string) {
    return await this.submissionsRepository.find({
      where: { teamId, roundId },
      order: { submittedAt: 'DESC' },
    });
  }

  async evaluateSubmission(
    user: User,
    submissionId: string,
    score: number,
    feedback: string,
  ) {
    const submission = await this.submissionsRepository.findOne({
      where: { id: submissionId },
      relations: ['team', 'round', 'hackathon'],
    });

    if (!submission) throw new NotFoundException('Submission not found');

    if (submission.team.status !== TeamStatus.APPROVED) {
      throw new BadRequestException(
        'Scores can only be given to approved squads',
      );
    }

    const now = new Date();

    if (submission.hackathon.status !== HackathonStatus.ROUND_EVALUATION) {
      throw new BadRequestException('Scores can only be submitted during the ROUND_EVALUATION phase');
    }

    if (
      !submission.round.evaluationStart ||
      !submission.round.evaluationEnd ||
      now < submission.round.evaluationStart ||
      now > submission.round.evaluationEnd
    ) {
      throw new BadRequestException('Current time is outside the strict evaluation window');
    }

    // New Tactical Mandate: Admins are Observers. Only assigned Mentors (Archons) can execute evaluations.
    if (user.role === Role.ADMIN) {
      throw new ForbiddenException(
        'Admins are only permitted to observe. Evaluation protocols must be executed by an assigned Archon.',
      );
    }
    // Check specific assignment
    const assignment = await this.teamMentorAssignmentsRepository.findOne({
      where: { teamId: submission.teamId, mentorId: user.id },
    });
    // If not specifically assigned, check if they are a mentor for the hackathon (Global)?
    // Usually grading is specific. Let's enforce specific or global assignment.

    if (!assignment) {
      const globalMentor = await this.mentorsRepository.findOne({
        where: {
          hackathonId: submission.hackathonId,
          mentorId: user.id,
          assignmentType: MentorAssignmentType.GLOBAL,
        },
      });
      if (!globalMentor)
        throw new ForbiddenException(
          'You are not authorized to evaluate this squad',
        );
    }

    submission.score = score;
    submission.feedback = feedback;
    submission.evaluatedById = user.id;
    submission.evaluatedAt = new Date();

    await this.submissionsRepository.save(submission);

    // Centralized Scoring: Create or update record in HackathonScore for aggregate visibility and multi-mentor support
    let hackathonScore = await this.scoresRepository.findOne({
      where: { submissionId, mentorId: user.id },
    });

    if (hackathonScore) {
      hackathonScore.score = score;
      hackathonScore.remarks = feedback;
    } else {
      hackathonScore = this.scoresRepository.create({
        hackathonId: submission.hackathonId,
        roundId: submission.roundId,
        submissionId,
        teamId: submission.teamId,
        mentorId: user.id,
        score,
        remarks: feedback,
      });
    }
    await this.scoresRepository.save(hackathonScore);

    // Recalculate team-round aggregate score
    await this.calculateAndSaveFinalScore(submissionId);

    await this.logActivity(
      submission.hackathonId,
      ActivityType.EVALUATION_SUBMITTED,
      `Archon "${user.name}" finalized evaluation for Squad "${submission.team?.name}". Final Combat Score: ${score}/10`,
      user,
      { 
        submissionId, 
        teamId: submission.teamId, 
        score, 
        feedbackLength: feedback.length,
        roundNumber: submission.round?.roundNumber 
      },
      LogStatus.SUCCESS,
      submission.roundId,
      submission.hackathon?.status,
    );

    // Notify Team Lead
    const team = submission.team;
    const lead = await this.usersRepository.findOne({
      where: { id: team.leadId },
    }); 

    if (lead) {
      try {
        await this.mailerService.sendMail({
          to: lead.email,
          subject: `Mission Update: Round ${submission.round.roundNumber} Eval Received`,
          html: `
                        <div style="font-family: Arial, sans-serif; background: #000; color: #fff; padding: 40px; border-radius: 20px; border: 1px solid #10b981;">
                            <h2 style="color: #10b981; text-transform: uppercase;">Evaluation Complete</h2>
                            <p>Your squad's submission for <strong>Round ${submission.round.roundNumber}</strong> has been processed.</p>
                            <div style="margin: 20px 0; padding: 20px; bg-color: #111; border: 1px solid #333;">
                                <p style="font-size: 24px; font-weight: bold; color: #fff;">Score: ${score}</p>
                                <p style="color: #ccc; font-style: italic;">"${feedback}"</p>
                            </div>
                             <p style="font-size: 12px; color: #666;">CodeDabba Command</p>
                        </div>
                    `,
        });
      } catch (e) {
        console.error('Failed to send grade email', e);
      }
    }

    return submission;

  }

  async submitScore(
    user: User,
    submissionId: string,
    score: number,
    remarks: string,
  ) {
    const submission = await this.submissionsRepository.findOne({
      where: { id: submissionId },
      relations: ['team', 'round', 'hackathon'],
    });

    if (!submission) throw new NotFoundException('Submission not found');

    if (submission.team.status !== TeamStatus.APPROVED) {
      throw new BadRequestException(
        'Scores can only be given to approved squads',
      );
    }

    const now = new Date();
    if (
      submission.round.evaluationEnd &&
      now > submission.round.evaluationEnd
    ) {
      throw new BadRequestException('Evaluation time has ended');
    }

    if (
      submission.round.status !== RoundStatus.EVALUATION_ACTIVE &&
      submission.round.status !== RoundStatus.SUBMISSION_ACTIVE
    ) {
      throw new BadRequestException(
        'Scoring protocol is only active during SUBMISSION or EVALUATION phase',
      );
    }

    // New Tactical Mandate: Admins are Observers. Only assigned Mentors (Archons) can submit scores.
    if (user.role === Role.ADMIN) {
      throw new ForbiddenException(
        'Admins are only permitted to observe. Scoring protocols must be executed by an assigned Archon.',
      );
    }
    const assignment = await this.teamMentorAssignmentsRepository.findOne({
      where: { teamId: submission.teamId, mentorId: user.id },
    });
    if (!assignment) {
      const globalMentor = await this.mentorsRepository.findOne({
        where: {
          hackathonId: submission.hackathonId,
          mentorId: user.id,
          assignmentType: MentorAssignmentType.GLOBAL,
        },
      });
      if (!globalMentor)
        throw new ForbiddenException(
          'You are not authorized to judge this squad',
        );
    }

    // Save Score
    let hackathonScore = await this.scoresRepository.findOne({
      where: { submissionId, mentorId: user.id },
    });

    if (hackathonScore) {
      hackathonScore.score = score;
      hackathonScore.remarks = remarks;
    } else {
      hackathonScore = this.scoresRepository.create({
        hackathonId: submission.hackathonId,
        roundId: submission.roundId,
        submissionId,
        teamId: submission.teamId,
        mentorId: user.id,
        score,
        remarks,
      });
    }

    await this.scoresRepository.save(hackathonScore);

    // Check if all assigned mentors have scored to update finalScore
    await this.calculateAndSaveFinalScore(submissionId);

    return hackathonScore;
  }

  private async calculateAndSaveFinalScore(submissionId: string) {
    const submission = await this.submissionsRepository.findOne({
      where: { id: submissionId },
      relations: ['team', 'round'],
    });

    if (!submission) return;

    // Get all mentors assigned to this team
    const assignments = await this.teamMentorAssignmentsRepository.find({
      where: { teamId: submission.teamId },
    });

    // Get all scores for this submission
    const scores = await this.scoresRepository.find({
      where: { submissionId },
    });

    // If specific assignments exist, we wait for all of them
    const assignedMentorIds = assignments.map((a) => a.mentorId);

    // If no specific assignments, check if there are any global mentors (this part is tricky if we don't know who is supposed to score)
    // For now, let's assume if there are specific assignments, we wait for all.
    // If not, we take what we have when admin finalizes.

    if (assignedMentorIds.length > 0) {
      const scoredMentorIds = scores.map((s) => s.mentorId);
      const allScored = assignedMentorIds.every((id) =>
        scoredMentorIds.includes(id),
      );

      if (allScored) {
        const avgScore =
          scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
        submission.finalScore = avgScore;
        submission.isScored = true;
        await this.submissionsRepository.save(submission);
      }
    } else {
      // If no specific assignments, maybe just one global mentor scores?
      // We'll calculate average of whatever scores exist when admin finalizes or if at least one exists.
      if (scores.length > 0) {
        const avgScore =
          scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
        submission.finalScore = avgScore;
        submission.isScored = true;
        await this.submissionsRepository.save(submission);
      }
    }
  }

  async finalizeRound(user: User, roundId: string) {
    if (user.role !== Role.ADMIN) throw new ForbiddenException('Admin only');
    return await this.performRoundFinalization(roundId);
  }

  private async performRoundFinalization(roundId: string) {
    const round = await this.roundsRepository.findOne({
      where: { id: roundId },
      relations: ['hackathon', 'hackathon.rounds'],
    });

    if (!round) throw new NotFoundException('Round not found');
    // If already finalized, just return (idempotent)
    if (round.isScoringFinalized) return;
    // Admin can force calculation and then apply eliminations
    await this.performRoundCalculation(roundId);
    await this.applyEliminationsAndPromotions(roundId);

    await this.logActivity(
      round.hackathonId,
      ActivityType.ROUND_FINALIZATION,
      `Mission "${round.title}" scouting phase finalized. Combat scores aggregated. Tactical promoting cycle complete.`,
      'SYSTEM',
      { roundId, roundTitle: round.title },
      LogStatus.SUCCESS,
      roundId,
      round.hackathon?.status,
    );

    return {
      message:
        'Round finalized. Leaderboard updated. Tactical survivors promoted.',
    };
  }

  async performRoundCalculation(roundId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const roundsRepo = manager.getRepository(HackathonRound);
      const submissionsRepo = manager.getRepository(HackathonSubmission);
      const scoresRepo = manager.getRepository(HackathonScore);
      const leaderboardRepo = manager.getRepository(HackathonLeaderboard);
      const teamsRepo = manager.getRepository(HackathonTeam);

      const round = await roundsRepo.findOne({
        where: { id: roundId },
        relations: ['hackathon', 'hackathon.rounds'],
      });
      if (!round) throw new NotFoundException('Round not found');
      // If already finalized, just return (idempotent)
      if (round.isScoringFinalized) return;

      // 1. Process all approved teams for scores
      const teams = await teamsRepo.find({
        where: { hackathonId: round.hackathonId, status: TeamStatus.APPROVED },
      });

      const roundResults: any[] = [];

      for (const team of teams) {
        const submission = await submissionsRepo.findOne({
          where: { teamId: team.id, roundId: round.id },
        });

        let roundScore = 0;
        const submissionTimestamp = submission?.submittedAt || new Date(0);

        if (submission) {
          const scores = await scoresRepo.find({
            where: { submissionId: submission.id },
          });
          if (scores.length > 0) {
            roundScore =
              scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
          } else {
            // Fallback to existing scores if no multi-judge entries exist
            roundScore = submission.finalScore || submission.score || 0;
          }

          submission.finalScore = roundScore;
          submission.isScored = true;
          await submissionsRepo.save(submission);
        }

        roundResults.push({ team, roundScore, submissionTimestamp });
      }

      // 2. Sort by Round Result (for Round Rank) + Handle Ties
      roundResults.sort((a, b) => {
        if (b.roundScore !== a.roundScore) return b.roundScore - a.roundScore;
        // Tie breaker: Earlier submission
        return (
          a.submissionTimestamp.getTime() - b.submissionTimestamp.getTime()
        );
      });

      // 3. Update Cumulative & Save Round Snapshot
      for (let i = 0; i < roundResults.length; i++) {
        const result = roundResults[i];
        const team = result.team;
        const roundRank = i + 1;

        // Calculate cumulative score: (round_score * weightage%) + previous_cumulative
        const previousEntry = await leaderboardRepo.findOne({
          where: { teamId: team.id, roundId: IsNull() }, // IsNull() means cumulative snapshot
        });

        const weightedRoundScore =
          (result.roundScore * round.weightagePercentage) / 100;
        const newCumulative =
          (previousEntry?.cumulativeScore || 0) + weightedRoundScore;

        // Save Round Snapshot
        const roundSnapshot = leaderboardRepo.create({
          hackathonId: round.hackathonId,
          teamId: team.id,
          roundId: round.id,
          roundScore: result.roundScore,
          cumulativeScore: newCumulative,
          rank: roundRank,
        });
        await leaderboardRepo.save(roundSnapshot);

        // Update/Create Cumulative Entry
        if (previousEntry) {
          previousEntry.cumulativeScore = newCumulative;
          previousEntry.previousRank = previousEntry.rank;
          await leaderboardRepo.save(previousEntry);
        } else {
          const newEntry = leaderboardRepo.create({
            hackathonId: round.hackathonId,
            teamId: team.id,
            roundId: null,
            roundScore: 0,
            cumulativeScore: newCumulative,
            rank: 0,
          });
          await leaderboardRepo.save(newEntry);
        }
      }

      // 4. Update overall ranks on cumulative entries
      const allCumulative = await leaderboardRepo.find({
        where: { hackathonId: round.hackathonId, roundId: IsNull() },
        relations: ['team'],
      });

      // Sort cumulative entries
      allCumulative.sort((a, b) => {
        if (b.cumulativeScore !== a.cumulativeScore)
          return b.cumulativeScore - a.cumulativeScore;
        return 0; // Cumulative ties are fine, or add more logic
      });

      for (let i = 0; i < allCumulative.length; i++) {
        allCumulative[i].rank = i + 1;
        await leaderboardRepo.save(allCumulative[i]);
      }

      // 5. Mark round as scoring finalized and closed
      round.status = RoundStatus.CLOSED; // Or RESULT_DECLARED if that's the next state
      round.isScoringFinalized = true;
      await roundsRepo.save(round);
    });
  }

  async applyEliminationsAndPromotions(roundId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const roundsRepo = manager.getRepository(HackathonRound);
      const teamsRepo = manager.getRepository(HackathonTeam);
      const leaderboardRepo = manager.getRepository(HackathonLeaderboard);
      const hackathonsRepo = manager.getRepository(Hackathon);

      const round = await roundsRepo.findOne({
        where: { id: roundId },
        relations: ['hackathon', 'hackathon.rounds'],
      });
      if (!round) throw new NotFoundException('Round not found');

      const roundResults = await leaderboardRepo.find({
        where: { roundId: round.id },
        relations: ['team'],
      });

      for (const result of roundResults) {
        const team = await teamsRepo.findOne({ where: { id: result.teamId } });
        if (team && team.status === TeamStatus.APPROVED) {
          if (round.isElimination && round.eliminationThreshold !== null) {
            if (result.roundScore < round.eliminationThreshold) {
              team.status = TeamStatus.ELIMINATED;
              await manager.save(team);
              await this.logActivity(
                round.hackathonId,
                ActivityType.ELIMINATION,
                `Squad "${team.name}" failed to meet performance thresholds. Elimination protocol executed.`,
                'SYSTEM',
              );
            } else {
              team.currentRound += 1;
              await manager.save(team);
              await this.logActivity(
                round.hackathonId,
                ActivityType.STATUS_CHANGE,
                `Squad "${team.name}" cleared for next deployment phase.`,
                'SYSTEM',
              );
            }
          } else {
            team.currentRound += 1;
            await manager.save(team);
          }
        }
      }

      // Check if this was the last round & Handle auto-completion
      const sortedRounds = round.hackathon.rounds.sort(
        (a, b) => a.roundNumber - b.roundNumber,
      );
      const isLastRound = !sortedRounds.find(
        (r) => r.roundNumber === round.roundNumber + 1,
      );

      const hackathon = await hackathonsRepo.findOne({
        where: { id: round.hackathonId },
      });
      if (hackathon) {
        if (isLastRound) {
          hackathon.status = HackathonStatus.COMPLETED;
          // Mark winners
          const allCumulative = await leaderboardRepo.find({
            where: { hackathonId: round.hackathonId, roundId: IsNull() },
            order: { rank: 'ASC' },
          });

          for (let i = 0; i < Math.min(allCumulative.length, 3); i++) {
            const topTeam = await teamsRepo.findOne({
              where: { id: allCumulative[i].teamId },
            });
            if (topTeam && topTeam.status !== TeamStatus.ELIMINATED) {
              if (i === 0) {
                topTeam.status = TeamStatus.WINNER;
                topTeam.finalPosition = 'Winner';
                await this.logActivity(
                  round.hackathonId,
                  ActivityType.STATUS_CHANGE,
                  `🏆 Squad "${topTeam.name}" declared mission champions!`,
                  'SYSTEM',
                );
              } else if (i === 1) topTeam.finalPosition = 'Runner Up';
              else if (i === 2) topTeam.finalPosition = 'Third Place';
              await manager.save(topTeam);
            }
          }
        }
        await hackathonsRepo.save(hackathon);
      }
      // Set round status to RESULT_DECLARED after eliminations/promotions and winner marking
      round.status = RoundStatus.RESULT_DECLARED;
      await roundsRepo.save(round);
    });
  }

  async getSubmissionScores(submissionId: string) {
    return await this.scoresRepository.find({
      where: { submissionId },
      relations: ['mentor'],
    });
  }

  async getTeamJudgingStatus(hackathonId: string, roundId: string) {
    const teams = await this.teamsRepository.find({
      where: { hackathonId, status: TeamStatus.APPROVED },
      relations: ['lead'],
    });

    const statusList: any[] = [];

    for (const team of teams) {
      const submission = await this.submissionsRepository.findOne({
        where: { teamId: team.id, roundId },
      });

      const scores = submission
        ? await this.scoresRepository.find({
            where: { submissionId: submission.id },
          })
        : [];

      statusList.push({
        teamId: team.id,
        teamName: team.name,
        hasSubmission: !!submission,
        submissionId: submission?.id,
        scoreCount: scores.length,
        isScored: submission?.isScored || false,
        finalScore: submission?.finalScore || null,
      });
    }

    return statusList;
  }

  async getUploadUrl(filename: string, contentType: string) {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

    // Sanitize filename and create a public_id
    const publicId = `hackathons/banners/${timestamp}-${filename.replace(/[^a-zA-Z0-9]/g, '_')}`;

    const signature = cloudinary.v2.utils.api_sign_request(
      {
        timestamp: timestamp,
        public_id: publicId,
      },
      process.env.CLOUDINARY_API_SECRET!,
    );

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      publicUrl: `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`,
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName,
      publicId,
    };
  }

  async getLeaderboard(hackathonId: string, roundId?: string) {
    const where: any = { hackathonId };

    if (roundId) {
      where.roundId = roundId;
    } else {
      where.roundId = IsNull();
    }

    const entries = await this.leaderboardRepository.find({
      where,
      relations: ['team', 'team.lead'],
      order: { rank: 'ASC' },
    });

    // Enrich with round info if specific round
    let roundInfo: HackathonRound | null = null;
    if (roundId) {
      roundInfo = await this.roundsRepository.findOne({
        where: { id: roundId },
      });
    }

    const hackathon = await this.hackathonsRepository.findOne({
      where: { id: hackathonId },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    return {
      hackathonId: hackathon.id,
      hackathonTitle: hackathon.title,
      hackathonStatus: hackathon.status,
      roundId: roundId || 'overall',
      roundTitle: roundInfo?.title || 'Overall Standings',
      entries: entries.map((e) => ({
        rank: e.rank,
        previousRank: e.previousRank,
        teamName: e.team.name,
        teamId: e.team.id,
        leadName: e.team.lead?.name,
        roundScore: e.roundScore,
        cumulativeScore: e.cumulativeScore,
        status: e.team.status,
        finalPosition: e.team.finalPosition,
      })),
    };
  }

  async getAdminOverview(id: string) {
    const hackathon = await this.hackathonsRepository.findOne({
      where: { id },
      relations: ['rounds', 'mentors', 'mentors.mentor'],
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    const totalParticipants = await this.registrationsRepository.count({
      where: { hackathonId: id },
    });
    const totalTeams = await this.registrationsRepository.count({
      where: [
        { hackathonId: id, registrationType: RegistrationType.INDIVIDUAL },
        { hackathonId: id, isTeamLead: true },
      ],
    });

    const approvedTeamsCount = await this.teamsRepository.count({
      where: { hackathonId: id, status: In([TeamStatus.APPROVED, TeamStatus.WINNER]) },
    });
    const rejectedTeamsCount = await this.teamsRepository.count({
      where: { hackathonId: id, status: TeamStatus.REJECTED },
    });
    const eliminatedTeamsCount = await this.teamsRepository.count({
      where: { hackathonId: id, status: TeamStatus.ELIMINATED },
    });
    const pendingTeamsCount = await this.teamsRepository.count({
      where: { hackathonId: id, status: TeamStatus.PENDING_APPROVAL },
    });

    return {
      ...hackathon,
      stats: {
        totalParticipants,
        totalTeams,
        approvedTeams: approvedTeamsCount,
        rejectedTeams: rejectedTeamsCount,
        eliminatedTeams: eliminatedTeamsCount,
        pendingTeams: pendingTeamsCount,
        activeTeams: approvedTeamsCount,
      },
    };
  }

  async getAdminActivities(id: string) {
    return await this.activityLogsRepository.find({
      where: { hackathonId: id },
      relations: ['performedBy'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async getAdminTeams(id: string, user: User) {
    let teams: HackathonTeam[] = [];

    if (user.role === Role.ADMIN) {
      teams = await this.teamsRepository.find({
        where: { hackathonId: id },
        relations: ['lead', 'members', 'members.student'],
      });
    } else if (user.role === Role.MENTOR) {
      const mentorConfig = await this.mentorsRepository.findOne({
        where: { hackathonId: id, mentorId: user.id },
      });

      if (!mentorConfig) {
        throw new ForbiddenException('Not assigned to this hackathon');
      }

      if (mentorConfig.assignmentType === MentorAssignmentType.GLOBAL) {
        teams = await this.teamsRepository.find({
          where: { hackathonId: id },
          relations: ['lead', 'members', 'members.student'],
        });
      } else {
        const assignments = await this.teamMentorAssignmentsRepository.find({
          where: { mentorId: user.id },
          relations: ['team'],
        });

        const teamIds = assignments.map((a) => a.teamId);
        if (teamIds.length === 0) return [];

        teams = await this.teamsRepository.find({
          where: { id: In(teamIds), hackathonId: id },
          relations: ['lead', 'members', 'members.student'],
        });
      }
    } else {
      throw new ForbiddenException('Unauthorized access to team roster');
    }

    if (teams.length === 0) return [];

    const assignments = await this.teamMentorAssignmentsRepository.find({
      where: { teamId: In(teams.map((t) => t.id)) },
      relations: ['mentor'],
    });

    const latestSubmissions = await this.submissionsRepository.find({
      where: { hackathonId: id },
      relations: ['round'],
    });

    return teams.map((t) => ({
      ...t,
      mentors: assignments
        .filter((a) => a.teamId === t.id)
        .map((a) => a.mentor),
      latestSubmission: latestSubmissions.find((s) => s.teamId === t.id),
    }));
  }

  async getSubmissionDetails(user: User, submissionId: string) {
    const submission = await this.submissionsRepository.findOne({
      where: { id: submissionId },
      relations: ['team', 'round', 'hackathon'],
    });
    if (!submission) throw new NotFoundException('Submission not found');

    if (user.role === Role.MENTOR) {
      const teamId = submission.teamId;
      const assigned = await this.teamMentorAssignmentsRepository.findOne({
        where: { teamId, mentorId: user.id },
      });
      if (!assigned) {
        const globalMentor = await this.mentorsRepository.findOne({
          where: {
            hackathonId: submission.hackathonId,
            mentorId: user.id,
            assignmentType: MentorAssignmentType.GLOBAL,
          },
        });
        if (!globalMentor)
          throw new ForbiddenException(
            'Not authorized to view this submission',
          );
      }
    }

    const evaluations = await this.scoresRepository.find({
      where: { submissionId },
      relations: ['mentor'],
    });

    const history = await this.submissionsRepository.find({
      where: { teamId: submission.teamId, roundId: submission.roundId },
      order: { submittedAt: 'DESC' },
    });

    return {
      ...submission,
      evaluations,
      history,
    };
  }

  async getAdminTeamDetails(user: User, teamId: string) {
    // Fetch team with hackathon, lead, and members' student profiles
    const team = await this.teamsRepository.findOne({
      where: { id: teamId },
      relations: [
        'lead',
        'members',
        'members.student',
        'hackathon',
        'hackathon.rounds',
      ],
    });

    if (!team)
      throw new NotFoundException(
        'Squad records not found in the collective database.',
      );

    if (user.role === Role.MENTOR) {
      const assigned = await this.teamMentorAssignmentsRepository.findOne({
        where: { teamId, mentorId: user.id },
      });

      if (!assigned) {
        const globalMentor = await this.mentorsRepository.findOne({
          where: {
            hackathonId: team.hackathonId,
            mentorId: user.id,
            assignmentType: MentorAssignmentType.GLOBAL,
          },
        });

        if (!globalMentor) {
          throw new ForbiddenException('Not authorized to view this team');
        }
      }
    }

    // 1. Fetch assigned Mentors (Archons)
    const assignments = await this.teamMentorAssignmentsRepository.find({
      where: { teamId },
      relations: ['mentor'],
    });
    const teamMentors = assignments.map((a) => a.mentor);

    // 2. Prepare Rounds Data with detailed submissions
    const sortedRounds = team.hackathon.rounds.sort(
      (a, b) => a.roundNumber - b.roundNumber,
    );
    const roundsData = await Promise.all(
      sortedRounds.map(async (round) => {
        const submissions = await this.submissionsRepository.find({
          where: { teamId, roundId: round.id },
          relations: ['evaluatedBy'],
          order: { submittedAt: 'DESC' },
        });

        return {
          id: round.id,
          roundNumber: round.roundNumber,
          title: round.title,
          submissions,
        };
      }),
    );

    // 3. Fetch Evaluations across all missions
    let evaluations = await this.scoresRepository.find({
      where: { teamId },
      relations: ['mentor', 'round'],
    });

    // 3.5 Compatibility: Aggressively collect evaluations stored directly on submissions
    const allSubmissions = await this.submissionsRepository.find({
      where: { teamId },
      relations: ['evaluatedBy', 'round'],
      order: { submittedAt: 'DESC' }, // Process latest first
    });

    const seenRounds = new Set(evaluations.map((e) => e.roundId));

    for (const sub of allSubmissions) {
      if (sub.score !== null && sub.score !== undefined) {
        // Only take the latest evaluation for each round if we don't already have one
        if (!seenRounds.has(sub.roundId)) {
          evaluations.push({
            id: sub.id,
            submissionId: sub.id,
            mentorId: sub.evaluatedById,
            mentor: sub.evaluatedBy,
            score: Number(sub.score),
            remarks: sub.feedback,
            feedback: sub.feedback,
            roundId: sub.roundId,
            round: sub.round,
            roundTitle: sub.round?.title || 'Unknown Mission',
            createdAt: sub.evaluatedAt || sub.submittedAt,
          } as any);
          seenRounds.add(sub.roundId);
        }
      }
    }

    // 4. Calculate Scoring Info
    const totalScore = evaluations.reduce(
      (acc, curr) => acc + Number(curr.score || 0),
      0,
    );

    // Find latest round score
    const lastRoundId = sortedRounds[sortedRounds.length - 1]?.id;
    const lastRoundScore = evaluations
      .filter((e) => e.roundId === lastRoundId)
      .reduce((acc, curr) => acc + (curr.score || 0), 0);

    const averageLastRoundScore =
      evaluations.filter((e) => e.roundId === lastRoundId).length > 0
        ? lastRoundScore /
          evaluations.filter((e) => e.roundId === lastRoundId).length
        : 0;

    // 5. Final Data Assembly
    return {
      ...team,
      members: team.members.map((m) => ({
        id: m.id,
        student: m.student,
        isTeamLead: m.studentId === team.leadId,
      })),
      mentors: teamMentors,
      roundsData,
      evaluations: evaluations.map((e) => ({
        ...e,
        roundTitle: e.round?.title,
      })),
      scoringInfo: {
        roundScore: averageLastRoundScore,
        weightedScore: averageLastRoundScore * 1.5, // Logic for weighted impact calculation
        totalScore: totalScore,
      },
    };
  }

  // --- Admin God Mode Functions ---
  async deleteHackathonAdmin(id: string): Promise<{ message: string }> {
    const hackathon = await this.hackathonsRepository.findOne({
      where: { id },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    // Due to TypeORM cascade setup, removing the hackathon should delete its child records
    // (teams, rounds, mentor assignments, registrations, etc.)
    await this.hackathonsRepository.remove(hackathon);

    return { message: 'Hackathon successfully deleted.' };
  }

  async deleteTeamAdmin(hackathonId: string, teamId: string): Promise<{ message: string }> {
    const team = await this.teamsRepository.findOne({
      where: { id: teamId, hackathonId },
    });
    if (!team) throw new NotFoundException('Team not found');

    await this.teamsRepository.remove(team);

    return { message: 'Team successfully removed.' };
  }
}
