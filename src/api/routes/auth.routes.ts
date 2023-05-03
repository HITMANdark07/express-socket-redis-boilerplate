import { Router, Request, Response } from "express";
import { login, signUp } from "../controllers/auth.controller";

const router = Router();

router.post("/signup", signUp);
router.post("/login", login);

export default router;
