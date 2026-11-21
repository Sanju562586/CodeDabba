import { Injectable, BadRequestException } from '@nestjs/common';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService {
  private razorpay: any;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
    });
  }

  async createOrder(
    amount: number,
    receipt: string,
    currency: string = 'INR',
  ): Promise<any> {
    try {
      const options = {
        amount: Math.round(amount * 100), // amount in paise
        currency,
        receipt,
      };

      const order = await this.razorpay.orders.create(options);
      return order;
    } catch (error) {
      throw new BadRequestException(
        'Razorpay order creation failed: ' + error.message,
      );
    }
  }

  verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string,
  ): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';
    const body = orderId + '|' + paymentId;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    try {
      const a = Buffer.from(expectedSignature, 'utf8');
      const b = Buffer.from(signature, 'utf8');
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    const secret =
      process.env.RAZORPAY_WEBHOOK_SECRET || 'dummy_webhook_secret';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
      .digest('hex');

    try {
      const a = Buffer.from(expectedSignature, 'utf8');
      const b = Buffer.from(signature, 'utf8');
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }
}
