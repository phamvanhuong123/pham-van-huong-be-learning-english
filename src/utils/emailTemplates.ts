/**
 * HTML Email Templates — TOEIC Master
 * Mọi template đều responsive, hỗ trợ dark mode email clients.
 */

const brandColor = '#2563EB';
const accentColor = '#0D9488';
const dangerColor = '#EF4444';

const baseTemplate = (content: string, previewText: string = '') => `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TOEIC Master</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body { margin: 0; padding: 0; background-color: #F1F3F7; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    table { border-collapse: collapse; }
    img { border: 0; display: block; }
    .wrapper { width: 100%; background-color: #F1F3F7; padding: 40px 16px; }
    .container { max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, ${brandColor} 0%, #1D4ED8 100%); padding: 32px 40px; text-align: center; }
    .header-logo { font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px; }
    .header-logo span { color: #93C5FD; }
    .body { padding: 40px; }
    .title { font-size: 22px; font-weight: 700; color: #0F172A; margin: 0 0 12px 0; line-height: 1.3; }
    .text { font-size: 15px; color: #475569; line-height: 1.7; margin: 0 0 16px 0; }
    .btn { display: inline-block; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; text-decoration: none; text-align: center; }
    .btn-primary { background-color: ${brandColor}; color: #FFFFFF !important; }
    .btn-danger { background-color: ${dangerColor}; color: #FFFFFF !important; }
    .btn-container { text-align: center; margin: 28px 0; }
    .divider { border: none; border-top: 1px solid #E2E8F0; margin: 28px 0; }
    .token-box { background-color: #F1F3F7; border-radius: 8px; padding: 16px 24px; text-align: center; margin: 20px 0; }
    .token-text { font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 28px; font-weight: 700; letter-spacing: 8px; color: ${brandColor}; }
    .note { font-size: 13px; color: #94A3B8; line-height: 1.6; }
    .footer { background-color: #F8FAFC; padding: 24px 40px; text-align: center; border-top: 1px solid #E2E8F0; }
    .footer-text { font-size: 12px; color: #94A3B8; line-height: 1.6; margin: 0; }
    .footer-link { color: ${brandColor}; text-decoration: none; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-blue { background-color: #DBEAFE; color: ${brandColor}; }
    .badge-teal { background-color: #CCFBF1; color: ${accentColor}; }
    @media (max-width: 600px) {
      .body { padding: 24px 20px; }
      .footer { padding: 20px; }
      .token-text { font-size: 22px; letter-spacing: 4px; }
    }
  </style>
</head>
<body>
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;">${previewText}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</div>` : ''}
  <div class="wrapper">
    <div class="container">
      <!-- Header -->
      <div class="header">
        <div class="header-logo">TOEIC <span>Master</span></div>
        <p style="color:#BFDBFE;font-size:13px;margin:6px 0 0 0;">Nền tảng luyện thi TOEIC thông minh</p>
      </div>
      <!-- Body -->
      <div class="body">
        ${content}
      </div>
      <!-- Footer -->
      <div class="footer">
        <p class="footer-text">
          Email này được gửi tự động từ <strong>TOEIC Master</strong>.<br />
          Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.<br />
          <a href="{{CLIENT_URL}}" class="footer-link">Truy cập TOEIC Master</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

/* ══════════════════════════════════════════════════════════════
   1. VERIFY EMAIL (Đăng ký tài khoản)
══════════════════════════════════════════════════════════════ */
export const verifyEmailTemplate = (params: {
  name: string;
  verifyUrl: string;
  expiresIn?: string;
  clientUrl: string;
}) => {
  const { name, verifyUrl, expiresIn = '24 giờ', clientUrl } = params;
  const content = `
    <span class="badge badge-blue">Xác thực tài khoản</span>
    <h1 class="title" style="margin-top:16px;">Chào mừng bạn, ${name}! 🎉</h1>
    <p class="text">
      Cảm ơn bạn đã đăng ký <strong>TOEIC Master</strong>. Chỉ một bước nữa để bắt đầu hành trình luyện thi TOEIC của bạn!
    </p>
    <p class="text">
      Nhấn vào nút bên dưới để xác thực địa chỉ email và kích hoạt tài khoản:
    </p>
    <div class="btn-container">
      <a href="${verifyUrl}" class="btn btn-primary">✓ Xác thực Email ngay</a>
    </div>
    <hr class="divider" />
    <p class="note">
      🔒 Link xác thực có hiệu lực trong <strong>${expiresIn}</strong>.<br />
      Nếu nút không hoạt động, copy và paste URL này vào trình duyệt:<br />
      <a href="${verifyUrl}" style="color:${brandColor};word-break:break-all;font-size:12px;">${verifyUrl}</a>
    </p>
  `;
  return baseTemplate(content, `Xác thực email để kích hoạt tài khoản TOEIC Master của bạn`)
    .replace('{{CLIENT_URL}}', clientUrl);
};

