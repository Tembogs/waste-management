import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async (to, subject, html) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "WasteWise Nigeria <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Resend email error:", error);
      return false;
    }

    console.log("Resend email sent:", data);
    return true;
  } catch (err) {
    console.error("Resend unexpected error:", err);
    return false;
  }
};
