import express, { Request, Response, NextFunction } from "express";
import { login, logout, signup } from "../../controllers/UserDataController";

const UserDataRouter = express.Router();

UserDataRouter.post("/signup", (req, res) => signup(req, res));
UserDataRouter.post("/login", (req, res) => login(req, res));
UserDataRouter.get("/logout", (req, res) => logout(req, res));

export default UserDataRouter;
