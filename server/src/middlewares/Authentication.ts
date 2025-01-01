const jwt = require("jsonwebtoken");
const { login } = require("../controllers/UserDataController");
import { Request, Response, NextFunction } from "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: { [key: string]: any };
  }
}

const authenticateToken: (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any> = async (req: Request, res: Response, next: NextFunction) => {
  try {
   // console.log("try to auth ", req.cookies, res.headersSent);
    if (req.cookies?.jwt && req.cookies?.accessToken) {
      const accessToken = req.cookies.accessToken;
      const refreshToken = req.cookies.jwt;
      let validAccess = false,
        validRefresh = false;
      let data = {};
      jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET,
        (err: Error, decoded: { [key: string]: any }) => {
          if (err) {
            // Wrong or expired access token
            console.log(err.message);
            return res.status(401).json({ message: err.message });
          } else {
            validAccess = true;
            data = decoded;
           // console.log("decoded:", decoded);
          }
        }
      );
      jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err: Error, decoded: { [key: string]: any }) => {
          if (err) {
            // Wrong or expired refresh token
            return res
              .status(401)
              .json({ message: "Unauthorized,expired refresh" });
          } else {
            validRefresh = true;
          }
        }
      );

      if (validAccess && validRefresh) {
        req.user = data;
        const now = Math.floor(new Date().getTime() / 1000);
        const newAccessToken = jwt.sign(
          { ...data, exp: now + 60 * 120 },
          process.env.ACCESS_TOKEN_SECRET
        );

        res.cookie("accessToken", `${newAccessToken}`);

        return next();
      } else {
        return res
          .status(401)
          .json({ message: "Unauthorized, some cookies are expired" });
      }
    } else {
      return res
        .status(401)
        .json({ message: "Unauthorized, some cookies are missing" });
    }
  } catch (err) {
    if (!res.headersSent)
      return res.status(401).json({ message: "Unauthorized, Can Not Verify" });
  }
};
export default authenticateToken;
