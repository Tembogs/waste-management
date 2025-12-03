import { configDotenv } from "dotenv";
import nodemailer from "nodemailer";

configDotenv()

const sendEmail = async (to, subject, html) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail", // tells nodemailer to use Gmail’s SMTP
            auth: {
                user: process.env.GMAIL_USER, // your Gmail address
                pass: process.env.GMAIL_PASS, // app password (not your actual Gmail password!)
            },
        });

        const info = await transporter.sendMail({
            from: "WasteWise Nigeria <onboarding@tembogs.dev>",
            to,
            subject,
            html,
        });

        console.log("Message sent: %s", info.messageId);
    } catch (error) {
        console.error("Error sending email: ", error);
    }
};

export default sendEmail;