import { Request, Response } from "express";
const jwt = require("jsonwebtoken");
import Appointment from "../models/Appointment";
import Doctor from "../models/Doctor";
import Patient from "../models/Patient";
import InvalidToken from "../models/InvalidTokens";
//Here Goes Endpoints related to the DB Model

interface ReserveToken {
  doctor: string;
  date: Date;
  familyMember?: string;
  paidFromWallet: number;
  paidPrice: number;
}
//Add Appointment requires valid token proves that you have paid
//token is expected to have paidFromWallet (amount of money to be deducted)
//            and paidPrice (total price to be used in case of cancellation)
//
export const addAppointment: (
  req: Request,
  res: Response
) => Promise<any> = async (req: Request, res: Response) => {
  try {
    const token = req.body.token;
    const invalid = await InvalidToken.findOne({ token: token });
    if (invalid) {
      return res
        .status(401)
        .json({ message: "token is invalid, already used before" });
    }
    // let data: ReserveToken | undefined = undefined;

    jwt.verify(
      token,
      process.env.RESERVE_APPOINTMENT_SECRET,
      async (err: Error, decoded: ReserveToken | undefined) => {
        if (err) {
          // Wrong or expired access token
          console.log(err.message);
          return res.status(401).json({ message: err.message });
        } else {
          let data = decoded;
          console.log("decoded=", decoded);
          const invalidToken = new InvalidToken({ token: token });
          await invalidToken.save();
          const doctor = await Doctor.findById(
            decoded?.doctor,
            "availableSlots"
          );
          if (!doctor?.availableSlots.includes(decoded?.date)) {
            console.log("dr=", doctor);
            //if appiontment is already gone, return the whole paid price (wallet+stripe) to the wallet

            return res
              .status(401)
              .json({ message: "The Selected date is no longer available" });
          }
          const patient = await Patient.findById(req.user?.id, "wallet");
          if (patient?.wallet! < decoded?.paidFromWallet!) {
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

          const appointment = new Appointment({
            patient: req.user?.id,
            doctor: decoded?.doctor,
            date: decoded?.date,
            familyMember: decoded?.familyMember,
            paidPrice: decoded?.paidPrice,
          });

          const addedApp = await appointment.save();
          if (addedApp) {
            const doctor = await Doctor.findByIdAndUpdate(decoded?.doctor, {
              $pull: { availableSlots: decoded?.date },
            });

            return res.json(addedApp);
          }
          // console.log("decoded:", decoded);
        }
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

export const getFilteredAppointments: (
  req: Request,
  res: Response
) => Promise<any> = async (req, res) => {
  //gets appointments, or prescriptions if type is specifyied to prescriptions
  try {
    console.log("params:", req.query);
    const { date_gte, date_lte, status, type } = req.query;
    const filter: any = {};
    if (req.user?.type === "doctor") filter.doctor = req.user.id;
    if (req.user?.type === "patient") filter.patient = req.user.id;
    if (date_gte || date_lte) filter.date = {};
    if (date_gte) filter.date.$gte = date_gte;
    if (date_lte) filter.date.$lte = date_lte;
    if (status) filter.status = status;
    console.log(filter.status, status, filter);
    if (type === "prescription") {
      filter.status = "done";
      const prescriptions = await Appointment.find(filter, "prescription");
      return res.status(200).json(prescriptions);
    }
    const filteredApps = await Appointment.find(filter);
    return res.status(200).json(filteredApps);
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
