import * as nodemailer from 'nodemailer';

import { config } from '../config';

export class SMTPEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    if (!config.SMTP_HOST || !config.SMTP_PORT || !config.SMTP_USER || !config.SMTP_PASSWORD) {
      throw new Error('Las variables SMTP son requeridas');
    }
    this.transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
      auth: { user: config.SMTP_USER, pass: config.SMTP_PASSWORD },
    });
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

    await this.transporter.sendMail({
      from: config.SMTP_FROM || config.SMTP_USER,
      to: email,
      subject,
      html,
    });
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

    await this.transporter.sendMail({ from: config.SMTP_FROM || config.SMTP_USER, to: email, subject, html });
  }
}
