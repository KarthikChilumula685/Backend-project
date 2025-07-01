import path from "path";
import fs from "fs"; // Just in case you want to check file existence
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body;

    if ([fullname, email, username, password].some(field => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const userExist = await User.findOne({
        $or: [{ email }, { username }]
    });
    if (userExist) {
        throw new ApiError(409, "User already exists");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const absoluteAvatarPath = path.resolve(avatarLocalPath);
    const absoluteCoverPath = coverImageLocalPath ? path.resolve(coverImageLocalPath) : null;

    // ✅ Ensure file exists before upload
    if (!fs.existsSync(absoluteAvatarPath)) {
        console.error("File not found:", absoluteAvatarPath);
        throw new ApiError(500, "Avatar file not found on server");
    }

    const avatar = await uploadOnCloudinary(absoluteAvatarPath);
    if (!avatar) {
        throw new ApiError(500, "Avatar upload failed");
    }

    let coverImg = "";
    if (absoluteCoverPath && fs.existsSync(absoluteCoverPath)) {
        const coverUpload = await uploadOnCloudinary(absoluteCoverPath);
        if (!coverUpload) {
            throw new ApiError(500, "Cover image upload failed");
        }
        coverImg = coverUpload.url;
    }

    const user = await User.create({
        fullname,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImg
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registration");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
});

export { registerUser };
