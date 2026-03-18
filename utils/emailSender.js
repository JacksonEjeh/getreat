import nodemailer from "nodemailer";
import { config } from "../configs/config.js";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);


const sendEmail = async (email, subject, message) => {
    try {
        const mailOptions = {
            from: `"Getreat Team" <${config.email}>`,
            to: email,
            subject,
            html: `<p style="font-size: 16px; color: #333;">${message}</p>`,
        };
        const info = await sgMail.send(mailOptions);

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