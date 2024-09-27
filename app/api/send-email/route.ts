import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL;

export async function POST(req: Request) {
  const { to, name, password, isResend } = await req.json();

  try {
    const { data, error } = await resend.emails.send({
      from: 'K&DGS Admin <onboarding@resend.dev>',
      to: [to],
      subject: isResend ? 'K&DGS Admin Dashboard - Password Reset' : 'Welcome to K&DGS Admin Dashboard',
      html: `
        <h1>Welcome to K&DGS Admin Dashboard</h1>
        <p>Dear ${name},</p>
        <p>Welcome to the Kelowna & District Genealogical Society Admin Dashboard. Your account has been created successfully.</p>
        <p>Here are your login credentials:</p>
        <ul>
          <li>Email: ${to}</li>
          <li>Password: ${password}</li>
        </ul>
        <p>For security reasons, we strongly recommend that you change your password upon your first login.</p>
        <p>Please keep this information confidential and do not share it with anyone. If you suspect any unauthorized access to your account, please contact us immediately.</p>
        <p>You can access the K&DGS Admin Dashboard at: <a href="${dashboardUrl}">${dashboardUrl}</a></p>
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team at <a href="mailto:kdgs.develop@gmail.ca">kdgs.develop@gmail.ca</a>.</p>
        <p>Best regards,<br>K&DGS Admin Team</p>
      `,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Email sent successfully', id: data?.id }, { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}