import { EventEmitter } from "node:events";
import { login_successfuly_template } from "../../Templates/Login_Successfuly_Email.js";
import { template } from "../../Templates/Email_OTP.js";
import { emailSubject, sendEmail } from "../Email/sendEmail.utils.js";

export const emailEvent = new EventEmitter();

export const sendConfirmEmailOtp = async ({ to, otp, fullName }) => {
    await sendEmail({
        to,
        text: "Hello From Gait Recognition App",
        html: template(otp, fullName),
        subject: emailSubject.confirmEmail,
    });
};


export const sendLoginNotification = async ({ to, fullName }) => {
    await sendEmail({
        to,
        subject: emailSubject.login,
        text: `Welcome back ${fullName}`,
        html: login_successfuly_template(fullName),
    });
};

export const sendForgetPasswordOtp = async ({ to, otp, fullName }) => {
    await sendEmail({
        to,
        subject: emailSubject.resetPassword,
        text: `Welcome back ${fullName}`,
        html: template(otp, fullName, emailSubject.resetPassword),
    });
};

// Keep backward compatibility with existing event-based usage.
emailEvent.on("confirmEmail", async (data) => {
    try {
        await sendConfirmEmailOtp({ to: data.to, otp: data.otp, fullName: data.fullName || data.fullname });
    } catch (error) {
        console.error("Email event 'confirmEmail' failed:", error?.message || error);
    }
});

emailEvent.on("LoginSuccessfuly", async (data) => {
    try {
        await sendLoginNotification({ to: data.to, fullName: data.fullName || data.fullname });
    } catch (error) {
        console.error("Email event 'LoginSuccessfuly' failed:", error?.message || error);
    }
});

emailEvent.on("forgetPassword", async (data) => {
    try {
        await sendForgetPasswordOtp({ to: data.to, otp: data.otp, fullName: data.fullName || data.fullname });
    } catch (error) {
        console.error("Email event 'forgetPassword' failed:", error?.message || error);
    }
});
