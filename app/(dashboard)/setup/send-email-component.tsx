'use client';

import { useEffect, useState } from 'react';
import emailjs from '@emailjs/browser';
import { toast } from '@/hooks/use-toast';

interface SendEmailProps {
  to: string;
  name: string;
  password: string;
  role: string;
  isResend: boolean;
}

export function SendEmailComponent({ to, name, password, role, isResend }: SendEmailProps) {
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;

    if (!publicKey || !serviceId || !templateId) {
      console.error('EmailJS configuration is incomplete');
      toast({
        title: 'Email Configuration Error',
        description: 'The email service is not properly configured. Please contact the administrator.',
        variant: 'destructive'
      });
      return;
    }

    emailjs.init(publicKey);
    sendEmail(serviceId, templateId);
  }, [to, name, password, role, isResend]);

  const sendEmail = async (serviceId: string, templateId: string) => {
    if (isSending) return;
    setIsSending(true);
    try {
      const templateParams = {
        to_email: to,
        to_name: name,
        password: password,
        role: role,
        dashboard_url: process.env.NEXT_PUBLIC_DASHBOARD_URL,
        is_resend: isResend,
      };

      const result = await emailjs.send(serviceId, templateId, templateParams);

      if (result.text !== 'OK') {
        throw new Error('Failed to send email');
      }

      toast({
        title: isResend ? 'Password reset email sent' : 'Welcome email sent',
        description: 'The email has been sent successfully.'
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error sending email',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsSending(false);
    }
  };

  return null; // This component doesn't render anything
}