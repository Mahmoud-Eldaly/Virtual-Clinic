import { Request, Response } from "express";
import { DuplicateUsername } from "../utils/DublicateUserNameChecker";
import Admin from "../models/Admin";
var bcrypt = require("bcryptjs");

export const addAdmin: (req: Request, res: Response) => Promise<any> = async (
  req: Request,
  res: Response
) => {
  try {
    console.log(req.user);
    if (req.user?.type === "admin") {
      const noDuplicateUsername = await DuplicateUsername(req.body.userName);
      if (noDuplicateUsername) {
        var hash = bcrypt.hashSync(req.body.password, 8);
        const newAdmin = new Admin({ ...req.body, password: hash });
        const savedAdmin = await newAdmin.save();
        console.log("added New Admin", savedAdmin);
        return res.send(savedAdmin);
      } else {
        return res
          .status(500)
          .json({ message: "This username already in use!" });
      }
    } else {
      return res.status(500).json({ message: "Only Admins Are Authorized to be here!!" });
    }
  } catch (err) {
    if (err instanceof Error) {
      return res.status(500).json({ message: err.message });
    } else {
      return res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const removeAdmin: (
  req: Request,
  res: Response
) => Promise<void> = async (req, res) => {
  try {
    console.log("try to remove", req.params);
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) {
      res.status(404).send("User not found");
      return;
    }
    res.send(admin);
  } catch (err) {
    console.log(err);
  }
};
