export interface EmailPayload {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

// Sanitize user input before interpolating into HTML templates
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export const emailService = {
    async sendEmail(_payload: EmailPayload) {
        // Stub: In production, call a Supabase Edge Function that uses the Resend API.
        return { success: true };
    },

    templates: {
        shipmentConfirmation(trackingNumber: string, recipientName: string) {
            const safeName = escapeHtml(recipientName);
            const safeTracking = escapeHtml(trackingNumber);
            return {
                subject: `PerfectExpress | Shipment Registered: ${safeTracking}`,
                text: `Hello ${recipientName}, your shipment has been registered with tracking number ${trackingNumber}. You can track it on our platform.`,
                html: `<h1>Shipment Registered</h1><p>Hello ${safeName},</p><p>Your shipment <strong>${safeTracking}</strong> has been successfully created. View it <a href="/track/${safeTracking}">here</a>.</p>`
            };
        },
        receiverShipmentNotification(trackingNumber: string, receiverName: string, senderName: string) {
            const safeSender = escapeHtml(senderName);
            const safeReceiver = escapeHtml(receiverName);
            const safeTracking = escapeHtml(trackingNumber);
            return {
                subject: `PerfectExpress | Incoming Shipment: ${safeTracking}`,
                text: `Hello ${receiverName}, ${senderName} has created a shipment to you. Track it with ${trackingNumber}.`,
                html: `<h1>Incoming Shipment</h1><p>Hello ${safeReceiver},</p><p><strong>${safeSender}</strong> has created a shipment to you.</p><p>Tracking: <strong>${safeTracking}</strong></p><p>Track it <a href="/track/${safeTracking}">here</a>.</p>`
            };
        },
        adminNewShipmentAlert(trackingNumber: string, userName: string) {
            const safeName = escapeHtml(userName);
            const safeTracking = escapeHtml(trackingNumber);
            return {
                subject: `ADMIN ALERT | New Shipment Submission: ${safeTracking}`,
                text: `User ${userName} has submitted a new shipment for processing. ID: ${trackingNumber}`,
                html: `<h1>New Shipment Submission</h1><p>User <strong>${safeName}</strong> has created a new manifest.</p><p>Tracking: <strong>${safeTracking}</strong></p>`
            };
        },
        statusUpdate(trackingNumber: string, status: string) {
            const safeTracking = escapeHtml(trackingNumber);
            const safeStatus = escapeHtml(status);
            return {
                subject: `PerfectExpress | Tracking Update: ${safeTracking}`,
                text: `Your shipment ${trackingNumber} has been updated to: ${status.toUpperCase()}.`,
                html: `<h1>Tracking Update</h1><p>The status of your shipment <strong>${safeTracking}</strong> has changed to <strong>${safeStatus.toUpperCase()}</strong>.</p>`
            };
        },
        supportReply(ticketId: string, message: string) {
            const safeTicketId = escapeHtml(ticketId);
            const safeMessage = escapeHtml(message.substring(0, 50));
            return {
                subject: `PerfectExpress | New Support Message: ${safeTicketId}`,
                text: `You have a new message regarding ticket ${ticketId}.`,
                html: `<h1>Support Ticket Update</h1><p>A new response has been posted to ticket <strong>${safeTicketId}</strong>.</p><p>Preview: "${safeMessage}..."</p>`
            }
        }
    }
};
