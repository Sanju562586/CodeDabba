import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { Certificate, CertificateType } from '../../entities/certificate.entity';
import { User } from '../../entities/user.entity';
import { Hackathon, HackathonStatus } from '../../entities/hackathon.entity';
import { Course } from '../../entities/course.entity';
import { HackathonTeam, TeamStatus } from '../../entities/hackathon-team.entity';
import { HackathonLeaderboard } from '../../entities/hackathon-leaderboard.entity';
import { HackathonsLoggingService } from '../hackathons/hackathons-logging.service';
import { ActivityType, LogStatus } from '../../entities/hackathon-activity-log.entity';
import * as PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import * as cloudinary from 'cloudinary';
import { PassThrough } from 'stream';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate)
    private certificatesRepository: Repository<Certificate>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Hackathon)
    private hackathonsRepository: Repository<Hackathon>,
    @InjectRepository(Course)
    private coursesRepository: Repository<Course>,
    @InjectRepository(HackathonTeam)
    private teamsRepository: Repository<HackathonTeam>,
    @InjectRepository(HackathonLeaderboard)
    private leaderboardRepository: Repository<HackathonLeaderboard>,
    private readonly loggingService: HackathonsLoggingService,
    private readonly mailerService: MailerService,
    private dataSource: DataSource,
  ) {}

  async findByUser(userId: string) {
    return await this.certificatesRepository.find({
      where: { userId },
      relations: ['hackathon', 'course'],
      order: { createdAt: 'DESC' },
    });
  }

  async verify(certificateId: string) {
    return await this.certificatesRepository.createQueryBuilder('certificate')
      .leftJoinAndSelect('certificate.user', 'user')
      .leftJoinAndSelect('certificate.hackathon', 'hackathon')
      .leftJoinAndSelect('certificate.course', 'course')
      .where('certificate.certificateId = :certificateId', { certificateId })
      .getOne();
  }

  async findByUserAndHackathon(userId: string, hackathonId: string) {
    return await this.certificatesRepository.findOne({
      where: { userId, hackathonId },
    });
  }

  async findByUserAndCourse(userId: string, courseId: string) {
    return await this.certificatesRepository.findOne({
      where: { userId, courseId },
    });
  }

  async generate(userId: string, hackathonId: string) {
    const hackathon = await this.hackathonsRepository.findOne({
      where: { id: hackathonId },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');
    
    if (hackathon.status !== HackathonStatus.COMPLETED) {
      throw new BadRequestException('Certificates can only be generated after hackathon completion.');
    }

    const existing = await this.findByUserAndHackathon(userId, hackathonId);
    if (existing) return existing;

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const team = await this.teamsRepository.createQueryBuilder('team')
      .innerJoin('team.members', 'member')
      .where('team.hackathonId = :hackathonId', { hackathonId })
      .andWhere('member.studentId = :userId', { userId })
      .andWhere('team.status IN (:...statuses)', { statuses: [TeamStatus.APPROVED, TeamStatus.WINNER, TeamStatus.ELIMINATED] })
      .getOne();
    
    if (!team) {
      throw new BadRequestException('You do not have an approved team in this hackathon.');
    }

    const rankEntry = await this.leaderboardRepository.findOne({
      where: { teamId: team.id, roundId: IsNull() },
    });

    const isWinner = rankEntry?.rank && rankEntry.rank <= 3;
    const position = isWinner ? `${this.getOrdinal(rankEntry.rank)} Place` : null;
    const certType = isWinner ? CertificateType.WINNER : CertificateType.PARTICIPATION;

    const year = new Date().getFullYear();
    const certificateId = `CD-${year}-${hackathonId.substring(0, 4)}-${userId.substring(0, 4)}`.toUpperCase();

    const fileUrl = `${process.env.API_URL || 'http://localhost:5000'}/certificates/${certificateId}/download`;
    const buffer = await this.generateCertificateBuffer(user, hackathon, team, rankEntry, certificateId);

    const certificate = this.certificatesRepository.create({
      certificateId,
      userId,
      hackathonId,
      type: certType,
      teamName: hackathon.maxTeamSize > 1 ? team.name : null,
      position,
      fileUrl,
    } as any);

    const saved = await this.certificatesRepository.save(certificate);

    // Send Email Notification
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: '🎉 Your Hackathon Certificate',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded: 12px;">
            <h1 style="color: #4f46e5; font-size: 24px; font-weight: 800; margin-bottom: 16px;">Congratulations, ${user.name}!</h1>
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">Your mission in <strong>${hackathon.title}</strong> has been officially recognized. Your certificate is attached to this transmission.</p>
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">You can also access, download, and verify your achievement through your profile dashboard at any time.</p>
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; font-style: italic;">CodeDabba Command Central</p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: `CodeDabba_Certificate_${certificateId}.pdf`,
            content: buffer,
          },
        ],
      });
    } catch (e) {
      console.error("Critical Failure: Email Delivery Blocked", e);
    }

    await this.loggingService.log({
      hackathonId,
      activityType: ActivityType.CERTIFICATE_GENERATED,
      description: `Certificate generated and emailed to "${user.name}" (ID: ${certificateId}).`,
      actor: user,
      metadata: { certificateId, type: certType },
      status: LogStatus.SUCCESS,
    });

    return saved;
  }

  async generateCourseCertificate(userId: string, courseId: string) {
    const course = await this.coursesRepository.findOne({
      where: { id: courseId },
      relations: ['mentor']
    });
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.findByUserAndCourse(userId, courseId);
    if (existing) return existing;

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const year = new Date().getFullYear();
    const certificateId = `CD-C-${year}-${courseId.substring(0, 4)}-${userId.substring(0, 4)}`.toUpperCase();

    const fileUrl = `${process.env.API_URL || 'http://localhost:5000'}/certificates/${certificateId}/download`;
    const buffer = await this.generateCourseCertificateBuffer(user, course, certificateId);

    const certificate = this.certificatesRepository.create({
      certificateId,
      userId,
      courseId,
      type: CertificateType.COURSE_COMPLETION,
      fileUrl,
    } as any);

    const saved = await this.certificatesRepository.save(certificate);

    // Send Email Notification
    try {
      await this.mailerService.sendMail({
        to: user.email,
        subject: '🎓 Your Course Completion Certificate',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; rounded: 12px;">
            <h1 style="color: #4f46e5; font-size: 24px; font-weight: 800; margin-bottom: 16px;">Congratulations, ${user.name}!</h1>
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">You have successfully completed <strong>${course.title}</strong>. Your certificate of completion is attached to this email.</p>
            <p style="color: #374151; font-size: 16px; line-height: 1.5;">You can also access, download, and verify your achievement through your profile dashboard at any time.</p>
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; font-style: italic;">CodeDabba Academy</p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: `CodeDabba_Course_Certificate_${certificateId}.pdf`,
            content: buffer,
          },
        ],
      });
    } catch (e) {
      console.error("Critical Failure: Email Delivery Blocked", e);
    }

    return saved;
  }

  async streamCertificatePDF(certificateId: string, res: any) {
    const certificate = await this.certificatesRepository.findOne({
      where: { certificateId },
      relations: ['user', 'hackathon']
    });
    if (!certificate) throw new NotFoundException('Certificate not found');

    const team = await this.teamsRepository.createQueryBuilder('team')
      .innerJoin('team.members', 'member')
      .where('team.hackathonId = :hackathonId', { hackathonId: certificate.hackathonId })
      .andWhere('member.studentId = :userId', { userId: certificate.userId })
      .getOne();

    const rankEntry = await this.leaderboardRepository.findOne({
      where: { teamId: team?.id, roundId: IsNull() },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=CodeDabba_Certificate_${certificate.certificateId}.pdf`);

    if (certificate.type === CertificateType.COURSE_COMPLETION) {
       const course = await this.coursesRepository.findOne({ where: { id: certificate.courseId }, relations: ['mentor'] });
       if (!course) {
         throw new Error('Course not found for certificate');
       }
       await this.pipeCourseCertificateToStream(certificate.user, course, certificate.certificateId, res);
    } else {
       await this.pipeCertificateToStream(certificate.user, certificate.hackathon, team, rankEntry, certificate.certificateId, res);
    }
  }

  private async generateCertificateBuffer(user: User, hackathon: Hackathon, team: HackathonTeam, rankEntry: any, certId: string): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const bufferStream = new PassThrough();
        const chunks: any[] = [];
        bufferStream.on('data', (chunk) => chunks.push(chunk));
        bufferStream.on('end', () => resolve(Buffer.concat(chunks)));
        bufferStream.on('error', reject);

        await this.pipeCertificateToStream(user, hackathon, team, rankEntry, certId, bufferStream);
      } catch (error) {
        reject(error);
      }
    });
  }

  private async pipeCertificateToStream(user: User, hackathon: Hackathon, team: HackathonTeam | null, rankEntry: any, certId: string, outputStream: any): Promise<void> {
    const PDFGen = require('pdfkit');
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFGen({
          layout: 'landscape',
          size: 'A4',
          margin: 50,
        });

        outputStream.on('finish', () => resolve());
        // For PassThrough streams
        if (outputStream instanceof PassThrough) {
             doc.on('end', () => resolve());
        }

        doc.pipe(outputStream);

        const width = doc.page.width;
        const height = doc.page.height;

        const isWinner = rankEntry?.rank && rankEntry.rank <= 3;
        const accentColor = isWinner ? '#C5A059' : '#3B82F6';
        const mainTextColor = '#1A1A1A';
        const secondaryTextColor = '#4B5563';

        doc.rect(40, 40, width - 80, height - 80)
          .lineWidth(1)
          .strokeColor(accentColor)
          .stroke();
        
        doc.rect(45, 45, width - 90, height - 90)
          .lineWidth(0.5)
          .strokeColor('#E5E7EB')
          .stroke();

        doc.font('Times-Bold')
          .fontSize(36)
          .fillColor(mainTextColor)
          .text('CERTIFICATE OF ACHIEVEMENT', 0, 140, { align: 'center' });

        doc.font('Times-Italic')
          .fontSize(18)
          .fillColor(secondaryTextColor)
          .text('This is to certify that', 0, 200, { align: 'center' });

        doc.font('Times-Bold')
          .fontSize(44)
          .fillColor(accentColor)
          .text(user.name.toUpperCase(), 0, 240, { align: 'center' });

        doc.font('Times-Roman')
          .fontSize(18)
          .fillColor(secondaryTextColor)
          .text(`has successfully participated in ${hackathon.title}`, 0, 310, { align: 'center' });

        let yOffset = 340;
        if (hackathon.maxTeamSize > 1 && team) {
          doc.text(`as a member of Team ${team.name}`, 0, yOffset, { align: 'center' });
          yOffset += 30;
        }

        if (isWinner) {
          const totalTeams = await this.teamsRepository.count({ where: { hackathonId: hackathon.id, status: TeamStatus.APPROVED } });
          doc.font('Times-Bold')
            .text(`and secured ${this.getOrdinal(rankEntry.rank)} Place among ${totalTeams} competing squads`, 0, yOffset, { align: 'center' });
        } else {
          doc.text('successfully completed all hackathon protocols and tactical missions', 0, yOffset, { align: 'center' });
        }

        doc.font('Helvetica')
          .fontSize(8)
          .fillColor('#9CA3AF')
          .text(`ID: ${certId}`, 60, height - 70);

        const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.font('Helvetica-Bold')
          .fontSize(10)
          .fillColor(mainTextColor)
          .text(`CodeDabba Command Central`, width - 260, height - 85, { width: 200, align: 'right' });
        doc.font('Helvetica')
          .fontSize(9)
          .fillColor(secondaryTextColor)
          .text(`Issued on ${dateStr}`, width - 260, height - 70, { width: 200, align: 'right' });

        try {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
            const qrData = `${frontendUrl}/verify/certificate/${certId}`;
            const qrImage = await QRCode.toDataURL(qrData);
            doc.image(qrImage, 60, height - 160, { width: 50 });
        } catch (e) {
            console.error("QR Code Gen Fail", e);
        }

        doc.moveTo(width - 250, height - 120)
          .lineTo(width - 70, height - 120)
          .lineWidth(0.5)
          .strokeColor('#D1D5DB')
          .stroke();
        doc.font('Times-Italic')
          .fontSize(12)
          .fillColor('#374151')
          .text('Hackathon Directorate', width - 260, height - 140, { width: 200, align: 'right' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private getOrdinal(n: number) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  private async generateCourseCertificateBuffer(user: User, course: Course, certId: string): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const bufferStream = new PassThrough();
        const chunks: any[] = [];
        bufferStream.on('data', (chunk) => chunks.push(chunk));
        bufferStream.on('end', () => resolve(Buffer.concat(chunks)));
        bufferStream.on('error', reject);

        await this.pipeCourseCertificateToStream(user, course, certId, bufferStream);
      } catch (error) {
        reject(error);
      }
    });
  }

  private async pipeCourseCertificateToStream(user: User, course: Course, certId: string, outputStream: any): Promise<void> {
    const PDFGen = require('pdfkit');
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFGen({
          layout: 'landscape',
          size: 'A4',
          margin: 50,
        });

        outputStream.on('finish', () => resolve());
        if (outputStream instanceof PassThrough) {
             doc.on('end', () => resolve());
        }

        doc.pipe(outputStream);

        const width = doc.page.width;
        const height = doc.page.height;

        const accentColor = '#8B5CF6'; 
        const mainTextColor = '#1A1A1A';
        const secondaryTextColor = '#4B5563';

        doc.rect(40, 40, width - 80, height - 80)
          .lineWidth(1)
          .strokeColor(accentColor)
          .stroke();
        
        doc.rect(45, 45, width - 90, height - 90)
          .lineWidth(0.5)
          .strokeColor('#E5E7EB')
          .stroke();

        doc.font('Times-Bold')
          .fontSize(36)
          .fillColor(mainTextColor)
          .text('CERTIFICATE OF COMPLETION', 0, 140, { align: 'center' });

        doc.font('Times-Italic')
          .fontSize(18)
          .fillColor(secondaryTextColor)
          .text('This is proudly presented to', 0, 200, { align: 'center' });

        doc.font('Times-Bold')
          .fontSize(44)
          .fillColor(accentColor)
          .text(user.name.toUpperCase(), 0, 240, { align: 'center' });

        doc.font('Times-Roman')
          .fontSize(18)
          .fillColor(secondaryTextColor)
          .text(`for successfully completing the course`, 0, 310, { align: 'center' });

        doc.font('Times-Bold')
          .fontSize(24)
          .fillColor(mainTextColor)
          .text(course.title, 0, 340, { align: 'center' });

        doc.font('Helvetica')
          .fontSize(8)
          .fillColor('#9CA3AF')
          .text(`ID: ${certId}`, 60, height - 70);

        const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.font('Helvetica-Bold')
          .fontSize(10)
          .fillColor(mainTextColor)
          .text(`CodeDabba Academy`, width - 260, height - 85, { width: 200, align: 'right' });
        doc.font('Helvetica')
          .fontSize(9)
          .fillColor(secondaryTextColor)
          .text(`Issued on ${dateStr}`, width - 260, height - 70, { width: 200, align: 'right' });

        try {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
            const qrData = `${frontendUrl}/verify/certificate/${certId}`;
            const qrImage = await QRCode.toDataURL(qrData);
            doc.image(qrImage, 60, height - 160, { width: 50 });
        } catch (e) {
            console.error("QR Code Gen Fail", e);
        }

        doc.moveTo(width - 250, height - 120)
          .lineTo(width - 70, height - 120)
          .lineWidth(0.5)
          .strokeColor('#D1D5DB')
          .stroke();
        doc.font('Times-Italic')
          .fontSize(12)
          .fillColor('#374151')
          .text('Academy Director', width - 260, height - 140, { width: 200, align: 'right' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
