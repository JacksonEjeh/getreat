import nodemailer from "nodemailer";
import { config } from "../configs/config.js";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: config.email,
        pass: config.email_password,
    },
    family: 4, // <-- FORCE IPv4 for Render
});

const sendEmail = async (email, subject, message) => {
    try {
        const mailOptions = {
            from: `"Getreat Team" <${config.email}>`,
            to: email,
            subject,
            html: `<p style="font-size: 16px; color: #333;">${message}</p>`,
        };
        const info = await transporter.sendMail(mailOptions);

        return {
            success: true,
            message: `Email sent successfully to ${email}`,
            messageId: info.messageId,
        };
    } catch (error) {
        console.log("Error sending email:", error.message);
        return {
            success: false,
            message: "Failed to send email",
            error: error.message,
        };
    }
};

export default sendEmail;