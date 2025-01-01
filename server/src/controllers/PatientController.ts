import Patient, { patientSchema } from "../models/Patient";
import { Request, Response } from "express";
import { DuplicateUsername } from "../utils/DublicateUserNameChecker";
import { passwordStrength } from "check-password-strength";
import Appointment, { statusEnum } from "../models/Appointment";
import { calculateAge } from "../utils/CalcAge";
import mongoose from "mongoose";
import Package from "../models/Package";
var bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

interface PackageToken {
  packageId: string;
  subscribingMember?: string;
  paidFromWallet: number;
  paidPrice: number;
}
//Here Goes Endpoints related to the DB Model

export const addPatient: (req: Request, res: Response) => Promise<any> = async (
  req: Request,
  res: Response
) => {
  try {
    const noDuplicateUsername = await DuplicateUsername(req.body.userName);
    if (noDuplicateUsername) {
      if (passwordStrength(req.body.password).id < 2)
        return res
          .status(400)
          .json({ message: "password provided is too weak" });
      var hash = bcrypt.hashSync(req.body.password, 8);
      console.log("hashed::", hash);
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

export const addMyMedicalHistoryItems: (
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

export const addMedicalHistoryItemToPatient: (
  req: Request,
  res: Response
) => Promise<any> = async (req, res) => {
  try {
    console.log("before files", req.user?.id, req.params.id);
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
    const appointment = await Appointment.findOne({
      doctor: req.user?.id,
      patient: req.params.id,
      status: statusEnum.Done,
    });

    if (!appointment)
      return res.status(403).json({
        message:
          "You are not allowed to add medical record to this patient currently!",
      });
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          medicalHistoryItems: {
            $each: [...files.medicalHistoryItems],
          },
        },
      },
      { new: true }
    );
    return res.status(200).json(patient?.medicalHistoryItems);
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

export const viewMedicalHistoryItemsOfPatient: (
  req: Request,
  res: Response
) => Promise<any> = async (req, res) => {
  try {
    const app = await Appointment.findOne({
      doctor: req.user?.id,
      patient: req.params.id,
      status: "done",
    });
    if (app) {
      const medicalHistoryItems = await Patient.findById(req.params.id, {
        medicalHistoryItems: 1,
      });
      console.log("app:", app);
      console.log("items:", medicalHistoryItems);
      res.status(200).json(medicalHistoryItems);
    } else {
      res.status(403).json({
        message: "You are not allowed to view medical records of this patient",
      });
    }
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

export const viewMyWallet: (
  req: Request,
  res: Response
) => Promise<any> = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user?.id, "wallet");
    return res.status(200).json(patient);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const addFamilyMembers: (
  req: Request,
  res: Response
) => Promise<any> = async (req, res) => {
  try {
    let familyMembers = req.body.familyMembers ?? [];
    const emails: [{ email: string; relationToPatient: string }] =
      req.body.emails ?? [];
    const phoneNumbers: [{ phoneNumber: string; relationToPatient: string }] =
      req.body.phoneNumbers ?? [];
    if (familyMembers) {
      for (let mem of familyMembers) {
        if (!mem.nationalID)
          return res
            .status(401)
            .json({ message: "national ids of family members are required!!" });
      }
    } else {
      familyMembers = [];
    }
    const currentPatient = await Patient.findById(
      req.user?.id,
      "familyMembers"
    ).lean();

    let currentMembers = currentPatient?.familyMembers;
    console.log(currentMembers, Object.keys(currentMembers!));
    let i = 0;
    let currentIDs = new Set<string>();
    currentIDs.add(req.user?.id);
    while (i < Object.keys(currentMembers!).length) {
      console.log(i, "-> ", currentMembers![i]);
      if (currentMembers![i].memberId)
        currentIDs.add(currentMembers![i].memberId!.toString());
      i++;
    }
    console.log("checkEmails");
    for (let pEmail of emails) {
      const patient = await Patient.findOne({ email: pEmail.email }).lean();
      console.log(patient);
      if (!patient)
        return res.status(401).json({ message: "incorrect email was sent" });
      if (!currentIDs.has(patient!._id.toString())) {
        currentIDs.add(patient!._id.toString());
        familyMembers.push({
          name: patient?.name,
          userName: patient?.userName,
          age: calculateAge(patient?.birthDate.getTime()!),
          gender: patient?.gender,
          relationToPatient: pEmail.relationToPatient,
          memberId: patient?._id,
        });
      }
    }
    console.log("checkphones");

    for (let pPhoneNumber of phoneNumbers) {
      console.log(pPhoneNumber.phoneNumber);
      const patient = await Patient.findOne({
        mobileNumer: pPhoneNumber.phoneNumber,
      }).lean();
      console.log(patient);
      if (!patient)
        return res
          .status(401)
          .json({ message: "incorrect phone number was sent" });
      if (!currentIDs.has(patient!._id.toString())) {
        currentIDs.add(patient!._id.toString());
        familyMembers.push({
          name: patient?.name,
          userName: patient?.userName,
          age: calculateAge(patient?.birthDate.getTime()!),
          gender: patient?.gender,
          relationToPatient: pPhoneNumber.relationToPatient,
          memberId: patient?._id,
        });
      }
    }
    console.log("updating", familyMembers);

    const updatedFamilyMembers = await Patient.findByIdAndUpdate(
      req.user?.id,
      {
        $push: { familyMembers: { $each: familyMembers } },
      },
      { new: true, runValidators: true, fields: "familyMembers" }
    );
    console.log("returning");

    return res.status(200).json(updatedFamilyMembers);
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
) => Promise<any> = async (req, res) => {
  try {
    const familyMembers = await Patient.findById(req.user?.id, "familyMembers");
    return res.status(200).json(familyMembers);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const subscribeForPackage: (
  req: Request,
  res: Response
) => Promise<any> = async (req, res) => {
  try {
    //TODO::there must be token verfication here!!!
    console.log(req.body);
    const token = req.body.token;
    jwt.verify(
      token,
      process.env.SUBSCRIBE_PACKAGE_SECRET,
      async (err: Error, decoded: PackageToken | undefined) => {
        if (err) {
          // Wrong or expired access token
          console.log(err.message);
          return res.status(401).json({ message: err.message });
        } else {
          let data = decoded;
          console.log(decoded);
          const patient2 = await Patient.findById(req.user?.id);
          if (patient2?.wallet!< decoded?.paidFromWallet!) {
            console.log(
              "wallet has no enough Moneeeeeeeeeeeeeeeeeeeeeeeeeeeeey!!"
            );
            await Patient.updateOne(
              { _id: req.user?.id },
              {
                $inc: {
                  wallet: decoded?.paidPrice! - decoded!.paidFromWallet!,
                },
              }
            );

            return res.status(401).json({
              message:
                "Wallet Money is not enough to pay, it was changed since last payment, money paid on strip was returned to wallet!",
            });
          }
          await Patient.updateOne(
            { _id: req.user?.id },
            { $inc: { wallet: -1 * decoded!.paidFromWallet! } }
          )
            .then((result) => {
              console.log(result);
            })
            .catch((err) => {
              console.log(err.message);
              return res.status(401).json({ message: err.message });
            });
          const _package = await Package.findById(decoded?.packageId);
          const today = new Date();
          const nextYear = new Date(today);
          nextYear.setFullYear(today.getFullYear() + 1);
          console.log(req.body);
          if (!decoded?.subscribingMember) {
            const patient = await Patient.findByIdAndUpdate(
              req.user?.id,
              { subscribedPackage: _package, renewalDate: nextYear },
              { new: true, runValidators: true, fields: "subscribedPackage" }
            );
            return res.status(200).json(patient);
          } else {
            //update where the target member is family member
            const mem = await Patient.findOneAndUpdate(
              {
                _id: req.user?.id,
                "familyMembers._id": decoded?.subscribingMember,
              },
              {
                $set: {
                  "familyMembers.$.package": _package,
                  "familyMembers.$.packageRenewalDate": nextYear,
                },
              },
              { new: true, runValidators: true, fields: "familyMembers" }
            );
            console.log(mem);
            return res.status(200).json(mem);
          }
        }
      }
    );
  } catch (err) {
    if (err instanceof Error) {
      return res.status(500).json({ message: err.message });
    } else {
      return res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const getMyData: (req: Request, res: Response) => Promise<void> = async (
  req,
  res
) => {
  try {
    const patient = await Patient.findById(
      req.user?.id,
      "-password -medicalHistoryItems"
    );
    res.status(200).json(patient);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};
