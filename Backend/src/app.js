import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//this is used for cross origon policy
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// this is used to accept json file
app.use(express.json({ limit: "16kb" }));

//this is used to accept URL data.
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

//this is used to store file/folder in server
app.use(express.static("public"));

//this is used perform CRUD operation in cookies
//access them.....
app.use(cookieParser());

// import routes
import userRouter from "./routes/user.routes.js";

//routes decleration
app.use("/api/v1/users", userRouter);
export { app };
