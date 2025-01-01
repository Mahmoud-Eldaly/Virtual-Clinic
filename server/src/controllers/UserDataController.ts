import { Request, Response } from "express";
import { addDoctor } from "./DoctorController";
import { addPatient } from "./PatientController";
import Admin from "../models/Admin";
import Doctor from "../models/Doctor";
import Patient from "../models/Patient";
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
import { passwordStrength } from "check-password-strength";
import { Model } from "mongoose";
const crypto = require("crypto");
const nodemailer = require("nodemailer");

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
    console.log("login body", req.body);
    const user: { [key: string]: any } = { userName: req.body.userName };
    var hash = bcrypt.hashSync(req.body.password, 8);
    // console.log(hash);
    const admin = await Admin.findOne({
      userName: user.userName,
    });
    const doctor = await Doctor.findOne({
      userName: user.userName,
    });
    const patient = await Patient.findOne(
      {
        userName: user.userName,
      },
      { medicalHistoryItems: 0 }
    );
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
      //TODO:: i see that storing email here is not good idea, if updated, cookies won't notice
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
  console.log("logging out!!", req.cookies);
  res.clearCookie("accessToken");
  res.clearCookie("jwt");
  res.send({ message: "Successfully logged out" });
};

export const changeMyPassword: (
  req: Request,
  res: Response
) => Promise<any> = async (req: Request, res: Response) => {
  try {
    const hashed = bcrypt.hashSync(req.body.newPassword, 8);
    let User: Model<any> | null = null;

    if (req.user?.type === "admin") User = Admin;
    if (req.user?.type === "doctor") User = Doctor;
    if (req.user?.type === "patient") User = Patient;

    const userOldPass = await User?.findById(req.user?.id, "password");
    if (!bcrypt.compareSync(req.body.oldPassword, userOldPass.password))
      return res.status(401).send("Old password is incorrect");
    if (passwordStrength(req.body.newPassword).id < 2)
      return res.status(400).json({ message: "password provided is too weak" });
    const updatedUser = await User?.findByIdAndUpdate(req.user?.id, {
      password: hashed,
    });
    if (updatedUser)
      return res.status(200).json({ message: "updated password successfully" });
    else return res.status(500).json({ message: "an error occured" });
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const forgetPassword: (
  req: Request,
  res: Response
) => Promise<any> = async (req: Request, res: Response) => {
  //admin can not reset forgotten password, no emails are attached to admins
  try {
    const token = crypto.randomBytes(32).toString("hex");
    const doctor = await Doctor.findOne(
      {
        userName: req.body.userName,
      },
      { email: 1 }
    );
    const patient = await Patient.findOne(
      {
        userName: req.body.userName,
      },
      { email: 1 }
    );
    let email = "";

    if (doctor) {
      email = doctor.email;
      await Doctor.findByIdAndUpdate(doctor.id, {
        resetPasswordToken: token,
        resetPasswordExpires: Date.now() + 1000 * 60 * 15,
      });
    } else if (patient) {
      email = patient.email;
      await Patient.findByIdAndUpdate(patient.id, {
        resetPasswordToken: token,
        resetPasswordExpires: Date.now() + 1000 * 60 * 15,
      });
    }
    //send the email using nodemailer HERE!!!
    nodemailer.createTestAccount(
      (
        err: { message: string },
        account: {
          smtp: { host: any; port: any; secure: any };
          user: any;
          pass: any;
        }
      ) => {
        if (err) {
          console.error("Failed to create a testing account. " + err.message);
          return process.exit(1);
        }

        console.log("Credentials obtained, sending message...", account);

        // Create a SMTP transporter object
        let transporter = nodemailer.createTransport({
          host: account.smtp.host,
          port: account.smtp.port,
          secure: account.smtp.secure,
          auth: {
            user: account.user,
            pass: account.pass,
          },
        });

        // Message object
        let message = {
          from: "Vircual C. <no-reply@virtualc.com>",
          to: `${req.body.userName} <${email}>`,
          subject: "Reset Your Password",
          //TODO:: the link sent should redirect to the frontend
          text: `Please follow the following link to reset your password: http://localhost:5000/reset-password?userName=${req.body.userName}&token=${token} \n
        This link expires in 15 minutes`,
        };

        transporter.sendMail(
          message,
          (err: { message: string }, info: { messageId: any }) => {
            if (err) {
              console.log("Error occurred. " + err.message);
              return process.exit(1);
            }

            console.log("Message sent: %s", info.messageId);
            // Preview only available when sending through an Ethereal account
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
            return res.status(200).json({
              message: "verification email was sent successfully",
            });
          }
        );
      }
    );
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const verifyResetPassword: (
  req: Request,
  res: Response
) => Promise<any> = async (req: Request, res: Response) => {
  //TODO:: How can i trust the user recieving the new password while he is not even logged in??
  try {
    const { userName, token } = req.query;
    const hashed = bcrypt.hashSync(req.body.newPassword, 8);
    const doctor = await Doctor.findOne(
      {
        userName: userName,
      },
      { resetPasswordToken: 1, resetPasswordExpires: 1 }
    );

    if (doctor) {
      if (
        doctor.resetPasswordToken === token &&
        doctor.resetPasswordExpires?.getTime()! > Date.now()
      ) {
        if (passwordStrength(req.body.newPassword).id < 2)
          return res
            .status(400)
            .json({ message: "password provided is too weak" });
        await Doctor.findByIdAndUpdate(doctor.id, {
          resetPasswordToken: "",
          resetPasswordExpires: new Date(0),
          password: hashed,
        });
        // return res.status(200).json({ message: "token verified successfully" });
      } else
        return res.status(401).json({ message: "token verification failed" });
    } else {
      const patient = await Patient.findOne(
        {
          userName: userName,
        },
        {
          resetPasswordToken: 1,
          resetPasswordExpires: 1,
        }
      );
      if (
        patient &&
        patient.resetPasswordToken === token &&
        patient.resetPasswordExpires?.getTime()! > Date.now()
      ) {
        if (passwordStrength(req.body.newPassword).id < 2)
          return res
            .status(400)
            .json({ message: "password provided is too weak" });
        await Patient.findByIdAndUpdate(patient.id, {
          resetPasswordToken: "",
          resetPasswordExpires: new Date(0),
          password: hashed,
        });
        // return res.status(200).json({ message: "token verified successfully" });
      } else
        return res.status(401).json({ message: "token verification failed" });
    }
    return res
      .status(200)
      .json({ message: "token verified successfully and password updated!" });
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};
