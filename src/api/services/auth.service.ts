import * as jwt from "jsonwebtoken";
import User, { UserDocument } from "../models/user";

import RedisServer from "../../loaders/RedisServer";
import Unauthorized from "../../responses/clientErrors/Unauthorized";
import { ErrorDescription, Platform } from "../../common/constants";
import NotFound from "../../responses/clientErrors/NotFound";
import config from "../../common/config";

class AuthService {
  constructor(
    private socket: SocketIO.Server,
    private redisServer: RedisServer,
    private userModal: UserDocument
  ) {}

  public registerUser = async (body: any) => {
    return this.createUser(body);
  };
  public login = async (body: any) => {
    return this.authenticate(body);
  };

  private createUser = async (body: any) => {
    let user;
    try {
      user = await this.userModal.create({
        userName: body.userName,
        password: body.password,
      });
    } catch (err: any) {
      if (err?.code == 11000) {
        throw new NotFound(
          "DUPLICATE",
          ErrorDescription.INVALID_INPUT,
          "User Already Exist"
        );
      }
    }
    if (!user) {
      throw new NotFound(
        "NOT_FOUND",
        ErrorDescription.UNEXPECTED_ERROR,
        "User Not Registered"
      );
    }
    const { accessToken, refreshToken } = this.generateTokens(user.id);
    return {
      accessToken,
      refreshToken,
      user: {
        userName: user.userName,
        roles: user.roles,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    };
  };
  private authenticate = async (
    body: any
  ): Promise<{
    refreshToken: string;
    accessToken: string;
    user: {
      userName: string;
      roles: string[];
      firstName?: string;
      lastName?: string;
      email?: string;
    };
  }> => {
    const user = await this.userModal.findOne({
      userName: body.userName,
    });
    if (!user) {
      throw new NotFound(
        "NOT_FOUND",
        ErrorDescription.NOT_FOUND,
        "User Not Found"
      );
    }
    if (!(user as any).authenticate(body.password)) {
      throw new Unauthorized(
        "UNAUTHORIZED",
        ErrorDescription.UNAUTHENTICATED,
        "Username and Password does not match"
      );
    }
    const { accessToken, refreshToken } = this.generateTokens(user.id);
    return {
      accessToken,
      refreshToken,
      user: {
        userName: user.userName,
        roles: user.roles,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    };
  };
  private generateTokens = (
    id: string
  ): {
    refreshToken: string;
    accessToken: string;
  } => {
    const accessToken = this.generateAccessToken(id);
    const refreshToken = this.generateRefreshToken(id);
    return {
      accessToken,
      refreshToken,
    };
  };
  private generateAccessToken = (id: string): string => {
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
  private generateRefreshToken = (id: string): string => {
    return jwt.sign(
      {
        id: id,
      },
      config.refreshTokenSecretKey as string,
      {
        algorithm: "HS256",
        subject: "AUTH_TOKEN",
        audience: config.platformAudience as string,
        expiresIn: "7d",
      }
    );
  };
}

export default AuthService;
