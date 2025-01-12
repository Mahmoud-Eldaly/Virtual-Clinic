import { Request, Response } from "express";
const jwt = require("jsonwebtoken");
import Appointment, { statusEnum } from "../models/Appointment";
import Doctor from "../models/Doctor";
import Patient from "../models/Patient";
import ValidToken from "../models/ValidTokens";
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
    const valid = await ValidToken.findOneAndDelete({ token: token });
    if (!valid) {
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
          const invalidToken = new ValidToken({ token: token });
          await invalidToken.save();
          const doctor = await Doctor.findById(
            decoded?.doctor,
            "availableSlots"
          );
          //dates.map(date => date.toISOString()).includes(specificDate.toISOString());
          if (
            !doctor?.availableSlots
              .map((date) => date.toISOString())
              .includes(decoded?.date)
          ) {
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
            pricePaid: decoded?.paidPrice,
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
    // const { date_gte, date_lte, status, type } = req.query;
    const { date_gte, date_lte, status } = req.query;
    const filter: any = {};
    if (req.user?.type === "doctor") filter.doctor = req.user.id;
    if (req.user?.type === "patient") filter.patient = req.user.id;
    if (date_gte || date_lte) filter.date = {};
    if (date_gte) filter.date.$gte = date_gte;
    if (date_lte) filter.date.$lte = date_lte;
    if (status) filter.status = status;
    console.log(filter.status, status, filter);
    // if (type === "prescription") {
    //   filter.status = "done";
    //   const prescriptions = await Appointment.find(filter, "prescription");
    //   return res.status(200).json(prescriptions);
    // }
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

    res
      .status(200)
      .json({
        message: "appointment was removed successfully",
        removedAppointment: removedappointment,
      });
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
) => Promise<any> = async (req, res) => {
  try {
    // console.log("updating", req.body);
    const appointmentId = req.body.appointmentId;
    const prescriptionItems = req.body.prescription ?? [];
    const appointment = await Appointment.findById(appointmentId);
    if (appointment?.status == statusEnum.Cancelled) {
      return res
        .status(401)
        .json({ message: "Cancelled Appointments can not be updated!!" });
    }
    // const status = req.params.status;
    if (req.user?.type == "doctor") {
      if (req.user.id != appointment?.doctor) {
        return res.status(403).json({
          message: "You are not allowed to update this appointment!!",
        });
      }
      if (req.body.status == statusEnum.Cancelled) {
        await Patient.updateOne(
          { _id: appointment!.patient },
          { $inc: { wallet: appointment?.pricePaid! } }
        );
      }
      const updatedAppointment = await Appointment.findByIdAndUpdate(
        appointmentId,
        {
          ...req.body,
          $push: {
            prescription: {
              $each: [...prescriptionItems],
            },
          },
        },
        { new: true, runValidators: true }
      );
      console.log(updatedAppointment);
      if (updatedAppointment !== null)
        return res.json({ updatedAppointment: updatedAppointment });
      else {
        return res.status(500).json({ message: "appointment not found" });
      }
    } else if (req.user?.type == "patient") {
      //no rescheduling allowed
      if (req.user.id != appointment?.patient) {
        return res.status(403).json({
          message: "You are not allowed to update this appointment!!",
        });
      }
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      if (appointment?.date! > next24Hours) {
        console.log("refunding...");
        await Patient.updateOne(
          { _id: appointment!.patient },
          { $inc: { wallet: appointment?.pricePaid! } }
        );
      }
      await Doctor.updateOne(
        { _id: appointment!.doctor },
        { $push: { availableSlots: appointment?.date! } }
      );
      const updatedAppointment = await Appointment.findByIdAndUpdate(
        appointmentId,
        {
          status: statusEnum.Cancelled,
        },
        { new: true, runValidators: true }
      );
      return res.status(200).json(updatedAppointment);
    }
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};
