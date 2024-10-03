import Doctor from "../models/Doctor";
import { DuplicateUsername } from "../utils/DublicateUserNameChecker";
import { Request, Response } from "express";
import { getFilteredAppointments } from "./AppointmentController";
import Appointment from "../models/Appointment";
var bcrypt = require("bcryptjs");

export const addDoctor: (req: Request, res: Response) => Promise<void> = async (
  req: Request,
  res: Response
) => {
  try {
    const noDuplicateUsername = await DuplicateUsername(req.body.userName);
    if (noDuplicateUsername) {
      var hash = bcrypt.hashSync(req.body.password, 8);
      const newDoctor = new Doctor({ ...req.body, password: hash });
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

    if (wallet_gt || wallet_gte || wallet_lt || wallet_lte) filter.wallet = {};
    if (wallet_gt) filter.wallet.$gt = Number(wallet_gt);
    if (wallet_gte) filter.wallet.$gte = Number(wallet_gte);
    if (wallet_lt) filter.wallet.$lt = Number(wallet_lt);
    if (wallet_lte) filter.wallet.$lte = Number(wallet_lte);
    console.log("wallet:  ", filter.wallet,res.headersSent);

    const doctors = await Doctor.find(filter);
    res.status(200).json(doctors);
  } catch (err) {
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
) => Promise<void> = async (req, res) => {
  console.log("updating", req.body);
  const doctorId = req.params.id;
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

// export const getMyPatients:(
//   req: Request,
//   res: Response
// ) => Promise<void> = async (req, res) => {
//   const myApps=await Appointment.find({"doctor":})
// }
