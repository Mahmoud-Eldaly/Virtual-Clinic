import Patient, { patientSchema } from "../models/Patient";
import { Request, Response } from "express";
import { DuplicateUsername } from "../utils/DublicateUserNameChecker";
var bcrypt = require("bcryptjs");
//Here Goes Endpoints related to the DB Model

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
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
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

export const addMedicalHistoryItems: (
  req: Request,
  res: Response
) => Promise<any> = async (req, res) => {
  try {
    const files = req.files as {
      medicalHistoryItems: Express.Multer.File[];
    };
    console.log("Med history items", files.medicalHistoryItems);
    const rejectedFiles = files.medicalHistoryItems.filter(
      (file) =>
        !file.mimetype.toLocaleLowerCase().endsWith("/jpeg") &&
        !file.mimetype.toLocaleLowerCase().endsWith("/jpg") &&
        !file.mimetype.toLocaleLowerCase().endsWith("/png") &&
        !file.mimetype.toLocaleLowerCase().endsWith("/pdf")
    );
    if (rejectedFiles.length > 0)
      return res.json({
        message: "some uploaded files are not in correct format",
      });
    const patient = await Patient.findByIdAndUpdate(
      req.user?.id,
      {
        $push: {
          medicalHistoryItems: {
            $each: [...files.medicalHistoryItems],
          },
        },
      },
      { new: true }
    );
    return res.status(200).json(patient);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const viewMyMedicalHistoryItems: (
  req: Request,
  res: Response
) => Promise<any> = async (req, res) => {
  try {
    const medicalHistoryItems = await Patient.findById(req.user?.id, {
      medicalHistoryItems: 1,
    });
    res.status(200).json(medicalHistoryItems);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const removeMyMedicalHistoryItem: (
  req: Request,
  res: Response
) => Promise<any> = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.user?.id, {
      $pull: { medicalHistoryItems: { _id: req.body._id } },
    });
    // const patient = await Patient.findById(req.user?.id);
    // const item = patient?.medicalHistoryItems.filter(
    //   (i) => i._id === req.body._id
    // );
    // const ids = patient?.medicalHistoryItems.map((i) => i._id);
    // console.log(req.body._id);
    return res
      .status(200)
      .json({ message: `item deleted with id ${req.body._id}` });
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};
