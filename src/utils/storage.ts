import config from "../common/config";

import { resolve } from "path";
import { readFileSync } from "fs";
import { Platform } from "../common/constants";

export const getPlatformPublicKey = (platform: Platform): string => {
  const publicKeyObj = {
    [Platform.MAIN_APPLICATION]: config.platformPublicKey as string,
  };

  const publicKeyPath = resolve(publicKeyObj[platform]);
  const publicKey: string = readFileSync(publicKeyPath, "utf-8");
  return publicKey;
};
