module.exports = [
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[project]/src/lib/email.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sendPaymentConfirmedEmail",
    ()=>sendPaymentConfirmedEmail,
    "sendShipmentApprovedEmail",
    ()=>sendShipmentApprovedEmail,
    "sendShipmentCreatedEmail",
    ()=>sendShipmentCreatedEmail,
    "sendShipmentDeliveredEmail",
    ()=>sendShipmentDeliveredEmail,
    "sendShipmentDispatchedEmail",
    ()=>sendShipmentDispatchedEmail,
    "sendShipmentReceiverNotification",
    ()=>sendShipmentReceiverNotification,
    "sendShipmentStatusUpdateEmail",
    ()=>sendShipmentStatusUpdateEmail,
    "sendTicketCreatedEmail",
    ()=>sendTicketCreatedEmail,
    "sendTicketReplyNotification",
    ()=>sendTicketReplyNotification
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$resend$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/resend/dist/index.mjs [app-rsc] (ecmascript)");
;
const resend = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$resend$2f$dist$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Resend"](process.env.RESEND_API_KEY);
const FROM_EMAIL = 'PerfectExpress <onboarding@resend.dev>';
const APP_URL = ("TURBOPACK compile-time value", "https://perfectexpress-courier.vercel.app") || 'http://localhost:3000';
// Professional Email Wrap
const emailWrapper = (content)=>`
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f0f0f0; border-radius: 12px;">
    <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #1a2b3c; margin: 0; font-size: 24px;">PerfectExpress Courier</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Swift. Secure. Reliable.</p>
    </div>
    <div style="color: #334155; line-height: 1.6;">
        ${content}
    </div>
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f0f0f0; text-align: center; color: #94a3b8; font-size: 12px;">
        <p>© ${new Date().getFullYear()} PerfectExpress Courier Service. All rights reserved.</p>
        <p>This is an automated notification. Please do not reply to this email.</p>
    </div>
</div>
`;
async function sendShipmentReceiverNotification(to, trackingNumber, receiverName, senderName) {
    const html = emailWrapper(`
        <h2 style="color: #1e293b;">A Package is Coming Your Way! 📦</h2>
        <p>Hello <strong>${receiverName}</strong>,</p>
        <p><strong>${senderName}</strong> has initiated a shipment to you via PerfectExpress Courier.</p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Tracking ID</p>
            <p style="margin: 4px 0 0; font-family: monospace; font-size: 18px; font-weight: bold; color: #3b82f6;">${trackingNumber}</p>
        </div>
        <p>You can track this shipment at any time using the button below. We'll notify you of any updates.</p>
        <div style="text-align: center; margin-top: 32px;">
            <a href="${APP_URL}/track/${trackingNumber}" style="background: #1a2b3c; color: white; padding: 12px 24px; border-radius: 24px; text-decoration: none; font-weight: bold;">Track Package</a>
        </div>
    `);
    return resend.emails.send({
        from: FROM_EMAIL,
        to: [
            to
        ],
        subject: `Package Alert: ${senderName} is sending you a package`,
        html: html
    });
}
async function sendPaymentConfirmedEmail(to, trackingNumber, recipientName) {
    const html = emailWrapper(`
        <h2 style="color: #1e293b;">Payment Confirmed! ✅</h2>
        <p>Hello <strong>${recipientName}</strong>,</p>
        <p>Payment for shipment <strong>${trackingNumber}</strong> has been confirmed and processed.</p>
        <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border: 1px solid #bbfcce; margin: 20px 0;">
            <p style="margin: 0; color: #166534; font-size: 14px;">Status</p>
            <p style="margin: 4px 0 0; font-size: 18px; font-weight: bold; color: #15803d;">Ready for Dispatch</p>
        </div>
        <p>Your package will be dispatched soon. You'll receive another notification once it's on the way.</p>
        <div style="text-align: center; margin-top: 32px;">
            <a href="${APP_URL}/track/${trackingNumber}" style="background: #15803d; color: white; padding: 12px 24px; border-radius: 24px; text-decoration: none; font-weight: bold;">Track Shipment</a>
        </div>
    `);
    return resend.emails.send({
        from: FROM_EMAIL,
        to: [
            to
        ],
        subject: `Payment Confirmed: Shipment ${trackingNumber}`,
        html: html
    });
}
async function sendShipmentCreatedEmail(to, trackingNumber, senderName) {
    const html = emailWrapper(`
        <h2 style="color: #1e293b;">Shipment Request Received</h2>
        <p>Hello <strong>${senderName}</strong>,</p>
        <p>Your shipment request has been successfully created. Our team is currently reviewing the details to provide you with a quote.</p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Draft Tracking ID</p>
            <p style="margin: 4px 0 0; font-family: monospace; font-size: 18px; font-weight: bold; color: #3b82f6;">${trackingNumber}</p>
        </div>
        <p>Wait for a follow-up email once your shipment is approved and the price is set.</p>
        <div style="text-align: center; margin-top: 32px;">
            <a href="${APP_URL}/track/${trackingNumber}" style="background: #1a2b3c; color: white; padding: 12px 24px; border-radius: 24px; text-decoration: none; font-weight: bold;">Track My Request</a>
        </div>
    `);
    return resend.emails.send({
        from: FROM_EMAIL,
        to: [
            to
        ],
        subject: `Shipment Created: ${trackingNumber}`,
        html: html
    });
}
async function sendShipmentApprovedEmail(to, trackingNumber, price) {
    const html = emailWrapper(`
        <h2 style="color: #1e293b;">Shipment Approved & Quote Ready</h2>
        <p>Great news! Your shipment request has been approved.</p>
        <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border: 1px solid #bbfcce; margin: 20px 0;">
             <p style="margin: 0; color: #166534; font-size: 14px;">Total Shipping Cost</p>
             <p style="margin: 4px 0 0; font-size: 24px; font-weight: bold; color: #15803d;">$${price.toFixed(2)}</p>
        </div>
        <p>Please log in to your dashboard to complete the payment. Your package will be dispatched immediately once payment is confirmed.</p>
        <div style="text-align: center; margin-top: 32px;">
            <a href="${APP_URL}/dashboard" style="background: #15803d; color: white; padding: 12px 24px; border-radius: 24px; text-decoration: none; font-weight: bold;">Make Payment</a>
        </div>
        <p style="font-size: 13px; color: #64748b; margin-top: 24px;">Tracking ID: ${trackingNumber}</p>
    `);
    return resend.emails.send({
        from: FROM_EMAIL,
        to: [
            to
        ],
        subject: `Payment Required: Shipment ${trackingNumber}`,
        html: html
    });
}
async function sendShipmentDispatchedEmail(to, trackingNumber, origin) {
    const html = emailWrapper(`
        <h2 style="color: #1e293b;">Your Package is on the Way! 🚀</h2>
        <p>Your shipment has been dispatched from our facility and is now in transit.</p>
        <div style="border-left: 4px solid #3b82f6; padding-left: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">Current Status</p>
            <p style="margin: 4px 0 0; font-weight: bold; color: #1e293b;">In Transit</p>
            <p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">Location</p>
            <p style="margin: 4px 0 0; font-weight: bold; color: #1e293b;">${origin}</p>
        </div>
        <div style="text-align: center; margin-top: 32px;">
            <a href="${APP_URL}/track/${trackingNumber}" style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 24px; text-decoration: none; font-weight: bold;">Live Tracking</a>
        </div>
    `);
    return resend.emails.send({
        from: FROM_EMAIL,
        to: [
            to
        ],
        subject: `Dispatched: Your package ${trackingNumber} is moving!`,
        html: html
    });
}
async function sendShipmentStatusUpdateEmail(to, trackingNumber, status, location, note) {
    const html = emailWrapper(`
        <h2 style="color: #1e293b;">Delivery Status Update</h2>
        <p>There is a new update for your shipment <strong>${trackingNumber}</strong>.</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <div style="margin-bottom: 12px;">
                <span style="color: #64748b; font-size: 12px; text-transform: uppercase;">New Status:</span>
                <span style="display: block; font-weight: bold; color: #1e293b; font-size: 16px;">${status.toUpperCase()}</span>
            </div>
            <div style="margin-bottom: 12px;">
                <span style="color: #64748b; font-size: 12px; text-transform: uppercase;">Location:</span>
                <span style="display: block; font-weight: bold; color: #1e293b;">${location}</span>
            </div>
            ${note ? `
            <div>
                <span style="color: #64748b; font-size: 12px; text-transform: uppercase;">Note:</span>
                <p style="margin: 4px 0 0; color: #334155;">${note}</p>
            </div>
            ` : ''}
        </div>
        <div style="text-align: center; margin-top: 32px;">
            <a href="${APP_URL}/track/${trackingNumber}" style="background: #1a2b3c; color: white; padding: 12px 24px; border-radius: 24px; text-decoration: none; font-weight: bold;">View Details</a>
        </div>
    `);
    return resend.emails.send({
        from: FROM_EMAIL,
        to: [
            to
        ],
        subject: `Update: Shipment ${trackingNumber} - ${status}`,
        html: html
    });
}
async function sendShipmentDeliveredEmail(to, trackingNumber) {
    const html = emailWrapper(`
        <h2 style="color: #1a2b3c; text-align: center;">Package Delivered! 🎉</h2>
        <p style="text-align: center;">Your shipment <strong>${trackingNumber}</strong> has been successfully delivered.</p>
        <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 60px;">📦✅</div>
        </div>
        <p>Thank you for choosing PerfectExpress. We hope you are satisfied with our service!</p>
        <div style="text-align: center; margin-top: 32px;">
            <a href="${APP_URL}/track/${trackingNumber}" style="background: #1a2b3c; color: white; padding: 12px 24px; border-radius: 24px; text-decoration: none; font-weight: bold;">View Delivery History</a>
        </div>
    `);
    return resend.emails.send({
        from: FROM_EMAIL,
        to: [
            to
        ],
        subject: `Delivered: Shipment ${trackingNumber}`,
        html: html
    });
}
async function sendTicketReplyNotification(to, ticketNumber, subject, replyMessage, senderType) {
    const isAdminReply = senderType === 'admin';
    const html = emailWrapper(`
        <h2 style="color: #1e293b;">New Reply to Your Support Ticket</h2>
        <p>There's a new response to your support ticket.</p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Ticket</p>
            <p style="margin: 4px 0 0; font-family: monospace; font-size: 16px; font-weight: bold; color: #3b82f6;">${ticketNumber}</p>
            <p style="margin: 12px 0 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Subject</p>
            <p style="margin: 4px 0 0; font-weight: 600; color: #1e293b;">${subject}</p>
        </div>
        <div style="background: ${isAdminReply ? '#f0f9ff' : '#f0fdf4'}; padding: 16px; border-radius: 8px; border-left: 4px solid ${isAdminReply ? '#3b82f6' : '#22c55e'}; margin: 20px 0;">
            <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">
                ${isAdminReply ? 'Support Team Response' : 'Customer Reply'}
            </p>
            <p style="margin: 8px 0 0; color: #334155; line-height: 1.6;">${replyMessage}</p>
        </div>
        <div style="text-align: center; margin-top: 32px;">
            <a href="${APP_URL}/support" style="background: #1a2b3c; color: white; padding: 12px 24px; border-radius: 24px; text-decoration: none; font-weight: bold;">View Ticket</a>
        </div>
    `);
    return resend.emails.send({
        from: FROM_EMAIL,
        to: [
            to
        ],
        subject: `[${ticketNumber}] New Reply: ${subject}`,
        html: html
    });
}
async function sendTicketCreatedEmail(to, ticketNumber, subject) {
    const html = emailWrapper(`
        <h2 style="color: #1e293b;">Support Ticket Created</h2>
        <p>Thank you for contacting PerfectExpress support. We've received your request and will respond as soon as possible.</p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Your Ticket Number</p>
            <p style="margin: 4px 0 0; font-family: monospace; font-size: 20px; font-weight: bold; color: #3b82f6;">${ticketNumber}</p>
            <p style="margin: 16px 0 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Subject</p>
            <p style="margin: 4px 0 0; font-weight: 600; color: #1e293b;">${subject}</p>
        </div>
        <p>You can view and respond to this ticket at any time by visiting our support center.</p>
        <div style="text-align: center; margin-top: 32px;">
            <a href="${APP_URL}/support" style="background: #1a2b3c; color: white; padding: 12px 24px; border-radius: 24px; text-decoration: none; font-weight: bold;">View Support Center</a>
        </div>
    `);
    return resend.emails.send({
        from: FROM_EMAIL,
        to: [
            to
        ],
        subject: `Ticket Created: ${ticketNumber} - ${subject}`,
        html: html
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__8c4420d3._.js.map