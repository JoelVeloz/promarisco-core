import { Resend } from 'resend';
import { config } from '../config';

export class ResendEmailService {
  private resend: Resend;

  constructor() {
    if (!config.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY es requerida');
    }
    this.resend = new Resend(config.RESEND_API_KEY);
  }

  async sendOTP(email: string, otp: string, type: string) {
    const subject = type === 'forget-password' ? 'Código de recuperación de contraseña' : 'Código de verificación';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${subject}</h2>
        <p>Tu código de verificación es:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>Este código expirará en 10 minutos.</p>
        <p>Si no solicitaste este código, puedes ignorar este correo.</p>
      </div>
    `;

    const fromEmail = config.RESEND_FROM_EMAIL || 'noreply@example.com';
    await this.resend.emails.send({ from: fromEmail, to: email, subject, html });
  }

  async sendResetToken(username: string, email: string, url: string) {
    const subject = 'Código de recuperación de contraseña';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${subject}</h2>
        <p>Tu código de verificación es:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          <a href="${url}">Reset Password</a>
        </div>
      </div>
    `;

    const fromEmail = config.RESEND_FROM_EMAIL || 'noreply@example.com';
    await this.resend.emails.send({ from: fromEmail, to: email, subject, html });
  }
}
