import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
//
//

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating access and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //1. get user details from frontend
  //2. validation-not empty
  //3. check if user already exists : username ,email
  //4. check for images and avatar.
  //5. uoload them to cloudinary
  //6. check if avatar uploaded
  //7. create user object-create entry in db
  //8. remove password and refersh token field from response
  //9. check for user creation.
  //10. return res
  const { username, email, fullname, password } = req.body;
  //console.log("\n email", email);

  if (
    [username, email, fullname, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  // findone return the first encounter if exist

  const existedUser = await User.findOne(
    // this syntax is used for checking multiple
    {
      $or: [{ username }, { email }],
    }
  );
  if (existedUser) {
    throw new ApiError(409, "user with email or username already exists");
  }

  const avatarLocalpath = req.files?.avatar[0]?.path;
  // const coverImageLocalpath = req.files?.coverImage[0]?.path;

  let coverImageLocalpath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalpath = req.files.coverImage[0].path;
  }
  //console.log(avatarLocalpath);
  if (!avatarLocalpath) {
    throw new ApiError(400, "Avatar file is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalpath);
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalpath);

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    password,
    email,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registring");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

//
//
//
//

const loginUser = asyncHandler(async (req, res) => {
  //req.boby->data
  // username or email
  //find user
  //password check
  //access and refresh token
  //send cookies

  const { email, password, username } = req.body;

  if (!(username || email)) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user does not exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "incorrect password");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );
  const loggedInUser = await User.findById(user.__v).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true, // gets new updated value
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

//
//
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incommingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;
  if (!incommingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incommingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(400, error?.message || "invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "incorrect password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, rs) => {
  return res
    .status(200)
    .json(200, req.user, "current user fetched successfully");
});
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
};
