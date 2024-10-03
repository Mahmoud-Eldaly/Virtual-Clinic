import Patient, { patientSchema } from "../models/Patient";
import { Request, Response } from "express";
import { DuplicateUsername } from "../utils/DublicateUserNameChecker";
var bcrypt = require("bcryptjs");

export const addPatient: (
  req: Request,
  res: Response
) => Promise<void> = async (req: Request, res: Response) => {
  try {
    const noDuplicateUsername = await DuplicateUsername(req.body.userName);
    if (noDuplicateUsername) {
      var hash = bcrypt.hashSync(req.body.password, 8);
      const newPatient = new Patient({ ...req.body, password: hash });
      const savedPatient = await newPatient.save();
      console.log("added New Patient");
      res.send(savedPatient);
    } else {
      res.status(500).json({ message: "This username already in use!" });
    }
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const removePatient: (
  req: Request,
  res: Response
) => Promise<void> = async (req, res) => {
  try {
    console.log("try to remove", req.params);
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) {
      res.status(404).send("User not found");
      return;
    }

    res.send(patient);
  } catch (err) {
    console.log(err);
  }
};

export const viewFamilyMembers: (
  req: Request,
  res: Response
) => Promise<void> = async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (patient !== null) res.json(patient.familyMembers);
  else res.status(500).send("User Not Found");
};
