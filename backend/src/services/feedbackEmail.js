const nodemailer = require('nodemailer');

const CATEGORY_LABELS = {
  feature: 'Tính năng mới',
  improvement: 'Cải tiến',
  bug: 'Báo lỗi',
  other: 'Khác',
};

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const hasSmtpConfig = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

function buildFeedbackEmail(feedback) {
  const categoryLabel = CATEGORY_LABELS[feedback.category] || CATEGORY_LABELS.other;
  const subjectTitle = feedback.title || feedback.content.slice(0, 80);
  const subject = `[VMASS Feedback] ${categoryLabel}: ${subjectTitle}`;

  const text = [
    `Loại góp ý: ${categoryLabel}`,
    `Tiêu đề: ${feedback.title || 'Không có'}`,
    `Cửa hàng / công ty: ${feedback.companyName || 'Không có'}`,
    `Người gửi: ${feedback.contactName || 'Không có'}`,
    `Email: ${feedback.contactEmail || 'Không có'}`,
    `Số điện thoại: ${feedback.contactPhone || 'Không có'}`,
    `Nguồn: ${feedback.source || 'mobile'}`,
    '',
    'Nội dung:',
    feedback.content,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1a1a1a">
      <h2 style="margin:0 0 12px">Góp ý tính năng VMASS</h2>
      <p><strong>Loại góp ý:</strong> ${escapeHtml(categoryLabel)}</p>
      <p><strong>Tiêu đề:</strong> ${escapeHtml(feedback.title || 'Không có')}</p>
      <p><strong>Cửa hàng / công ty:</strong> ${escapeHtml(feedback.companyName || 'Không có')}</p>
      <p><strong>Người gửi:</strong> ${escapeHtml(feedback.contactName || 'Không có')}</p>
      <p><strong>Email:</strong> ${escapeHtml(feedback.contactEmail || 'Không có')}</p>
      <p><strong>Số điện thoại:</strong> ${escapeHtml(feedback.contactPhone || 'Không có')}</p>
      <p><strong>Nguồn:</strong> ${escapeHtml(feedback.source || 'mobile')}</p>
      <hr />
      <p style="white-space:pre-wrap">${escapeHtml(feedback.content)}</p>
    </div>
  `;

  return { subject, text, html };
}

async function sendFeedbackEmail(feedback) {
  const to = process.env.FEEDBACK_TO_EMAIL || process.env.SMTP_TO || process.env.SMTP_USER;

  if (!hasSmtpConfig() || !to) {
    return { sent: false, skipped: true, reason: 'SMTP is not configured.' };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const replyTo = feedback.contactEmail || undefined;
  const message = buildFeedbackEmail(feedback);
  const transporter = createTransporter();

  await transporter.sendMail({
    from,
    to,
    replyTo,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });

  return { sent: true, skipped: false };
}

module.exports = {
  sendFeedbackEmail,
};
