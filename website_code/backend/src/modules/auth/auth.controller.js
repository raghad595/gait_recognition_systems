import { Router } from "express";
import * as authService from "./auth.service.js";
import { authentication, tokenTypeEnum } from "../../middleware/authenticaion.middleware.js";
import { validation } from "../../middleware/validation.middleware.js";
import { 
    confirmEmailValidation,
    forgetPasswordValidation,
    loginValidation,
    logoutValidation,
    resetPasswordValidation,
    signUpValidation,
    socialLoginValidation,
    resendEmailOtpValidation,
    resendForgotPasswordOtpValidation
} from "./auth.validation.js";

const router = Router();
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

router.post('/signup', validation(signUpValidation), asyncHandler(authService.signup));

router.post('/login',validation(loginValidation),asyncHandler(authService.login));

router.post('/logout',validation(logoutValidation),authentication({tokenType:tokenTypeEnum.access }),asyncHandler(authService.logout));

router.post('/social-login',validation(socialLoginValidation),asyncHandler(authService.loginWithGmail));

router.get('/refresh-token',authentication({tokenType:tokenTypeEnum.refresh }),asyncHandler(authService.refreshToken));

router.patch('/confirm-email',validation(confirmEmailValidation),asyncHandler(authService.confirmEmail));

router.post('/resend-email-otp',validation(resendEmailOtpValidation),asyncHandler(authService.resendEmailOtp));

router.patch('/forget-password',validation(forgetPasswordValidation),asyncHandler(authService.forgetPassword));

router.post('/resend-forgot-password-otp',validation(resendForgotPasswordOtpValidation),asyncHandler(authService.resendForgotPasswordOtp));

router.patch('/reset-password',validation(resetPasswordValidation),asyncHandler(authService.resetPassword));

export default router;
