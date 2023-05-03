import { Request, Response, NextFunction } from "express";

const routeNotFound = (req: Request, res: Response, next: NextFunction) => {
  return res.status(404).json({ message: "Not Found" });
};

export default routeNotFound;
