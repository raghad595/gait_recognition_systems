import { create, findOne } from "../../db/dbService.js";
import { providers, UserModel } from "../../db/models/user.model.js";
import { encrypt, decrypt } from "../../utils/Encryption/encription.utils.js";
import { compare, hash } from "../../utils/Hashing/hash.utils.js";
import { successResponse } from "../../utils/multer/successResponse.utils.js";
import { getNewLoginCredentials, logoutEnum, } from "../../utils/Token/token.utils.js";
import { OAuth2Client } from "google-auth-library";
import * as dbService from "../../db/dbService.js"
import { sendConfirmEmailOtp, sendForgetPasswordOtp } from "../../utils/Event/events.utils.js";
import { customAlphabet } from "nanoid";
import TokenModel from "../../db/models/token.model.js";

const isDevelopmentFallback = process.env.NODE_ENV !== "production";

const handleOtpDeliveryFailure = ({ error, email, otp, context }) => {
  if (!isDevelopmentFallback) {
    throw error;
  }

  console.warn(`[DEV OTP FALLBACK][${context}] Failed to send OTP email to ${email}: ${error?.message || error}`);
  console.warn(`[DEV OTP FALLBACK][${context}] Use OTP ${otp} for ${email}`);
};

export const signup = async (req, res, next) => {
  const { fullName, password, email, gender, phone } = req.body;

  if (await findOne({ model: UserModel, filter: { email } }))
    return next(new Error("User already exists", { cause: 409 }));

  const hashedPassword = await hash({ plainText: password });
  const encryptionPhone = phone ? encrypt(phone) : undefined;

  // Generate OTP
  const otp = customAlphabet("0123456789", 6)();
  const hashOtp = await hash({ plainText: otp });
  const otpExpiredAt = new Date(Date.now() + 2 * 60 * 1000);

  // Dev helper: print OTP in terminal to simplify local testing.
  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV OTP][signup] email=${email} otp=${otp}`);
  }

  try {
    await sendConfirmEmailOtp({ to: email, otp, fullName });
  } catch (error) {
    try {
      handleOtpDeliveryFailure({ error, email, otp, context: "signup" });
    } catch (deliveryError) {
      return next(new Error(`Failed to send OTP email: ${deliveryError?.message || "SMTP error"}`, { cause: 502 }));
    }
  }

  const users = await create({
    model: UserModel,
    data: [{
      fullName,
      password: hashedPassword,
      email,
      gender,
      phone: encryptionPhone,
      confirmEmailOtp: hashOtp,
      otpExpiredAt
    }],
  });
  const user = users[0];

  return successResponse({
    res,
    statusCode: 201,
    message: isDevelopmentFallback
      ? "Signup successful. OTP generated for local development."
      : "Signup successful. Verification OTP sent to Gmail.",
    data: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      gender: user.gender,
      phone: phone,
      message: isDevelopmentFallback
        ? "Check the backend console for the 6-digit verification code if email delivery is unavailable."
        : "Please check your Gmail inbox for the 6-digit verification code."
    },
  });
};

export const login = async (req, res, next) => {
  const { password, email } = req.body;

  const user = await findOne({ model: UserModel, filter: { email } });

  if (!user) {
    return next(new Error("Invalid email or password", { cause: 401 }));
  }

  // Check if account is frozen
  if (user.freezedAt) {
    return next(new Error("Account is frozen. Please contact administration.", { cause: 403 }));
  }

  // Check if provider is system
  if (user.provider !== providers.system) {
    return next(new Error(`Please login using ${user.provider}`, { cause: 400 }));
  }

  // Guard against incomplete/corrupted system accounts that have no password hash.
  if (!user.password) {
    return next(new Error("This account has no password set. Please reset your password or sign up again.", { cause: 400 }));
  }

  // Check if email is confirmed
  if (user.confirmEmail !== true) {
    return next(new Error("Email is not confirmed yet", { cause: 403 }));
  }

  // Check brute force protection
  if (user.lockUntil && user.lockUntil > Date.now()) {
    return next(new Error("Account is locked. Please try again later.", { cause: 403 }));
  }

  // Compare the hash password
  const isMatch = await compare({
    plainText: password,
    hash: user.password
  });

  if (!isMatch) {
    // Handle failed attempts
    const updatedUser = await dbService.findOneAndUpdate({
      model: UserModel,
      filter: { email },
      data: { $inc: { fieldAttempts: 1 } },
      options: { new: true }
    });

    if (updatedUser.fieldAttempts >= 5) {
      await dbService.updateOne({
        model: UserModel,
        filter: { email },
        data: {
          lockUntil: new Date(Date.now() + 15 * 60 * 1000), // Lock for 15 minutes
          fieldAttempts: 0
        }
      });
      return next(new Error("Too many invalid attempts. Account is locked for 15 minutes.", { cause: 403 }));
    }

    return next(new Error("Invalid email or password", { cause: 401 }));
  }

  // Successful login - Reset attempts
  if (user.fieldAttempts > 0 || user.lockUntil) {
    await dbService.updateOne({
      model: UserModel,
      filter: { email },
      data: { fieldAttempts: 0, lockUntil: null }
    });
  }

  const newCredentials = await getNewLoginCredentials(user)

  return successResponse({
    res,
    statusCode: 200,
    message: "Login successfully",
    data: {
      accessToken: newCredentials.accessToken,
      refreshToken: newCredentials.refreshToken,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone ? decrypt(user.phone) : undefined,
        role: user.role
      }
    },
  });
};

export const logout = async (req, res, next) => {
  const { flag } = req.body;
  let status = 200;

  switch (flag) {
    case logoutEnum.allDevices:
      await dbService.updateOne({
        model: UserModel,
        filter: { _id: req.user._id },
        data: {
          changeCredentialsTime: Date.now()
        }
      });
      break;

    default:
      // Calculate remaining lifetime of the token (assuming exp is in seconds)
      const remainingSeconds = req.decoded.exp - Math.floor(Date.now() / 1000);
      await dbService.create({
        model: TokenModel,
        data: {
          jti: req.decoded.jti,
          userId: req.user._id,
          expireIn: remainingSeconds > 0 ? remainingSeconds : 0,
          expiresAt: new Date(Math.max(req.decoded.exp * 1000, Date.now()))
        }
      });
      status = 201;
      break;
  }

  return successResponse({
    res,
    statusCode: status,
    message: "Logout successfully",
  });
};

export const confirmEmail = async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await dbService.findOne({
    model: UserModel,
    filter: {
      email,
      confirmEmail: false,
      confirmEmailOtp: { $exists: true }
    }
  });

  if (!user) {
    return next(new Error("User Not Found Or Email Already Confirmed", { cause: 401 }));
  }

  if (user.lockUntil && user.lockUntil > Date.now()) {
    return next(new Error("Account is locked. Please try again later", { cause: 403 }));
  }

  if (!user.confirmEmailOtp || user.otpExpiredAt < Date.now()) {
    return next(new Error("OTP has expired. Please request a new one.", { cause: 400 }));
  }
  if (user.fieldAttempts >= 5) {
    await dbService.updateOne({
      model: UserModel,
      filter: { email },
      data: {
        lockUntil: new Date(Date.now() + 15 * 60 * 1000), // Lock for 15 minutes
        fieldAttempts: 0
      }
    });
    return next(new Error("Too many invalid attempts. Account is locked for 15 minutes.", { cause: 403 }));
  }

  await dbService.updateOne({
    model: UserModel,
    filter: { email },
    data: {
      $inc: { fieldAttempts: 1 }
    }
  });

  const isMatch = await compare({
    plainText: otp,
    hash: user.confirmEmailOtp
  });

  if (!isMatch) {
    return next(new Error("Invalid OTP", { cause: 400 }));
  }

  await dbService.updateOne({
    model: UserModel,
    filter: { email },
    data: {
      confirmEmail: true,
      $unset: { confirmEmailOtp: true, otpExpiredAt: 0, fieldAttempts: 0, lockUntil: 0 },
      $inc: { __v: 1 }
    }
  });

  return successResponse({
    res,
    statusCode: 200,
    message: "Email confirmed successfully"
  });
};

async function verifyGoogleAccount({ idToken }) {
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.CLIENT_ID,
  });
  const payload = ticket.getPayload();
  return payload;
}

export const loginWithGmail = async (req, res, next) => {
  const { idToken } = req.body;

  const { email, email_verified, picture, given_name, family_name, name } =
    await verifyGoogleAccount({ idToken });

  if (!email_verified) {
    return next(new Error("Email is Not Verfied", { cause: 401 }));
  }

  const user = await dbService.findOne({
    model: UserModel,
    filter: { email },
  });

  if (user) {
    if (user.provider === providers.google) {
      const { accessToken, refreshToken } = await getNewLoginCredentials(user);

      return successResponse({
        res,
        statusCode: 200,
        message: "Login Successfully",
        data: { accessToken, refreshToken },
      });
    } else {
      return next(new Error("Email already registered with another provider", { cause: 409 }));
    }
  }

  const newUser = await dbService.create({
    model: UserModel,
    data: [
      {
        email,
        fullName: name || `${given_name || ""} ${family_name || ""}`.trim() || email.split("@")[0],
        photo: picture,
        provider: providers.google,
        confirmEmail: true,
      },
    ],
  });

  const { accessToken, refreshToken } = await getNewLoginCredentials(newUser[0]);

  return successResponse({
    res,
    statusCode: 201,
    message: "User Created Successfully",
    data: { accessToken, refreshToken },
  });
};

export const refreshToken = async (req, res, next) => {
  const user = req.user;

  const newCredentials = await getNewLoginCredentials(user)

  return successResponse({
    res,
    statusCode: 200,
    message: "New Credentials Created Successfully",
    data: {
      accessToken: newCredentials.accessToken,
      refreshToken: newCredentials.refreshToken
    },
  });
};

export const forgetPassword = async (req, res, next) => {
  const { email } = req.body;
  const otp = await customAlphabet("0123456789", 6)();
  const hashOtp = await hash({ plainText: otp })
  const otpExpiredAt = new Date(Date.now() + 2 * 60 * 1000);

  const user = await dbService.findOneAndUpdate({
    model: UserModel,
    filter: {
      email,
      provider: providers.system,
      confirmEmail: true,
      freezedAt: null
    },
    data: { forgetPasswordOtp: hashOtp, otpExpiredAt }
  });
  if (!user) {
    return next(new Error("User Not Found", { cause: 404 }));
  }
  try {
    await sendForgetPasswordOtp({ to: email, otp, fullName: user.fullName });
  } catch (error) {
    try {
      handleOtpDeliveryFailure({ error, email, otp, context: "forget-password" });
    } catch (deliveryError) {
      return next(new Error(`Failed to send OTP email: ${deliveryError?.message || "SMTP error"}`, { cause: 502 }));
    }
  }

  return successResponse({
    res,
    statusCode: 200,
    message: "OTP sent to your email successfully"
  })

};

export const resetPassword = async (req, res, next) => {
  const { email, otp, password } = req.body;

  const user = await dbService.findOne({
    model: UserModel,
    filter: {
      email,
      provider: providers.system,
      confirmEmail: true,
      freezedAt: null,
      forgetPasswordOtp: { $exists: true }
    }
  });
  if (!user) {
    return next(new Error("User Not Found", { cause: 404 }));
  }

  if (!await compare({ plainText: otp, hash: user.forgetPasswordOtp })) {
    return next(new Error("Invalid OTP", { cause: 400 }));
  }

  if (user.otpExpiredAt < Date.now()) {
    return next(new Error("OTP has expired. Please request a new one.", { cause: 400 }));
  }

  const hashedPassword = await hash({ plainText: password });

  await dbService.updateOne({
    model: UserModel,
    filter: { email },
    data: {
      password: hashedPassword,
      $unset: { forgetPasswordOtp: "", otpExpiredAt: "" },
      $inc: { __v: 1 }
    }
  });

  return successResponse({
    res,
    statusCode: 200,
    message: "Password Reset Successfully"
  });
};

export const resendEmailOtp = async (req, res, next) => {
  const { email } = req.body;

  const user = await dbService.findOne({
    model: UserModel,
    filter: {
      email,
      confirmEmail: false,
      provider: providers.system
    }
  });

  if (!user) {
    return next(new Error("User not found or email already confirmed", { cause: 404 }));
  }

  // Check if account is locked
  if (user.lockUntil && user.lockUntil > Date.now()) {
    return next(new Error("Account is locked. Please try again later", { cause: 403 }));
  }

  // Generate new OTP
  const otp = customAlphabet("0123456789", 6)();
  const hashOtp = await hash({ plainText: otp });
  const otpExpiredAt = new Date(Date.now() + 2 * 60 * 1000);

  // Update user with new OTP
  await dbService.updateOne({
    model: UserModel,
    filter: { email },
    data: {
      confirmEmailOtp: hashOtp,
      otpExpiredAt,
      fieldAttempts: 0,
      lockUntil: null
    }
  });

  // Send OTP via email
  try {
    await sendConfirmEmailOtp({ to: email, otp, fullName: user.fullName });
  } catch (error) {
    try {
      handleOtpDeliveryFailure({ error, email, otp, context: "resend-email-otp" });
    } catch (deliveryError) {
      return next(new Error(`Failed to send OTP email: ${deliveryError?.message || "SMTP error"}`, { cause: 502 }));
    }
  }

  return successResponse({
    res,
    statusCode: 200,
    message: "OTP resent to your email successfully"
  });
};

export const resendForgotPasswordOtp = async (req, res, next) => {
  const { email } = req.body;

  const user = await dbService.findOne({
    model: UserModel,
    filter: {
      email,
      provider: providers.system,
      confirmEmail: { $exists: true },
      freezedAt: null
    }
  });

  if (!user) {
    return next(new Error("User not found", { cause: 404 }));
  }

  // Check if account is locked
  if (user.lockUntil && user.lockUntil > Date.now()) {
    return next(new Error("Account is locked. Please try again later", { cause: 403 }));
  }

  // Generate new OTP
  const otp = customAlphabet("0123456789", 6)();
  const hashOtp = await hash({ plainText: otp });
  const otpExpiredAt = new Date(Date.now() + 2 * 60 * 1000);

  // Update user with new OTP
  await dbService.updateOne({
    model: UserModel,
    filter: { email },
    data: {
      forgetPasswordOtp: hashOtp,
      otpExpiredAt,
      fieldAttempts: 0,
      lockUntil: null
    }
  });

  // Send OTP via email
  try {
    await sendForgetPasswordOtp({ to: email, otp, fullName: user.fullName });
  } catch (error) {
    try {
      handleOtpDeliveryFailure({ error, email, otp, context: "resend-forget-password-otp" });
    } catch (deliveryError) {
      return next(new Error(`Failed to send OTP email: ${deliveryError?.message || "SMTP error"}`, { cause: 502 }));
    }
  }

  return successResponse({
    res,
    statusCode: 200,
    message: "OTP resent to your email successfully"
  });
};
