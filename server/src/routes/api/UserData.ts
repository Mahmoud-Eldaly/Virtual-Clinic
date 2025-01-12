import express, { Request, Response, NextFunction } from "express";
import {
  changeMyPassword,
  forgetPassword,
  login,
  logout,
  signup,
  verifyResetPassword,
} from "../../controllers/UserDataController";
import authenticateToken from "../../middlewares/Authentication";

const UserDataRouter = express.Router();
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

UserDataRouter.post(
  "/signup",
  upload.fields([
    { name: "nationalID", maxCount: 2 },
    { name: "medicalDegree", maxCount: 1 },
    { name: "medicalLicence", maxCount: 1 },
  ]),
  (req, res) => signup(req, res)
);
UserDataRouter.post("/login", (req, res) => login(req, res));
UserDataRouter.get("/logout", (req, res) => logout(req, res));
UserDataRouter.put("/change-password", authenticateToken, (req, res) =>
  changeMyPassword(req, res)
);
UserDataRouter.put("/reset-password", (req, res) =>
  verifyResetPassword(req, res)
);

UserDataRouter.post("/forget-password", (req, res) => forgetPassword(req, res));

export default UserDataRouter;
