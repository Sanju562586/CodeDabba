import { Injectable, BadRequestException, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HackathonPayment, PaymentStatus, PaymentType } from '../../entities/hackathon-payment.entity';
import { Hackathon } from '../../entities/hackathon.entity';
import { HackathonRound, RoundPaymentType } from '../../entities/hackathon-round.entity';
import { HackathonTeam, TeamStatus } from '../../entities/hackathon-team.entity';
import { Course } from '../../entities/course.entity';
import { RazorpayService } from './razorpay.service';
import { User, Role } from '../../entities/user.entity';
import { CoursesService } from '../courses/courses.service';
import PDFDocument from 'pdfkit';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(HackathonPayment)
    private paymentsRepository: Repository<HackathonPayment>,
    @InjectRepository(Hackathon)
    private hackathonsRepository: Repository<Hackathon>,
    @InjectRepository(HackathonRound)
    private roundsRepository: Repository<HackathonRound>,
    @InjectRepository(HackathonTeam)
    private teamsRepository: Repository<HackathonTeam>,
    @InjectRepository(Course)
    private coursesRepository: Repository<Course>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly razorpayService: RazorpayService,
    private readonly coursesService: CoursesService,
  ) {}

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CD-${year}-`;
    
    const lastPayment = await this.paymentsRepository
      .createQueryBuilder('payment')
      .where('payment.invoiceNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('payment.invoiceNumber', 'DESC')
      .getOne();

    let counter = 1;
    if (lastPayment && lastPayment.invoiceNumber) {
        const parts = lastPayment.invoiceNumber.split('-');
        const sequenceStr = parts[parts.length - 1];
        if (sequenceStr) {
            counter = parseInt(sequenceStr, 10) + 1;
        }
    }
    
    return `${prefix}${counter.toString().padStart(4, '0')}`;
  }

  async createRegistrationPayment(userId: string, hackathonId: string) {
    const hackathon = await this.hackathonsRepository.findOne({ where: { id: hackathonId } });
    if (!hackathon) throw new NotFoundException('Hackathon not found');
    
    if (!hackathon.isPaid) {
      throw new BadRequestException('This hackathon does not require a registration fee.');
    }

    const existingPayment = await this.paymentsRepository.findOne({
      where: { userId, hackathonId, paymentType: PaymentType.REGISTRATION }
    });

    if (existingPayment && existingPayment.status === PaymentStatus.SUCCESS) {
      throw new BadRequestException('Registration payment already completed.');
    }

    if (existingPayment && existingPayment.status === PaymentStatus.PENDING) {
      return { status: 'success', message: 'Payment already pending', payment: existingPayment };
    }

    const newPayment = this.paymentsRepository.create({
      userId,
      payerId: userId,
      hackathonId,
      paymentType: PaymentType.REGISTRATION,
      amount: hackathon.registrationFee || 0,
      currency: hackathon.currency || 'INR',
      status: PaymentStatus.PENDING,
    });

    await this.paymentsRepository.save(newPayment);
    return { status: 'success', message: 'Registration payment created', payment: newPayment };
  }

  async createRoundPayment(teamId: string, roundId: string, userId: string) {
    const round = await this.roundsRepository.findOne({ where: { id: roundId }, relations: ['hackathon'] });
    if (!round) throw new NotFoundException('Round not found');

    if (!round.isPaymentRequired) {
      throw new BadRequestException('This round does not require payment.');
    }

    const team = await this.teamsRepository.findOne({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');

    if (round.paymentType === RoundPaymentType.QUALIFIED_ONLY) {
       if (team.status === TeamStatus.ELIMINATED || team.status === TeamStatus.REJECTED || team.status === TeamStatus.FORMING) {
         throw new BadRequestException('Team is not qualified for this round payment.');
       }
    }

    const existingPayment = await this.paymentsRepository.findOne({
      where: { teamId, roundId, paymentType: PaymentType.ROUND }
    });

    if (existingPayment && existingPayment.status === PaymentStatus.SUCCESS) {
      throw new BadRequestException('Round payment already completed.');
    }
    
    if (existingPayment && existingPayment.status === PaymentStatus.PENDING) {
      return { status: 'success', message: 'Payment already pending', payment: existingPayment };
    }

    const newPayment = this.paymentsRepository.create({
      userId,
      payerId: userId,
      teamId,
      hackathonId: round.hackathonId,
      roundId,
      paymentType: PaymentType.ROUND,
      amount: round.paymentAmount || 0,
      currency: round.hackathon.currency || 'INR',
      status: PaymentStatus.PENDING,
    });

    await this.paymentsRepository.save(newPayment);
    return { status: 'success', message: 'Round payment created', payment: newPayment };
  }

  async createCoursePayment(userId: string, courseId: string) {
    const course = await this.coursesService.findOne(courseId);
    if (!course) throw new NotFoundException('Course not found');
    if (course.accessType !== 'paid') {
      throw new BadRequestException('Only paid courses require a payment.');
    }
    if (course.status !== 'published') {
      throw new BadRequestException('Course is not available for purchase.');
    }

    const existingPayment = await this.paymentsRepository.findOne({
      where: { userId, courseId, paymentType: PaymentType.COURSE },
    });

    if (existingPayment && existingPayment.status === PaymentStatus.SUCCESS) {
      return { status: 'success', message: 'Payment already completed', payment: existingPayment };
    }

    if (existingPayment && existingPayment.status === PaymentStatus.PENDING) {
      return { status: 'success', message: 'Payment already pending', payment: existingPayment };
    }

    const newPayment = this.paymentsRepository.create({
      userId,
      payerId: userId,
      courseId,
      paymentType: PaymentType.COURSE,
      amount: course.price || 0,
      currency: 'INR',
      status: PaymentStatus.PENDING,
    });

    await this.paymentsRepository.save(newPayment);
    return { status: 'success', message: 'Course payment created', payment: newPayment };
  }

  // --- RAZORPAY INTEGRATION ---

  async createRazorpayOrder(paymentId: string) {
    const payment = await this.paymentsRepository.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(`Cannot create order for payment in ${payment.status} status.`);
    }

    const order = await this.razorpayService.createOrder(payment.amount, payment.id, payment.currency);
    
    payment.orderId = order.id;
    await this.paymentsRepository.save(payment);

    return {
      status: 'success',
      orderDetails: {
        orderId: order.id,
        key_id: process.env.RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency
      }
    };
  }

  async verifyRazorpayPayment(
    paymentId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) {
    const payment = await this.paymentsRepository.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException('Payment not found');

    if (payment.status === PaymentStatus.SUCCESS) {
      return { status: 'success', message: 'Payment already verified', payment, receiptUrl: payment.receiptUrl };
    }

    const isValid = this.razorpayService.verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (isValid) {
      payment.status = PaymentStatus.SUCCESS;
      payment.transactionId = razorpayPaymentId;
      payment.paidAt = new Date();
      payment.invoiceNumber = await this.generateInvoiceNumber();
      payment.receiptUrl = `/payments/${payment.id}/receipt`; 

      await this.paymentsRepository.save(payment);

      if (payment.courseId) {
        try {
          await this.coursesService.enroll(payment.userId, payment.courseId, true);
        } catch (error) {
          // If enrollment already exists, ignore and preserve successful payment.
          if (!(error instanceof ConflictException)) {
            throw error;
          }
        }
      }

      return { status: 'success', message: 'Payment successfully verified', payment, receiptUrl: payment.receiptUrl, invoiceNumber: payment.invoiceNumber };
    } else {
      payment.status = PaymentStatus.FAILED;
      await this.paymentsRepository.save(payment);
      throw new BadRequestException('Invalid payment signature');
    }
  }

  async handleWebhook(payload: any, signature: string) {
    const isValid = this.razorpayService.verifyWebhookSignature(payload, signature);
    if (!isValid) throw new BadRequestException('Invalid webhook signature');

    const event = payload.event;
    
    if (event === 'payment.captured' || event === 'payment.failed') {
      const paymentEntityId = payload.payload.payment.entity.notes?.paymentId 
                           || payload.payload.order?.entity.receipt; 

      if (!paymentEntityId) return;

      const payment = await this.paymentsRepository.findOne({ where: { id: paymentEntityId } });
      if (!payment || payment.status === PaymentStatus.SUCCESS) return;

      if (event === 'payment.captured') {
        payment.status = PaymentStatus.SUCCESS;
        payment.transactionId = payload.payload.payment.entity.id;
        payment.paidAt = new Date();
        if (!payment.invoiceNumber) {
          payment.invoiceNumber = await this.generateInvoiceNumber();
          payment.receiptUrl = `/payments/${payment.id}/receipt`;
        }
        await this.paymentsRepository.save(payment);
      } else if (event === 'payment.failed') {
        payment.status = PaymentStatus.FAILED;
        payment.transactionId = payload.payload.payment.entity.id;
        await this.paymentsRepository.save(payment);
      }
    }
  }

  // --- INVOICE GENERATION ---

  async authorizePaymentAccess(payment: HackathonPayment, userId: string, role: string) {
    if (role === Role.ADMIN || payment.payerId === userId || payment.userId === userId) {
      return true;
    }
    if (payment.teamId) {
      const team = await this.teamsRepository.findOne({ 
        where: { id: payment.teamId },
        relations: ['members']
      });
      if (team && team.members.some(m => m.studentId === userId)) return true;
    }
    throw new ForbiddenException('You do not have access to this receipt');
  }

  async getInvoiceData(paymentId: string, userId: string, role: string) {
    const payment = await this.paymentsRepository.findOne({
      where: { id: paymentId },
      relations: ['hackathon', 'round', 'team', 'user']
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== PaymentStatus.SUCCESS) throw new BadRequestException('Payment is not completed');
    
    await this.authorizePaymentAccess(payment, userId, role);

    const payerUser = await this.usersRepository.findOne({ where: { id: payment.payerId } });

    return {
      invoiceNumber: payment.invoiceNumber,
      teamName: payment.team?.name || 'Individual Participant',
      paidBy: payerUser?.name || payment.user?.name || 'Unknown',
      participants: payment.team ? await this.teamsRepository.createQueryBuilder().relation(HackathonTeam, 'members').of(payment.teamId).loadMany().then(m => m.length) : 1,
      hackathonName: payment.hackathon?.title,
      roundName: payment.round?.title,
      paymentType: payment.paymentType,
      amount: payment.amount,
      currency: payment.currency,
      transactionId: payment.transactionId,
      paidAt: payment.paidAt
    };
  }

  getHtmlInvoice(invoiceData: any) {
    return `
    <div style="font-family: Arial, sans-serif; padding: 30px; max-width: 600px; margin: 0 auto; border: 1px solid #ccc; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
      <h1 style="color: #333; border-bottom: 2px solid #ea580c; padding-bottom: 15px; margin-bottom: 25px;">CodeDabba Invoice</h1>
      
      <div style="margin-bottom: 30px; display: flex; justify-content: space-between;">
        <div>
          <strong style="color:#555;">Invoice Number:</strong><br/> ${invoiceData.invoiceNumber}
        </div>
        <div>
          <strong style="color:#555;">Date:</strong><br/> ${new Date(invoiceData.paidAt).toLocaleDateString()}
        </div>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <tr style="background-color: #fafafa;">
          <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; width: 40%;">Hackathon</td>
          <td style="padding: 12px; border: 1px solid #ddd;">${invoiceData.hackathonName}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Team / Participant</td>
          <td style="padding: 12px; border: 1px solid #ddd;">${invoiceData.teamName} (${invoiceData.participants} members)</td>
        </tr>
        <tr style="background-color: #fafafa;">
          <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Paid By</td>
          <td style="padding: 12px; border: 1px solid #ddd;">${invoiceData.paidBy}</td>
        </tr>
        <tr>
          <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Payment Type</td>
          <td style="padding: 12px; border: 1px solid #ddd;">${invoiceData.paymentType} ${invoiceData.roundName ? '- ' + invoiceData.roundName : ''}</td>
        </tr>
        <tr style="background-color: #fafafa;">
           <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Transaction ID</td>
           <td style="padding: 12px; border: 1px solid #ddd;">${invoiceData.transactionId}</td>
        </tr>
        <tr style="background-color: #fffaf0;">
          <td style="padding: 15px; border: 2px solid #ea580c; font-weight: bold; font-size: 16px; color:#ea580c;">Total Amount</td>
          <td style="padding: 15px; border: 2px solid #ea580c; font-weight: bold; font-size: 16px;">${invoiceData.currency} ${invoiceData.amount}</td>
        </tr>
      </table>
      
      <p style="margin-top: 40px; font-size: 13px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
        Thank you for participating with CodeDabba.<br/>
        Valid receipt subject to realization.
      </p>
    </div>
    `;
  }

  async generateInvoicePDF(invoiceData: any, res: any) {
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoiceData.invoiceNumber}.pdf`);
    
    doc.pipe(res);
    
    // Header
    doc.fontSize(22).fillColor('#ea580c').text('CodeDabba Invoice', { align: 'center' });
    doc.moveDown(2);
    
    // Meta
    doc.fontSize(12).fillColor('#333333');
    doc.text(`Invoice Number: ${invoiceData.invoiceNumber}`);
    doc.text(`Date: ${new Date(invoiceData.paidAt).toLocaleDateString()}`);
    doc.text(`Transaction ID: ${invoiceData.transactionId}`);
    doc.moveDown(1.5);
    
    // Details
    doc.text(`Hackathon: ${invoiceData.hackathonName}`);
    if (invoiceData.roundName) doc.text(`Round: ${invoiceData.roundName}`);
    doc.text(`Team / Participant: ${invoiceData.teamName} (${invoiceData.participants} members)`);
    doc.text(`Payment Type: ${invoiceData.paymentType}`);
    doc.text(`Paid By: ${invoiceData.paidBy}`);
    doc.moveDown(2);
    
    // Total
    doc.fontSize(16).fillColor('#ea580c').text(`Total Amount: ${invoiceData.currency} ${invoiceData.amount}`, { align: 'right' });
    
    // Footer
    doc.moveDown(4);
    doc.fontSize(10).fillColor('#888888').text('Thank you for participating with CodeDabba.', { align: 'center' });
    
    doc.end();
  }

  // ---

  async expirePayments() {
    const now = new Date();
    
    const pendingRegistrationPayments = await this.paymentsRepository.find({
      where: { status: PaymentStatus.PENDING, paymentType: PaymentType.REGISTRATION },
      relations: ['hackathon']
    });

    for (const payment of pendingRegistrationPayments) {
      if (payment.hackathon?.paymentDeadline && payment.hackathon.paymentDeadline < now) {
        payment.status = PaymentStatus.EXPIRED;
        await this.paymentsRepository.save(payment);
      }
    }

    const pendingRoundPayments = await this.paymentsRepository.find({
      where: { status: PaymentStatus.PENDING, paymentType: PaymentType.ROUND },
      relations: ['round', 'team']
    });

    for (const payment of pendingRoundPayments) {
      if (payment.round?.paymentDeadline && payment.round.paymentDeadline < now) {
        payment.status = PaymentStatus.EXPIRED;
        await this.paymentsRepository.save(payment);

        if (payment.team) {
          payment.team.status = TeamStatus.ELIMINATED;
          await this.teamsRepository.save(payment.team);
        }
      }
    }
  }

  async getTeamPayments(teamId: string) {
    const payments = await this.paymentsRepository.find({ 
      where: { teamId },
      order: { createdAt: 'DESC' }
    });
    return { status: 'success', message: 'Team payments retrieved', paymentDetails: payments };
  }

  async validateRegistrationGate(userId: string, hackathonId: string) {
    const hackathon = await this.hackathonsRepository.findOne({ where: { id: hackathonId } });
    if (hackathon?.isPaid) {
      const payment = await this.paymentsRepository.findOne({
        where: {
          userId,
          hackathonId,
          paymentType: PaymentType.REGISTRATION,
          status: PaymentStatus.SUCCESS
        }
      });
      if (!payment) {
        throw new BadRequestException('A successful registration payment is required before team creation.');
      }
    }
  }

  async validateRoundEntryGate(teamId: string, roundId: string) {
    const round = await this.roundsRepository.findOne({ where: { id: roundId } });
    if (round?.isPaymentRequired) {
      const payment = await this.paymentsRepository.findOne({
        where: {
          teamId,
          roundId,
          paymentType: PaymentType.ROUND,
          status: PaymentStatus.SUCCESS
        }
      });
      if (!payment) {
        throw new BadRequestException('A successful payment is required before submitting for this round.');
      }
    }
  }
}
