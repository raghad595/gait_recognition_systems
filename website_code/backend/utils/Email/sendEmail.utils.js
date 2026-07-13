import nodemailer from"nodemailer";

function firstNonEmpty(...values) {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
}

function looksLikePlaceholder(value) {
    if (!value) return true;
    const normalized = String(value).trim().toLowerCase();
    return (
        normalized.includes("your_email") ||
        normalized.includes("your_gmail") ||
        normalized.includes("app_password") ||
        normalized.includes("example.com")
    );
}

function normalizeAppPassword(raw) {
    // Gmail App Password is shown grouped with spaces; SMTP expects contiguous chars.
    return String(raw || "").replace(/\s+/g, "").trim();
}

export async function sendEmail({to="", subject="Gait Recognition", text="", html="", cc="", bcc="", attachments=[]})
{
    const user = firstNonEmpty(process.env.EMAIL, process.env.SMTP_USER, process.env.EMAIL_USER);
    const rawPass = firstNonEmpty(
        process.env.APP_PASSWORD,
        process.env.SMTP_PASS,
        process.env.EMAIL_PASS,
        process.env.SMTP_PASSWORD
    );
    const pass = normalizeAppPassword(rawPass);

    if (!user || !pass || looksLikePlaceholder(user) || looksLikePlaceholder(pass)) {
        throw new Error(
            "Email credentials are invalid. Set real EMAIL + APP_PASSWORD (or SMTP_USER + SMTP_PASS). For Gmail, use a 16-char App Password from Google Account Security."
        );
    }

    const hasCustomSmtp = Boolean(firstNonEmpty(process.env.SMTP_HOST));
    const transporter = hasCustomSmtp
        ? nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
            auth: { user, pass },
        })
        : nodemailer.createTransport({
            service: "gmail",
            auth: { user, pass },
        });

    const info = await transporter.sendMail({
        from: `"Gait Recognition" <${firstNonEmpty(process.env.EMAIL_FROM, user)}>` ,
        to,
        subject,
        text,
        html,
        cc,
        bcc,
        attachments,
    });

    console.log("Message sent:", info.messageId);
};

export const emailSubject = {
    confirmEmail: "Confirm Your Email",
    resetPassword:"Reset Your Password",
    welcome:"Welcome To Gait Recognition",
    login: "Login Notification"
}