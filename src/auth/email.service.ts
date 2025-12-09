import * as nodemailer from 'nodemailer';

import { config } from '../config';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE, // true para 465, false para otros puertos
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASSWORD,
      },
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

    try {
      await this.transporter.sendMail({
        from: config.SMTP_FROM || config.SMTP_USER,
        to: email,
        subject,
        html,
      });
      console.log(`Correo enviado exitosamente a ${email}`);
    } catch (error) {
      console.error(`Error al enviar correo a ${email}:`, error);
      throw error;
    }
  }
}
