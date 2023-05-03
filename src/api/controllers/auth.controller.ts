import { NextFunction, Request, Response } from "express";
import { validator } from "../../utils/validator";
import RedisServer from "../../loaders/RedisServer";
import AuthService from "../services/auth.service";
import User from "../models/user";
import Success from "../../responses/successful/Success";

export const signUp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validator(req);
  const socket: SocketIO.Server = req.app.get("socket");
  const redis: RedisServer = req.app.get("redis");
  const authService = new AuthService(socket, redis, User);

  try {
    const { accessToken, refreshToken, user } = await authService.registerUser(
      req.body
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 1 * 60 * 1000,
    });
    const successResponse = new Success(user).toJson;
    return res.status(200).json(successResponse);
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  validator(req);
  const socket: SocketIO.Server = req.app.get("socket");
  const redis: RedisServer = req.app.get("redis");
  const authService = new AuthService(socket, redis, User);
  try {
    const { accessToken, refreshToken, user } = await authService.login(
      req.body
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 1 * 60 * 1000,
    });
    const successResponse = new Success(user).toJson;
    return res.status(200).json(successResponse);
  } catch (err) {
    next(err);
  }
};