/* ══════════════════════════════════════════════════════════════
   2. RESET PASSWORD (Quên mật khẩu)
══════════════════════════════════════════════════════════════ */
export const resetPasswordTemplate = (params: {
  name: string;
  resetUrl: string;
  expiresIn?: string;
  clientUrl: string;
}) => {
  const { name, resetUrl, expiresIn = '1 giờ', clientUrl } = params;
  const content = `
    <span class="badge" style="background-color:#FEE2E2;color:${dangerColor};">Đặt lại mật khẩu</span>
    <h1 class="title" style="margin-top:16px;">Yêu cầu đặt lại mật khẩu</h1>
    <p class="text">
      Xin chào <strong>${name}</strong>, chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản TOEIC Master của bạn.
    </p>
    <p class="text">
      Nhấn vào nút bên dưới để tạo mật khẩu mới:
    </p>
    <div class="btn-container">
      <a href="${resetUrl}" class="btn btn-danger">🔑 Đặt lại mật khẩu</a>
    </div>
    <hr class="divider" />
    <p class="note">
      ⏱️ Link có hiệu lực trong <strong>${expiresIn}</strong>.<br />
      Nếu bạn <strong>không</strong> yêu cầu đặt lại mật khẩu, hãy bỏ qua email này — tài khoản của bạn vẫn an toàn.<br /><br />
      Nếu nút không hoạt động, copy URL này:<br />
      <a href="${resetUrl}" style="color:${dangerColor};word-break:break-all;font-size:12px;">${resetUrl}</a>
    </p>
  `;
  return baseTemplate(content, `Đặt lại mật khẩu tài khoản TOEIC Master của bạn`)
    .replace('{{CLIENT_URL}}', clientUrl);
};

/* ══════════════════════════════════════════════════════════════
   3. PASSWORD CHANGED (Thông báo đổi mật khẩu thành công)
══════════════════════════════════════════════════════════════ */
export const passwordChangedTemplate = (params: {
  name: string;
  clientUrl: string;
  changedAt?: string;
}) => {
  const { name, clientUrl, changedAt = new Date().toLocaleString('vi-VN') } = params;
  const content = `
    <span class="badge badge-teal">Bảo mật tài khoản</span>
    <h1 class="title" style="margin-top:16px;">Mật khẩu đã được thay đổi ✅</h1>
    <p class="text">
      Xin chào <strong>${name}</strong>, mật khẩu tài khoản TOEIC Master của bạn vừa được đặt lại thành công.
    </p>
    <div class="token-box">
      <p style="margin:0;font-size:13px;color:#64748B;">Thời gian thay đổi</p>
      <p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#0F172A;">${changedAt}</p>
    </div>
    <p class="text">
      Nếu <strong>bạn không thực hiện thay đổi này</strong>, mật khẩu của bạn có thể đã bị lộ. Hãy liên hệ hỗ trợ ngay lập tức.
    </p>
    <div class="btn-container">
      <a href="${clientUrl}/login" class="btn btn-primary">Đăng nhập ngay</a>
    </div>
  `;
  return baseTemplate(content, `Mật khẩu TOEIC Master của bạn đã được thay đổi`)
    .replace('{{CLIENT_URL}}', clientUrl);
};

export const vocabReminderTemplate = (params: {
  name: string;
  count: number;
  clientUrl: string;
}) => {
  const { name, count, clientUrl } = params;
  const practiceUrl = `${clientUrl}/dashboard/vocab/practice`;
  const content = `
    <span class="badge badge-teal">Nhắc nhở học tập</span>
    <h1 class="title" style="margin-top:16px;">Đừng quên ôn từ vựng hôm nay! 📚</h1>
    <p class="text">
      Xin chào <strong>${name}</strong>, theo lịch SM-2 của bạn, hôm nay bạn có
      <strong style="color:#2563EB;">${count} từ vựng</strong> cần ôn tập.
    </p>
    <div class="token-box">
      <p style="margin:0;font-size:13px;color:#64748B;">Từ cần ôn hôm nay</p>
      <p style="margin:6px 0 0;font-size:40px;font-weight:800;color:#2563EB;line-height:1;">${count}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#64748B;">từ vựng</p>
    </div>
    <p class="text">
      Duy trì thói quen ôn tập mỗi ngày giúp bạn ghi nhớ lâu hơn và đạt điểm cao trong kỳ thi TOEIC.
      Chỉ cần <strong>5–10 phút</strong> là xong!
    </p>
    <div class="btn-container">
      <a href="${practiceUrl}" class="btn btn-primary">🚀 Ôn từ vựng ngay</a>
    </div>
    <hr class="divider" />
    <p class="note">
      📈 Hệ thống SM-2 tự động điều chỉnh lịch ôn tập dựa trên mức độ ghi nhớ của bạn.<br />
      Bỏ qua ngày hôm nay có thể làm chậm tiến trình học tập.
    </p>
  `;
  return baseTemplate(content, `Bạn có ${count} từ vựng cần ôn hôm nay — TOEIC Master`)
    .replace('{{CLIENT_URL}}', clientUrl);
};

