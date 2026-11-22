import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Otp, OtpType } from '../../entities/otp.entity';
import { MoreThan, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
    private mailerService: MailerService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.debug('Running OTP cleanup task...');
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const result = await this.otpRepository.delete({
        createdAt: LessThan(tenMinutesAgo),
      });

      if (result.affected && result.affected > 0) {
        this.logger.debug(`Deleted ${result.affected} expired OTPs.`);
      }
    } catch (error) {
      this.logger.error('Failed to delete expired OTPs', error);
    }
  }

  async generateAndSendOtp(email: string, type: OtpType) {
    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10); // 10 minutes expiry

    // Invalidate previous OTPs for this email and type
    await this.otpRepository.update(
      { email, type, isUsed: false },
      { isUsed: true },
    );

    const otp = this.otpRepository.create({
      email,
      otp: otpCode,
      type,
      expiry,
      isUsed: false,
    });

    await this.otpRepository.save(otp);

    // Send Email
    await this.sendOtpEmail(email, otpCode, type);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(
    email: string,
    otpCode: string,
    type: OtpType,
  ): Promise<boolean> {
    const activeOtp = await this.otpRepository.findOne({
      where: {
        email,
        type,
        isUsed: false,
        expiry: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });

    if (!activeOtp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (activeOtp.attempts >= 5) {
      activeOtp.isUsed = true;
      await this.otpRepository.save(activeOtp);
      throw new BadRequestException(
        'Too many failed attempts. Please request a new OTP.',
      );
    }

    if (activeOtp.otp !== otpCode) {
      activeOtp.attempts += 1;
      if (activeOtp.attempts >= 5) {
        activeOtp.isUsed = true;
      }
      await this.otpRepository.save(activeOtp);
      throw new BadRequestException('Invalid OTP');
    }

    // Mark OTP as used
    activeOtp.isUsed = true;
    await this.otpRepository.save(activeOtp);

    return true;
  }

  private async sendOtpEmail(email: string, otp: string, type: string) {
    this.logger.log(`Attempting to send ${type} OTP to ${email}`);

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: `${type} Verification OTP - CodeDabba`,
        html: `<div style="font-family: Arial, sans-serif; padding: 20px;"><h2>CodeDabba Verification</h2><p>Your OTP for ${type.toLowerCase().replace('_', ' ')} is:</p><h1 style="color: #4F46E5; letter-spacing: 5px;">${otp}</h1><p>This OTP is valid for 10 minutes.</p><p>If you did not request this, please ignore this email.</p></div>`,
      });
      this.logger.log(`✅ Email sent successfully to ${email}`);
    } catch (error) {
      this.logger.error('❌ Email error:', error);
      throw new BadRequestException('Failed to send OTP email');
    }
  }
}
