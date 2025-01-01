import Doctor from "../models/Doctor";
import { DuplicateUsername } from "../utils/DublicateUserNameChecker";
import { Request, Response } from "express";
import { getFilteredAppointments } from "./AppointmentController";
import Appointment from "../models/Appointment";
import { generateContract } from "../utils/generateContract";
import { passwordStrength } from "check-password-strength";
import Patient from "../models/Patient";
import { ObjectId } from "mongoose";
import Admin from "../models/Admin";
var bcrypt = require("bcryptjs");
const fs = require("fs");

//Here Goes Endpoints related to the DB Model

export const addDoctor: (req: Request, res: Response) => Promise<any> = async (
  req: Request,
  res: Response
) => {
  try {
    const files = req.files as {
      nationalID: Express.Multer.File[];
      medicalDegree: Express.Multer.File[];
      medicalLicence: Express.Multer.File[];
    };
    console.log("files", req.files);
    console.log("National ID", files.nationalID);
    console.log("Degree", files.medicalDegree);
    console.log("Licence", files.medicalLicence);
    const noDuplicateUsername = await DuplicateUsername(req.body.userName);
    if (noDuplicateUsername) {
      var hash = bcrypt.hashSync(req.body.password, 8);

      if (
        !req.files ||
        !files.nationalID ||
        !files.medicalDegree ||
        !files.medicalLicence
      ) {
        return res.status(400).json({ message: "All files must be uploaded" });
      }
      if (passwordStrength(req.body.password).id < 2)
        return res
          .status(400)
          .json({ message: "password provided is too weak" });
      const newDoctor = new Doctor({
        ...req.body,
        password: hash,
        nationalID: {
          data: files.nationalID![0].buffer, // File data as Buffer
          contentType: files.nationalID![0].mimetype, // File MIME type
        },
        medicalDegree: {
          data: files.medicalDegree![0].buffer, // File data as Buffer
          contentType: files.medicalDegree![0].mimetype, // File MIME type
        },
        medicalLicence: {
          data: files.medicalLicence![0].buffer, // File data as Buffer
          contentType: files.medicalLicence![0].mimetype, // File MIME type
        },
      });
      const savedDoctor = await newDoctor.save();
      console.log("Added Doctor");
      res.send(savedDoctor);
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

export const removeDoctor: (
  req: Request,
  res: Response
) => Promise<void> = async (req, res) => {
  try {
    console.log("try to remove", req.params);
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) {
      res.status(404).send("User not found");
      return;
    }
    res.send(doctor);
  } catch (err) {
    console.log(err);
  }
};

export const getFilteredDoctors: (
  req: Request,
  res: Response
) => Promise<void> = async (req, res) => {
  //all possible filters
  const {
    id,
    name,
    userName,
    email,
    affiliation,
    approved,
    employmentContractAccepted,
    hourlyRate_gt,
    hourlyRate_gte,
    hourlyRate_lt,
    hourlyRate_lte,
    wallet_gt,
    wallet_gte,
    wallet_lt,
    wallet_lte,
  } = req.query;

  try {
    // Build dynamic filter based on query parameters
    const filter: any = {};

    if (id) filter._id = id;
    if (name) filter.name = name;
    if (userName) filter.userName = userName;
    if (email) filter.email = email;
    if (affiliation) filter.affiliation = affiliation;
    if (approved !== undefined) filter.approved = approved;
    if (employmentContractAccepted !== undefined)
      filter.employmentContractAccepted = employmentContractAccepted;

    if (hourlyRate_gt || hourlyRate_gte || hourlyRate_lt || hourlyRate_lte)
      filter.hourlyRate = {};
    if (hourlyRate_gt) filter.hourlyRate.$gt = Number(hourlyRate_gt);
    if (hourlyRate_gte) filter.hourlyRate.$gte = Number(hourlyRate_gte);
    if (hourlyRate_lt) filter.hourlyRate.$lt = Number(hourlyRate_lt);
    if (hourlyRate_lte) filter.hourlyRate.$lte = Number(hourlyRate_lte);

    if (req.user?.type === "admin") {
      //Only Admin can filter by wallet ;)
      if (wallet_gt || wallet_gte || wallet_lt || wallet_lte)
        filter.wallet = {};
      if (wallet_gt) filter.wallet.$gt = Number(wallet_gt);
      if (wallet_gte) filter.wallet.$gte = Number(wallet_gte);
      if (wallet_lt) filter.wallet.$lt = Number(wallet_lt);
      if (wallet_lte) filter.wallet.$lte = Number(wallet_lte);
      console.log("wallet:  ", filter.wallet, res.headersSent);

      const doctors = await Doctor.find(filter).select("-password");
      res.status(200).json(doctors);
    } else {
      const doctors = await Doctor.find(filter).select(
        "-password -nationalID -medicalDegree -medicalLicence -wallet"
      );
      //patient see only valid doctors ready to deal with
      const validDoctors = doctors.filter(
        (d) => d.approved && d.employmentContractAccepted
      );
      res.status(200).json(validDoctors);
    }
  } catch (err) {
    console.log("error occured!!!");
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const updateDoctor: (
  req: Request,
  res: Response
) => Promise<any> = async (req, res) => {
  console.log("updating", req.body);
  let doctorId;
  if (req.user?.type == "admin") doctorId = req.params.id;
  else if (req.user?.type == "doctor") {
    doctorId = req.user?.id;
    const protectedAttributes = [
      "name",
      "approved",
      "wallet",
      "resetPasswordToken",
      "resetPasswordExpires",
    ];
    const violatedAttributes = protectedAttributes.filter(
      (att) => att in req.body
    );
    if (violatedAttributes.length > 0) {
      return res
        .status(403)
        .json({ message: "Doctor Can not change this data to him self" });
    }
  } else {
    return res
      .status(401)
      .json({ message: "User Type is not authorized to be Here!!" });
  }
  const updatedDoctor = await Doctor.findByIdAndUpdate(
    doctorId,
    { ...req.body },
    { new: true }
  );
  console.log(updatedDoctor);
  if (updatedDoctor !== null) res.json(updatedDoctor);
  else {
    res.status(500).json({ message: "doctor not found" });
  }
};

export const approveDoctor: (
  req: Request,
  res: Response
) => Promise<any> = async (req, res) => {
  try {
    const doctorId = req.params.id;

    //send the employment contract to the doctor HERE!!!
    const contractPath = await generateContract(doctorId);
    console.log(contractPath);
    const filePath = contractPath;
    // const fileData = fs.readFileSync(filePath);
    // let fileData:{type:string,data:Buffer};
    let fileData;
    await fs.readFile(contractPath, async (err: any, data: any) => {
      if (err) {
        console.log("found err", err);
        return res
          .status(401)
          .json({ message: "failed to read the file", error: err });
      } else {
        fileData = data;
        const updatedDoctor = await Doctor.findByIdAndUpdate(
          doctorId,
          {
            approved: true,
            employmentContract: {
              data: fileData,
              contentType: "application/pdf",
            },
          },
          { new: true, runValidators: true }
        );
        console.log("deleting");
        if (updatedDoctor)
          await fs.unlink(filePath, (err: any) => {
            if (err) {
              console.error("Error deleting the file:", err);
            } else {
              console.log("File deleted successfully");
            }
          });
        return res.status(200).json(updatedDoctor);
      }
    });
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const getMyData: (req: Request, res: Response) => Promise<void> = async (
  req,
  res
) => {
  try {
    const doctor = await Doctor.findById(req.user?.id);
    res.status(200).json(doctor);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const getMyPatients: (
  req: Request,
  res: Response
) => Promise<any> = async (req, res) => {
  try {
    //TODO:: patient of any appointment status are incuded here, may be fixed if needed to specify some status
    const myAppslean = await Appointment.find({ doctor: req.user?.id }).lean();
    // const myApps = await Appointment.find({ doctor: req.user?.id });
    // console.log(
    //   "loooooooooooooook here normal::",
    //   typeof myApps["0"]._doc,
    //   Object.keys(myApps["0"]).length,
    //   Object.keys(myApps["0"]),
    //   myApps["0"]._doc
    // );
    // console.log(
    //   "loooooooooooooook here lean::",
    //   typeof myAppslean,
    //   Object.keys(myAppslean).length,
    //   Object.keys(myAppslean),
    //   myAppslean["0"].patient.toString()
    // );
    let uniqueIds: Set<string> = new Set();
    let patients: Array<any> = [];
    let i: number = 0;
    while (i < Object.keys(myAppslean).length) {
      if (!uniqueIds.has(myAppslean[i].patient.toString())) {
        uniqueIds.add(myAppslean[i].patient.toString());
        console.log(myAppslean[i].patient.toString());
        const patient = await Patient.findById(
          myAppslean[i].patient.toString(),
          "-password -wallet -medicalHistoryItems"
        );
        patients.push(patient);
      }

      i++;
    }

    return res.json(patients);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const viewMyEmploymentContract: (
  req: Request,
  res: Response
) => Promise<any> = async (req, res) => {
  try {
    const myContract = await Doctor.findById(
      req.user?.id,
      "employmentContract approved"
    );
    console.log(myContract?.employmentContract);
    if (!myContract?.approved)
      return res.status(403).json({ message: "You are not approved yet" });
    return res.status(200).json(myContract);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const AcceptMyContract: (
  req: Request,
  res: Response
) => Promise<any> = async (req, res) => {
  try {
    const doctorId = req.user?.id;
    const oldDoctor = await Doctor.findById(doctorId, "approved");
    if (oldDoctor?.approved == false)
      return res
        .status(403)
        .json({ message: "You are not allowed to accept the contract now!!!" });
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { employmentContractAccepted: true },
      { new: true, runValidators: true }
    );
    res.status(200).json(updatedDoctor);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const addTimeSlots: (
  req: Request,
  res: Response
) => Promise<any> = async (req, res) => {
  try {
    const slots: Array<Date> = req.body.slots;
    const oldDoctor = await Doctor.findById(
      req.user?.id,
      "approved employmentContractAccepted"
    );
    if (!oldDoctor?.approved || !oldDoctor?.employmentContractAccepted)
      return res
        .status(403)
        .json({ message: "You are not allowed to add slots Yet" });
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      req.user?.id,
      {
        $push: {
          availableSlots: {
            $each: [...slots],
          },
        },
      },
      { new: true, runValidators: true }
    );
    return res.status(200).json(updatedDoctor?.availableSlots);
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
    const doctor = await Doctor.findById(req.user?.id, "wallet");
    return res.status(200).json(doctor);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const viewDoctorAvailableSlots: (
  req: Request,
  res: Response
) => Promise<any> = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id, "availableSlots");
    return res.status(200).json(doctor);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};
