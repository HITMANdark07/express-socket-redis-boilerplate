import * as express from "express";
import * as bodyParser from "body-parser";
import config from "../common/config";
import cors = require("cors");
import errorHandler from "../responses/ErrorHandler";
import routes from "../api/routes";
import mongoose from "mongoose";
import routeNotFound from "../api/middleware/RouteNotFound";
import * as cookieParser from "cookie-parser";
import { Server, createServer } from "http";
import RedisServer from "./RedisServer";

class ExpressServer {
  public static readonly PORT: number = 8080;

  private _app: express.Application;
  private _server: Server;
  private _port: number;

  public constructor() {
    this.listen();
  }

  private listen(): void {
    // initialize express instances
    this._app = express();

    // only accept content type application/json
    this._app.use(bodyParser.urlencoded({ extended: false }));
    this._app.use(bodyParser.json({ type: "*/*" }));
    this._app.use(cookieParser());
    this._app.use(cors());
    this._app.use("/api", routes);
    this._app.use("*", routeNotFound);
    this._app.use(errorHandler);

    // start nodejs server
    this._port = config.serverPort || ExpressServer.PORT;
    this._server = createServer(this._app);
    this._server.listen(this._port, () => {
      console.log("Running Express Server on port %s", this._port);
    });
  }

  public close(): void {
    this._server.close((err) => {
      if (err) throw Error();

      console.info(new Date(), "[ExpressServer]: Stopped");
    });
  }

  public async connectDB(dbURL: string) {
    try {
      await mongoose.connect(dbURL);
      console.log("Database Connected!! ");
    } catch (err) {
      console.log(err);
    }
  }

  public initSocket(socket: SocketIO.Server): void {
    this._app.set("socket", socket);
  }

  public initRedis(redis: RedisServer): void {
    this._app.set("redis", redis);
  }

  get server(): Server {
    return this._server;
  }
}

export default ExpressServer;
