import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    // port: parseInt(process.env.SMTP_PORT || '465'),
    // secure: parseInt(process.env.SMTP_PORT || '465') === 465,
    port: parseInt(process.env.SMTP_PORT || '587'), // Default to 587
    secure: false, // Set to false for port 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false,
    },
    logger: false, // Enable logging
    debug: false,  // Enable debugging
});

// Define the sendMail function
export const sendMailToAdmin = async (
    firstName: string,
    lastName: string,
    email: string,
    message: string

) => {
    const subject = `Support Request from ${firstName} ${lastName}`;
    const text = `Name: ${firstName} ${lastName}\nEmail: ${email}\n\nMessage:\n${message}`;
    const html = `<p><strong>Name:</strong> ${firstName} ${lastName}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Message:</strong></p>
              <p>${message}</p>`;

    const mailOptions = {
        from: process.env.SMTP_FROM_EMAIL,
        to: process.env.SMTP_TO_EMAIL,
        subject, // Subject line
        text, // Plain text body
        html, // HTML body
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        console.log(info);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

