import { Controller, Post, Get, Body, Param, Req, Res, Headers, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';
import type { Response } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('registration')
  async createRegistrationPayment(@Req() req: any, @Body('hackathonId') hackathonId: string) {
    const userId = req.user.id;
    return this.paymentsService.createRegistrationPayment(userId, hackathonId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('round')
  async createRoundPayment(@Req() req: any, @Body() body: { teamId: string, roundId: string }) {
    const userId = req.user.id;
    return this.paymentsService.createRoundPayment(body.teamId, body.roundId, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('course')
  async createCoursePayment(@Req() req: any, @Body('courseId') courseId: string) {
    const userId = req.user.id;
    return this.paymentsService.createCoursePayment(userId, courseId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('create-order')
  async createOrder(@Req() req: any, @Body('paymentId') paymentId: string) {
    return this.paymentsService.createRazorpayOrder(paymentId);
  }

  @Post('verify')
  async verifyPayment(@Req() req: any, @Body() body: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    paymentId: string;
  }) {
    return this.paymentsService.verifyRazorpayPayment(
      body.paymentId,
      body.razorpay_order_id,
      body.razorpay_payment_id,
      body.razorpay_signature
    );
  }

  @Post('webhook')
  async handleRazorpayWebhook(
    @Body() payload: any,
    @Headers('x-razorpay-signature') signature: string
  ) {
    if (!signature) {
      throw new UnauthorizedException('Missing razorpay signature');
    }
    
    await this.paymentsService.handleWebhook(payload, signature);
    return { status: 'ok' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('team/:teamId')
  async getTeamPayments(@Param('teamId') teamId: string) {
    return this.paymentsService.getTeamPayments(teamId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/receipt')
  async getReceipt(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    const role = req.user.role || 'STUDENT';
    
    const invoiceData = await this.paymentsService.getInvoiceData(id, userId, role);
    return {
      status: 'success',
      data: invoiceData,
      html: this.paymentsService.getHtmlInvoice(invoiceData)
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/invoice-pdf')
  async getInvoicePdf(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    const userId = req.user.id;
    const role = req.user.role || 'STUDENT';
    
    const invoiceData = await this.paymentsService.getInvoiceData(id, userId, role);
    
    // Automatically writes buffer directly down the res stream
    return this.paymentsService.generateInvoicePDF(invoiceData, res);
  }
}
