import { NextFunction, Request, Response } from "express";
import { platforms, verifyTokenSignature } from "../../utils/jsonwebtoken";
import Unauthorized from "../../responses/clientErrors/Unauthorized";
import {
  ErrorCode,
  ErrorDescription,
  Platform,
  VerifyTokenStatus,
} from "../../common/constants";
import { IDecodedToken } from "../../common/interfaces/jsonwebtoken";
import { decode } from "jsonwebtoken";
import config from "../../common/config";
import User from "../models/user";
import NotFound from "../../responses/clientErrors/NotFound";
import * as jwt from "jsonwebtoken";

const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const cookies = req.cookies;
  if (!cookies.accesstoken || !cookies.refreshtoken) {
    next(
      new Unauthorized(
        "UNAUTHORIZED",
        ErrorDescription.UNAUTHORIZED,
        "Access token is required"
      )
    );
  }
  const refreshtoken: string = req.cookies?.refreshtoken;

  const accesstoken: string = req.cookies?.accesstoken;

  const decodedToken: IDecodedToken = decode(accesstoken) as IDecodedToken;

  if (decodedToken === null) {
    return next(
      new Unauthorized(
        "INVALID_TOKEN_FORMAT",
        ErrorDescription.UNAUTHORIZED,
        "invalid token"
      )
    );
  }

  const { aud: tokenAudience, sub: tokenSubscriber } = decodedToken;
  const assignedPlatform: Platform | undefined = platforms(tokenAudience);

  if (assignedPlatform === undefined) {
    return next(
      new Unauthorized(
        "UNAUTHORIZED",
        ErrorDescription.UNAUTHORIZED,
        "audience verification failed"
      )
    );
  }
  const publicKey = config.platformPublicKey as string;
  const verifyOutcome: VerifyTokenStatus = verifyTokenSignature(
    accesstoken,
    publicKey
  );

  switch (verifyOutcome) {
    case VerifyTokenStatus.SIGNATURE_VERIFICATION_FAILURE:
      return next(
        new Unauthorized(
          VerifyTokenStatus.SIGNATURE_VERIFICATION_FAILURE,
          ErrorDescription.UNAUTHORIZED,
          "signature verification failed"
        )
      );

    case VerifyTokenStatus.TOKEN_EXPIRED:
      console.log("accesstoken expired");
      const newAccessToken = await regenerateAccessToken(refreshtoken, next);
      res.cookie("accesstoken", newAccessToken, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 1 * 60 * 1000,
      });
      console.log("accesstoken Generated");
      break;

    case VerifyTokenStatus.SUCCESS:
      break;

    default:
      return next(
        new Unauthorized(
          ErrorCode.SERVER_EXCEPTION,
          ErrorDescription.UNAUTHORIZED,
          "access token expired"
        )
      );
  }
  const id = decodedToken.id;
  const user = await User.findById(id);
  if (!user) {
    next(
      new NotFound("NOT_FOUND", ErrorDescription.NOT_FOUND, "User Not Found")
    );
  }
  (req as any).user = user;
  next();
};

const regenerateAccessToken = async (
  refreshtoken: string,
  next: NextFunction
) => {
  console.log("generating new accesstoken from refresh Token");
  const decodedToken: IDecodedToken = decode(refreshtoken) as IDecodedToken;

  if (decodedToken === null) {
    return next(
      new Unauthorized(
        "INVALID_TOKEN_FORMAT",
        ErrorDescription.UNAUTHORIZED,
        "invalid token"
      )
    );
  }

  const { aud: tokenAudience, sub: tokenSubscriber } = decodedToken;
  const assignedPlatform: Platform | undefined = platforms(tokenAudience);

  if (assignedPlatform === undefined) {
    return next(
      new Unauthorized(
        "UNAUTHORIZED",
        ErrorDescription.UNAUTHORIZED,
        "audience verification failed"
      )
    );
  }
  const secretKey = config.refreshTokenSecretKey as string;
  const verifyOutcome: VerifyTokenStatus = verifyTokenSignature(
    refreshtoken,
    secretKey
  );
  switch (verifyOutcome) {
    case VerifyTokenStatus.SIGNATURE_VERIFICATION_FAILURE:
      return next(
        new Unauthorized(
          VerifyTokenStatus.SIGNATURE_VERIFICATION_FAILURE,
          ErrorDescription.UNAUTHORIZED,
          "refresh token signature verification failed"
        )
      );

    case VerifyTokenStatus.TOKEN_EXPIRED:
      return next(
        new Unauthorized(
          VerifyTokenStatus.TOKEN_EXPIRED,
          ErrorDescription.UNAUTHORIZED,
          "refresh token expired"
        )
      );

    case VerifyTokenStatus.SUCCESS:
      break;
    default:
      return next(
        new Unauthorized(
          ErrorCode.SERVER_EXCEPTION,
          ErrorDescription.UNAUTHORIZED,
          "refresh token expired"
        )
      );
  }
  const id = decodedToken.id;
  const user = await User.findById(id);
  if (!user) {
    next(
      new NotFound("NOT_FOUND", ErrorDescription.NOT_FOUND, "User Not Found")
    );
  }
  return jwt.sign(
    {
      id: id,
    },
    config.platformPublicKey as string,
    {
      algorithm: "HS256",
      subject: "AUTH_TOKEN",
      audience: config.platformAudience as string,
      expiresIn: "10m",
    }
  );
};

export default isAuthenticated;
