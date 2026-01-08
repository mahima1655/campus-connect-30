import emailjs from '@emailjs/browser';

// EmailJS Configuration - Replace with your own credentials
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'your_service_id';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'your_template_id';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'your_public_key';

interface NoticeEmailParams {
  toEmail: string;
  noticeTitle: string;
  noticeDescription: string;
  noticeCategory: string;
  postedBy: string;
}

export const sendNoticeNotification = async (params: NoticeEmailParams) => {
  try {
    const templateParams = {
      to_email: params.toEmail,
      notice_title: params.noticeTitle,
      notice_description: params.noticeDescription,
      notice_category: params.noticeCategory,
      posted_by: params.postedBy,
    };

    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    console.log('Email sent successfully:', response);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

// Initialize EmailJS
export const initEmailJS = () => {
  emailjs.init(PUBLIC_KEY);
};
