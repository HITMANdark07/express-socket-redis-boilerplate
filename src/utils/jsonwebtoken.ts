import config from "../common/config";

import { verify, TokenExpiredError } from "jsonwebtoken";
import { VerifyTokenStatus, Platform } from "../common/constants";

export const verifyTokenSignature = (
  accessToken: string,
  publicKey: string
): VerifyTokenStatus => {
  if (accessToken === undefined || accessToken === null) {
    return VerifyTokenStatus.ACCESS_TOKEN_NOTFOUND;
  }

  try {
    verify(accessToken, publicKey, { algorithms: ["HS256"] });
    return VerifyTokenStatus.SUCCESS;
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return VerifyTokenStatus.TOKEN_EXPIRED;
    }

    return VerifyTokenStatus.SIGNATURE_VERIFICATION_FAILURE;
  }
};

export const platforms = (
  audience: string | undefined
): Platform | undefined => {
  const { platformAudience } = config;

  switch (audience) {
    case platformAudience:
      return Platform.MAIN_APPLICATION;
    default:
      return undefined;
  }
};
