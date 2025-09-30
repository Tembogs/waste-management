import { configDotenv } from "dotenv";
import nodemailer from "nodemailer";

configDotenv()

 export const sendEmail = async (to, subject, html) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail", 
            auth: {
                user: process.env.GMAIL_USER, 
                pass: process.env.GMAIL_PASS,
            },
        });

        const info = await transporter.sendMail({
            from: '"  Waste-Wase! Nigeria" <no-reply@example.com>',
            to,
            subject,
            html,
        });

        
    } catch (error) {
        console.error("Error sending email: ", error);
    }
};

