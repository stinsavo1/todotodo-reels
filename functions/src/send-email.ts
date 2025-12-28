import * as nodemailer from 'nodemailer';

export async function sendEmail({
                           fromEmail,
                           toEmail,
                           subject,
                           html
                         }: {
  fromEmail: string;
  toEmail: string;
  subject: string;
  html: string;
}) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.mail.ru',
    port: 587,
    secure: false,
    auth: {
      user: 'info.todotodo@mail.ru',
      pass: 'cuxmgnDGXTqMvt0FX4vA',
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = { from: fromEmail, to: toEmail, subject, html };
  await transporter.sendMail(mailOptions);
}5
