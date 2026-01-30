const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: process.env.SMTP_PORT || 2525,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * @desc    Send meeting invitation/update email
 */
const sendMeetingEmail = async (to, subject, meetingDetails) => {
    const { title, startTime, endTime, isOnline, meetingLink, roomName, organizerName } = meetingDetails;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #6366f1;">${subject}: ${title}</h2>
            <p>Hi there,</p>
            <p>You have been invited to a meeting scheduled by <strong>${organizerName}</strong>.</p>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>🕒 Time:</strong> ${new Date(startTime).toLocaleString()} - ${new Date(endTime).toLocaleTimeString()}</p>
                <p><strong>📍 Location:</strong> ${isOnline ? `<a href="${meetingLink}">Join Online Meeting</a>` : roomName || 'To be decided'}</p>
            </div>
            
            <p>Please log in to the PMS to accept or decline the invitation.</p>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated notification from your Project Management System.</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: '"PMS Calendar" <calendar@pms.com>',
            to,
            subject: `${subject}: ${title}`,
            html
        });
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Failed to send email:', error);
    }
};

module.exports = {
    sendMeetingEmail
};
