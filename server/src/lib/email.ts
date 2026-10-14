import nodemailer from 'nodemailer';

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(`Email credentials missing — GMAIL_USER=${user ?? 'unset'}, GMAIL_APP_PASSWORD=${pass ? 'set' : 'unset'}`);
  }

  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Fathom" <${process.env.GMAIL_USER}>`,
    to,
    subject: '🌊 Reset your Fathom password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0d0d1f;color:#e2e8f0;padding:32px;border-radius:16px;">
        <h1 style="color:#22d3ee;font-size:24px;margin:0 0 8px;">🌊 Fathom</h1>
        <p style="color:#94a3b8;margin:0 0 24px;">Password reset request</p>
        <p style="margin:0 0 24px;">Someone requested a password reset for your account. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#22d3ee;color:#000;font-weight:700;padding:12px 28px;border-radius:12px;text-decoration:none;font-size:15px;">
          Reset Password →
        </a>
        <p style="margin:24px 0 0;color:#475569;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
