import { UserModel } from "../../db/models/user.model.js";
import { cloudinaryConfig } from "../../utils/multer/cloudinary.js";
import { successResponse } from "../../utils/multer/successResponse.utils.js";
import { encrypt, decrypt } from "../../utils/Encryption/encription.utils.js";
import { deleteFile } from "../../utils/file/fileActions.js";

const cloudinary = cloudinaryConfig();

export const getProfile = async (req, res, next) => {
    const user = await UserModel.findById(req.user._id).select("-password -confirmEmailOtp -forgetPasswordOtp");
    
    // Decrypt phone if it exists
    if (user.phone) {
        user.phone = decrypt(user.phone);
    }
    
    return successResponse({
        res,
        statusCode: 200,
        message: "Profile retrieved successfully",
        data: user
    });
};

export const updateProfile = async (req, res, next) => {
    const { fullName, gender, phone } = req.body;
    const updateData = {};

    if (fullName) updateData.fullName = fullName;
    if (gender) updateData.gender = gender;
    if (phone) updateData.phone = encrypt(phone);

    // Handle profile image upload
    if (req.file) {
        try {
            const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                folder: `gait-recognition/users/${req.user._id}/profile`,
                public_id: `profile_${Date.now()}`
            });
            updateData.profileCloudImage = {
                public_id: uploadResult.public_id,
                secure_url: uploadResult.secure_url
            };
            updateData.profileImage = uploadResult.secure_url;
            
            // Remove temporary file from local storage
            deleteFile(req.file.path);
        } catch (error) {
            return next(new Error("Failed to upload profile image", { cause: 500 }));
        }
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
        req.user._id,
        updateData,
        { new: true, runValidators: true }
    ).select("-password -confirmEmailOtp -forgetPasswordOtp");

    // Decrypt phone if it exists
    if (updatedUser.phone) {
        updatedUser.phone = decrypt(updatedUser.phone);
    }

    return successResponse({
        res,
        statusCode: 200,
        message: "Profile updated successfully",
        data: updatedUser
    });
};

export const updateRole = async (req, res, next) => {
    const { userId } = req.params;
    const { role } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        { role },
        { new: true, runValidators: true }
    ).select("-password -confirmEmailOtp -forgetPasswordOtp");

    if (!updatedUser) {
        return next(new Error("User not found", { cause: 404 }));
    }

    return successResponse({
        res,
        statusCode: 200,
        message: "User role updated successfully",
        data: updatedUser
    });
};

// ─── Admin-only services ────────────────────────────────────────────

/**
 * GET /api/user/all  (Admin only)
 * Returns every user in the system with sensitive fields stripped.
 */
export const getAllUsers = async (req, res, next) => {
    const users = await UserModel.find()
        .select("-password -confirmEmailOtp -forgetPasswordOtp -coverCloudImages -profileCloudImage -coverImages")
        .sort({ createdAt: -1 })
        .lean();

    // Decrypt phone numbers for readability
    for (const u of users) {
        if (u.phone) {
            try { u.phone = decrypt(u.phone); } catch { u.phone = ""; }
        }
    }

    return successResponse({
        res,
        statusCode: 200,
        message: "Users retrieved successfully",
        data: users
    });
};

/**
 * PATCH /api/user/:userId/freeze  (Admin only)
 * Toggles the freeze status of a user account.
 * Frozen users are blocked from logging in.
 */
export const toggleFreezeUser = async (req, res, next) => {
    const { userId } = req.params;

    const targetUser = await UserModel.findById(userId);
    if (!targetUser) {
        return next(new Error("User not found", { cause: 404 }));
    }

    // Prevent admin from freezing themselves
    if (targetUser._id.toString() === req.user._id.toString()) {
        return next(new Error("You cannot freeze your own account", { cause: 400 }));
    }

    const isFrozen = !!targetUser.freezedAt;

    const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        isFrozen
            ? { freezedAt: null, freezedBy: null, restoredAt: new Date(), restoredBy: req.user._id }
            : { freezedAt: new Date(), freezedBy: req.user._id, restoredAt: null, restoredBy: null },
        { new: true, runValidators: true }
    ).select("-password -confirmEmailOtp -forgetPasswordOtp");

    return successResponse({
        res,
        statusCode: 200,
        message: isFrozen ? "User account unfrozen successfully" : "User account frozen successfully",
        data: updatedUser
    });
};

/**
 * DELETE /api/user/:userId  (Admin only)
 * Permanently deletes a user account.
 */
export const deleteUser = async (req, res, next) => {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user._id.toString()) {
        return next(new Error("You cannot delete your own account", { cause: 400 }));
    }

    const deletedUser = await UserModel.findByIdAndDelete(userId);
    if (!deletedUser) {
        return next(new Error("User not found", { cause: 404 }));
    }

    return successResponse({
        res,
        statusCode: 200,
        message: "User deleted successfully",
        data: { _id: deletedUser._id, email: deletedUser.email }
    });
};
