import * as redis from "redis";
import config from "../common/config";

class RedisServer {
  private _redis: redis.RedisClient;
  private _redisPort: number = config.redisPort;

  public initialize(): redis.RedisClient {
    if (this._redis) {
      console.info(new Date(), "[Redis]: Already Started");
    }

    if (this._redis === undefined) {
      const redisOptions: redis.ClientOpts = {
        host: config.redisHost,
        port: config.redisPort,
      };
      this._redis = redis.createClient(redisOptions);
      console.log("Running Redis Server on port %s", this._redisPort);
    }

    return this._redis;
  }

  public getValueWithKey(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this._redis.get(key, (err, value) => {
        if (err) return reject(err);
        if (value) return resolve(value.toString());

        return resolve(null);
      });
    });
  }

  public close() {
    this._redis.quit();
    console.info(new Date(), "[RedisServer]: Stoppped");
  }

  get instance(): redis.RedisClient {
    return this._redis;
  }
}

export default RedisServer;
