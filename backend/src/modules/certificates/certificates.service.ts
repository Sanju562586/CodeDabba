import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { Certificate, CertificateType } from '../../entities/certificate.entity';
import { User } from '../../entities/user.entity';
import { Hackathon, HackathonStatus } from '../../entities/hackathon.entity';
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
      relations: ['hackathon'],
      order: { createdAt: 'DESC' },
    });
  }

  async verify(certificateId: string) {
    return await this.certificatesRepository.findOne({
      where: { certificateId },
      relations: ['user', 'hackathon'],
    });
  }

  async findByUserAndHackathon(userId: string, hackathonId: string) {
    return await this.certificatesRepository.findOne({
      where: { userId, hackathonId },
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

    const { fileUrl, buffer } = await this.generateCertificatePDF(user, hackathon, team, rankEntry, certificateId);

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

  private async generateCertificatePDF(user: User, hackathon: Hackathon, team: HackathonTeam, rankEntry: any, certId: string): Promise<{ fileUrl: string, buffer: Buffer }> {
    const PDFGen = require('pdfkit');
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFGen({
          layout: 'landscape',
          size: 'A4',
          margin: 50,
        });

        const bufferStream = new PassThrough();
        const chunks: any[] = [];
        bufferStream.on('data', (chunk) => chunks.push(chunk));
        bufferStream.on('end', () => {
          const fullBuffer = Buffer.concat(chunks);
          this.uploadToCloudinary(fullBuffer, certId)
            .then(url => resolve({ fileUrl: url, buffer: fullBuffer }))
            .catch(reject);
        });

        doc.pipe(bufferStream);

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
        if (hackathon.maxTeamSize > 1) {
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

  private async uploadToCloudinary(buffer: Buffer, certId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        {
          folder: 'certificates',
          public_id: certId,
          resource_type: 'raw',
          format: 'pdf',
        },
        (error, result) => {
          if (error) reject(error);
          else if (!result) reject(new Error('Cloudinary upload returned no result'));
          else resolve(result.secure_url);
        }
      );
      uploadStream.end(buffer);
    });
  }

  private getOrdinal(n: number) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
}
