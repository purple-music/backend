import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { emailConstants } from './constants';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendVerificationEmail(email: string, token: string) {
    const verificationLink = `${emailConstants.host}/auth/verify?token=${token}`;

    try {
      const result = await this.resend.emails.send({
        from: emailConstants.from,
        to: email,
        subject: 'Confirm your email',
        html: `<p>Click <a href="${verificationLink}">here</a> to verify your email.</p>`,
      });

      console.log('Verification email sent!', result);
      // TODO: audit logs properly
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error sending verification email: ${error.message}`);
      }
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${emailConstants.host}/auth/reset-password?token=${token}`;

    try {
      const result = await this.resend.emails.send({
        from: emailConstants.from,
        to: email,
        subject: 'Reset your password',
        html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
      });

      console.log('Password email sent!', result);
      // TODO: audit logs properly
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error sending password email: ${error.message}`);
      }
    }
  }
}
