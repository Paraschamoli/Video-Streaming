import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

router.report("/register").post(registerUser);

export default router;
