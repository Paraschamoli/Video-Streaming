import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

 let coverImageLocalpath ;
 if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
coverImageLocalpath=req.files.coverImage[0].path
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
export { registerUser };
