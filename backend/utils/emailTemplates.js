/**
 * Email Templates for Customer Bookings
 */

const formatDate = (date) => new Date(date).toLocaleDateString();
const formatTime = (time) => new Date(time).toLocaleTimeString();

/**
 * Booking Created Email Template
 */
const getBookingCreatedTemplate = (data) => {
    const subject = data.payment
        ? 'Booking Created - Payment Required'
        : data.status === 'PENDING'
            ? 'Booking Created - Awaiting Confirmation'
            : 'Booking Confirmed';

    const text = `Dear ${data.customerName},

Your booking has been created successfully!

Appointment: ${data.appointmentTitle}
Provider: ${data.providerName}
Date: ${formatDate(data.date)}
Time: ${formatTime(data.startTime)} - ${formatTime(data.endTime)}
Status: ${data.status}

${data.payment ? `Payment Required: $${data.payment.amount}\nPlease complete payment to confirm your booking.` : ''}
${data.confirmationMessage || ''}

Best regards,
Odoo Appointment Booking Team`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${subject}</h2>
            <p>Dear ${data.customerName},</p>
            <p>Your booking has been created successfully!</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Appointment:</strong> ${data.appointmentTitle}</p>
                <p><strong>Provider:</strong> ${data.providerName}</p>
                <p><strong>Date:</strong> ${formatDate(data.date)}</p>
                <p><strong>Time:</strong> ${formatTime(data.startTime)} - ${formatTime(data.endTime)}</p>
                <p><strong>Status:</strong> ${data.status}</p>
            </div>
            
            ${data.payment ? `
                <p style="color: #d9534f;">
                    <strong>Payment Required: $${data.payment.amount}</strong><br>
                    Please complete payment to confirm your booking.
                </p>
            ` : ''}
            
            ${data.confirmationMessage ? `<p>${data.confirmationMessage}</p>` : ''}
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                Odoo Appointment Booking Team
            </p>
        </div>
    `;

    return { subject, text, html };
};

/**
 * Payment Confirmed Email Template
 */
const getPaymentConfirmedTemplate = (data) => {
    const subject = data.status === 'CONFIRMED'
        ? 'Payment Confirmed - Booking Confirmed'
        : 'Payment Received - Awaiting Confirmation';

    const text = `Dear ${data.customerName},

Your payment has been received successfully!

Appointment: ${data.appointmentTitle}
Provider: ${data.providerName}
Date: ${formatDate(data.date)}
Time: ${formatTime(data.startTime)} - ${formatTime(data.endTime)}
Status: ${data.status}
Transaction ID: ${data.transactionId}

${data.status === 'CONFIRMED' ? 'Your booking is now confirmed!' : 'Your booking is awaiting confirmation.'}

Best regards,
Odoo Appointment Booking Team`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #5cb85c;">${subject}</h2>
            <p>Dear ${data.customerName},</p>
            <p>Your payment has been received successfully!</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Appointment:</strong> ${data.appointmentTitle}</p>
                <p><strong>Provider:</strong> ${data.providerName}</p>
                <p><strong>Date:</strong> ${formatDate(data.date)}</p>
                <p><strong>Time:</strong> ${formatTime(data.startTime)} - ${formatTime(data.endTime)}</p>
                <p><strong>Status:</strong> ${data.status}</p>
                <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
            </div>
            
            <p style="color: #5cb85c; font-weight: bold;">
                ${data.status === 'CONFIRMED'
            ? '✓ Your booking is now confirmed!'
            : 'Your booking is awaiting confirmation.'}
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                Odoo Appointment Booking Team
            </p>
        </div>
    `;

    return { subject, text, html };
};

/**
 * Booking Cancelled Email Template
 */
const getBookingCancelledTemplate = (data) => {
    const subject = 'Booking Cancelled';
    const refundAmount = typeof data.refundAmount === 'number' ? data.refundAmount : 0;

    const text = `Dear ${data.customerName || 'Valued Customer'},

Your booking has been cancelled.

Appointment: ${data.appointmentTitle || 'N/A'}
Provider: ${data.providerName || 'N/A'}
Date: ${formatDate(data.date) || 'N/A'}
Time: ${formatTime(data.startTime) || 'N/A'}
Reason: ${data.reason || 'No reason provided'}

${refundAmount > 0 ? `Refund Amount: $${refundAmount.toFixed(2)}\nRefund will be processed within 5-7 business days.` : ''}

Best regards,
Odoo Appointment Booking Team`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d9534f;">${subject}</h2>
            <p>Dear ${data.customerName || 'Valued Customer'},</p>
            <p>Your booking has been cancelled.</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Appointment:</strong> ${data.appointmentTitle || 'N/A'}</p>
                <p><strong>Provider:</strong> ${data.providerName || 'N/A'}</p>
                <p><strong>Date:</strong> ${formatDate(data.date) || 'N/A'}</p>
                <p><strong>Time:</strong> ${formatTime(data.startTime) || 'N/A'}</p>
                <p><strong>Reason:</strong> ${data.reason || 'No reason provided'}</p>
            </div>
            
            ${refundAmount > 0 ? `
                <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="color: #155724; margin: 0;"><strong>Refund Amount: $${refundAmount.toFixed(2)}</strong></p>
                    <p style="color: #155724; margin: 5px 0 0 0; font-size: 14px;">Refund will be processed within 5-7 business days.</p>
                </div>
            ` : '<p style="color: #999; font-size: 14px;">No refund is applicable for this cancellation.</p>'}
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                Odoo Appointment Booking Team
            </p>
        </div>
    `;

    return { subject, text, html };
};

/**
 * Booking Rescheduled Email Template
 */
const getBookingRescheduledTemplate = (data) => {
    const subject = 'Booking Rescheduled';

    const text = `Dear ${data.customerName},

Your booking has been rescheduled.

Appointment: ${data.appointmentTitle}
Provider: ${data.providerName}
New Date: ${formatDate(data.date)}
New Time: ${formatTime(data.startTime)} - ${formatTime(data.endTime)}
Status: ${data.status}

${data.status === 'PENDING'
            ? 'Your rescheduled booking is pending confirmation.'
            : 'Your rescheduled booking is confirmed.'}

Best regards,
Odoo Appointment Booking Team`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #5cb85c;">${subject}</h2>
            <p>Dear ${data.customerName},</p>
            <p>Your booking has been rescheduled.</p>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Appointment:</strong> ${data.appointmentTitle}</p>
                <p><strong>Provider:</strong> ${data.providerName}</p>
                <p><strong>New Date:</strong> ${formatDate(data.date)}</p>
                <p><strong>New Time:</strong> ${formatTime(data.startTime)} - ${formatTime(data.endTime)}</p>
                <p><strong>Status:</strong> ${data.status}</p>
            </div>
            
            ${data.status === 'PENDING'
            ? '<p style="color: #f0ad4e;">Your rescheduled booking is pending confirmation.</p>'
            : '<p style="color: #5cb85c;">Your rescheduled booking is confirmed.</p>'}
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
                Best regards,<br>
                Odoo Appointment Booking Team
            </p>
        </div>
    `;

    return { subject, text, html };
};

/**
 * Get email template by type
 */
const getEmailTemplate = (type, data) => {
    const templates = {
        created: getBookingCreatedTemplate,
        paymentConfirmed: getPaymentConfirmedTemplate,
        cancelled: getBookingCancelledTemplate,
        rescheduled: getBookingRescheduledTemplate
    };

    const templateFunction = templates[type];
    if (!templateFunction) {
        throw new Error(`Unknown email template type: ${type}`);
    }

    return templateFunction(data);
};

module.exports = {
    getEmailTemplate
};
