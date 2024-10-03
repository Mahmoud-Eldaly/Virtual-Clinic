import { Request, Response } from "express";
import { addDoctor } from "./DoctorController";
import { addPatient } from "./PatientController";
import Admin from "../models/Admin";
import Doctor from "../models/Doctor";
import Patient from "../models/Patient";
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
export const signup: (req: Request, res: Response) => Promise<void> = async (
  req,
  res
) => {
  try {
    const type: string = req.body.type ?? "patient";
    if (type.toLowerCase() === "doctor") addDoctor(req, res);
    else addPatient(req, res);
  } catch (err) {
    console.log(err);
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const login: (req: Request, res: Response) => Promise<any> = async (
  req: Request,
  res: Response
) => {
  try {
    console.log("login body",req.body)
    const user: { [key: string]: any } = { userName: req.body.userName };
    var hash = bcrypt.hashSync(req.body.password, 8);
    // console.log(hash);
    const admin = await Admin.findOne({
      userName: user.userName,
    });
    const doctor = await Doctor.findOne({
      userName: user.userName,
    });
    const patient = await Patient.findOne({
      userName: user.userName,
    });
    if (!admin && !doctor && !patient) {
      res.status(401).send("Wrong Username");
    } else {
      if (admin) {
        if (!bcrypt.compareSync(req.body.password, admin.password))
          return res.status(401).send("Wrong Password");
        user.type = "admin";
        user.userName = admin.userName;
        user.id = admin._id;
      }
      if (doctor) {
        if (!bcrypt.compareSync(req.body.password, doctor.password))
          return res.status(401).send("Wrong Password");
        user.type = "doctor";
        user.id = doctor._id;
        user.userName = doctor.userName;
        user.email = doctor.email;
      }
      if (patient) {
        if (!bcrypt.compareSync(req.body.password, patient.password))
          return res.status(401).send("Wrong Password");
        user.type = "patient";
        user.id = patient._id;
        user.userName = patient.userName;
        user.email = patient.email;
      }

      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "120m",
      });
      const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      //console.log(refreshToken);

      res.cookie("jwt", `${refreshToken}`);
      res.cookie("accessToken", `${accessToken}`);

      //refreshTokens.push(refreshToken);

      // console.log(res.cookie);
      res.json({
        type: user.type,
        userName: user.userName,
      });
    }
  } catch (err) {
    console.log(err);
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const logout = async (req: Request, res: Response) => {

  console.log("logging out!!",req.cookies);
  res.clearCookie("accessToken");
  res.clearCookie("jwt");
  res.send({message:"Successfully logged out"})
};
