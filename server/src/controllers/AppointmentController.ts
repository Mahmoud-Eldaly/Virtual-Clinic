import { Request, Response } from "express";

import Appointment from "../models/Appointment";

export const addAppointment: (
  req: Request,
  res: Response
) => Promise<void> = async (req: Request, res: Response) => {
  try {
    const appointment = new Appointment({
      ...req.body,
    });
    const addedApp = await appointment.save();
    res.json(addedApp);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const getFilteredAppointments: (
  req: Request,
  res: Response
) => Promise<void> = async (req, res) => {
  try {
    const { patient, doctor, date_gte, date_lte, status } = req.query;
    const filter: any = {};
    if (patient) filter.patient = patient;
    if (doctor) filter.doctor = doctor;
    if (date_gte || date_lte) filter.date = {};
    if (date_gte) filter.date.$gte = date_gte;
    if (date_lte) filter.date.$lte = date_lte;
    if (status) filter.status = status;

    const filteredApps = await Appointment.find(filter);
    res.status(200).json(filteredApps);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const removeAppointment: (
  req: Request,
  res: Response
) => Promise<void> = async (req, res) => {
  try {
    console.log("try to remove", req.params);
    const removedappointment = await Appointment.findByIdAndDelete(
      req.params.id
    );
    if (!removedappointment) {
      res.status(404).send("Appointment not found");
      return;
    }

    res.send(removedappointment);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const updateAppointment: (
  req: Request,
  res: Response
) => Promise<void> = async (req, res) => {
  try {
    console.log("updating", req.body);
    const appointmentId = req.params.id;
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { ...req.body },
      { new: true, runValidators: true }
    );
    console.log(updatedAppointment);
    if (updatedAppointment !== null) res.json(updatedAppointment);
    else {
      res.status(500).json({ message: "appointment not found" });
    }
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};
