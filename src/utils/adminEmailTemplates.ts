/**
 * Admin Email Templates — TOEIC Master
 * Dành cho các email do Admin trigger: phê duyệt VIP, từ chối VIP
 */

const brandColor = '#2563EB';
const dangerColor = '#EF4444';
const successColor = '#22C55E';

const baseTemplate = (content: string, previewText: string = '') => `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TOEIC Master</title>
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
    .info-box { border-radius: 8px; padding: 16px 24px; margin: 20px 0; }
    .info-box-success { background-color: #F0FDF4; border-left: 4px solid ${successColor}; }
    .info-box-danger { background-color: #FEF2F2; border-left: 4px solid ${dangerColor}; }
    .note { font-size: 13px; color: #94A3B8; line-height: 1.6; }
    .footer { background-color: #F8FAFC; padding: 24px 40px; text-align: center; border-top: 1px solid #E2E8F0; }
    .footer-text { font-size: 12px; color: #94A3B8; line-height: 1.6; margin: 0; }
    .footer-link { color: ${brandColor}; text-decoration: none; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-gold { background-color: #FEF9C3; color: #854D0E; }
    .badge-danger { background-color: #FEE2E2; color: ${dangerColor}; }
    @media (max-width: 600px) {
      .body { padding: 24px 20px; }
      .footer { padding: 20px; }
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
          Nếu bạn không thực hiện yêu cầu này, hãy liên hệ hỗ trợ.<br />
          <a href="{{CLIENT_URL}}" class="footer-link">Truy cập TOEIC Master</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

/* ══════════════════════════════════════════════════════════════
   1. VIP APPROVED — Tài khoản VIP được phê duyệt
══════════════════════════════════════════════════════════════ */
export const vipApprovedTemplate = (params: {
  name: string;
  expiresAt: string; // formatted date string
  clientUrl: string;
}) => {
  const { name, expiresAt, clientUrl } = params;
  const content = `
    <span class="badge badge-gold">⭐ Tài khoản VIP</span>
    <h1 class="title" style="margin-top:16px;">Chúc mừng, tài khoản VIP của bạn đã được kích hoạt! 🎉</h1>
    <p class="text">
      Xin chào <strong>${name}</strong>, yêu cầu nâng cấp VIP của bạn đã được phê duyệt.
      Hãy bắt đầu trải nghiệm tất cả tính năng cao cấp ngay bây giờ!
    </p>
    <div class="info-box info-box-success">
      <p style="margin:0;font-size:13px;color:#15803D;font-weight:600;">Thông tin gói VIP của bạn</p>
      <p style="margin:8px 0 0;font-size:15px;color:#0F172A;">⏰ Có hiệu lực đến: <strong>${expiresAt}</strong></p>
    </div>
    <p class="text">Với tài khoản VIP, bạn có thể truy cập:</p>
    <ul style="color:#475569;font-size:15px;line-height:2;margin:0 0 20px;padding-left:20px;">
      <li>📚 Toàn bộ ngân hàng đề thi TOEIC</li>
      <li>📊 Phân tích chuyên sâu theo từng chủ đề</li>
      <li>🧠 Flashcard không giới hạn với thuật toán SM-2</li>
      <li>🏆 So sánh hiệu suất với toàn cộng đồng</li>
    </ul>
    <div class="btn-container">
      <a href="${clientUrl}/dashboard" class="btn btn-primary">🚀 Bắt đầu học ngay</a>
    </div>
  `;
  return baseTemplate(content, `Tài khoản VIP của bạn đã được kích hoạt trên TOEIC Master`)
    .replace('{{CLIENT_URL}}', clientUrl);
};

/* ══════════════════════════════════════════════════════════════
   2. VIP REJECTED — Yêu cầu VIP bị từ chối
══════════════════════════════════════════════════════════════ */
export const vipRejectedTemplate = (params: {
  name: string;
  rejectReason: string;
  clientUrl: string;
}) => {
  const { name, rejectReason, clientUrl } = params;
  const content = `
    <span class="badge badge-danger">Yêu cầu không được phê duyệt</span>
    <h1 class="title" style="margin-top:16px;">Yêu cầu VIP của bạn chưa được duyệt</h1>
    <p class="text">
      Xin chào <strong>${name}</strong>, sau khi xem xét, yêu cầu nâng cấp tài khoản VIP của bạn
      chưa được phê duyệt vào lúc này.
    </p>
    <div class="info-box info-box-danger">
      <p style="margin:0;font-size:13px;color:#B91C1C;font-weight:600;">Lý do từ chối</p>
      <p style="margin:8px 0 0;font-size:15px;color:#0F172A;">${rejectReason}</p>
    </div>
    <p class="text">
      Nếu bạn cho rằng đây là nhầm lẫn hoặc muốn thử lại, hãy đảm bảo ảnh xác nhận thanh toán
      rõ ràng và đúng định dạng rồi gửi lại yêu cầu.
    </p>
    <div class="btn-container">
      <a href="${clientUrl}/profile" class="btn btn-primary">Gửi lại yêu cầu</a>
    </div>
    <hr class="divider" />
    <p class="note">
      Nếu cần hỗ trợ, hãy liên hệ với chúng tôi qua email hỗ trợ.<br />
      Chúng tôi luôn sẵn sàng giúp đỡ bạn.
    </p>
  `;
  return baseTemplate(content, `Yêu cầu nâng cấp VIP TOEIC Master của bạn chưa được phê duyệt`)
    .replace('{{CLIENT_URL}}', clientUrl);
};
