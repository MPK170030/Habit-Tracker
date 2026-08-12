import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await transporter.sendMail({
    from: `"Warrior Habits" <${process.env.GMAIL_USER}>`,
    to,
    subject: '⚔️ Reset your Warrior Habits password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0d0d1f;color:#e2e8f0;padding:32px;border-radius:16px;">
        <h1 style="color:#f59e0b;font-size:24px;margin:0 0 8px;">⚔️ Warrior Habits</h1>
        <p style="color:#94a3b8;margin:0 0 24px;">Password reset request</p>
        <p style="margin:0 0 24px;">Someone requested a password reset for your account. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#f59e0b;color:#000;font-weight:700;padding:12px 28px;border-radius:12px;text-decoration:none;font-size:15px;">
          Reset Password →
        </a>
        <p style="margin:24px 0 0;color:#475569;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
