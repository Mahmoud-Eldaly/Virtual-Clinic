import Doctor from "../models/Doctor";
import Package from "../models/Package";
import Patient from "../models/Patient";
import { Request, Response } from "express";

require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const jwt = require("jsonwebtoken");
// TODO:: What if he had no siffecient amount or cancelled
// Viel Erfolg und bis Morgen :)
export const pay_appointment: (
  req: Request,
  res: Response
) => Promise<any> = async (req, res) => {
  try {
    console.log(req.body);
    //Handle all pricing complication Here!!
    const familyMemberID = req.body.familyMemberID; //memberId
    const patient = await Patient.findById(req.user?.id);
    const doctor = await Doctor.findById(req.body.doctorId);

    let paidPrice = doctor?.hourlyRate!;
    if (familyMemberID) {
      const familyMember = patient?.familyMembers.find(
        (member) => member._id == familyMemberID
      );
      if (familyMember?.package) {
        // const memberPackage=a
        paidPrice -=
          paidPrice * (familyMember?.package?.sessionDiscount as number);
      }
    } else {
      const patientPackage = patient?.subscribedPackage;
      if (patientPackage) {
        paidPrice -= paidPrice * (patientPackage.sessionDiscount as number);
      }
    }
    console.log("paidprice=",paidPrice);
    // sending family member as ID NOT NAME
    const tokenData = {
      patientId: req.user?.id,
      doctor: req.body.doctorId,
      date: req.body.date,
      familyMember: familyMemberID,
      paidFromWallet: Math.min(paidPrice, patient?.wallet ?? 0), //add price here
      paidPrice: paidPrice,
    };
    const reservedAppToken = jwt.sign(
      tokenData,
      process.env.RESERVE_APPOINTMENT_SECRET,
      {
        expiresIn: "15m",
      }
    );
    console.log(reservedAppToken);
    if (paidPrice - tokenData.paidFromWallet <= 0) {
      return res.json({
        url: `http://localhost:3000/individual-trainee/my-courses?added=${reservedAppToken}`,
      });
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd", ///change it
            product_data: {
              name: `Reserve Appointment at ${req.body.date} with doctor ${doctor?.name}`,
            },
            unit_amount: Math.round((tokenData.paidPrice - tokenData.paidFromWallet)*100),
          },
          quantity: 1,
        },
      ],
      //where to go in frontend?
      success_url: `http://localhost:3000/individual-trainee/my-courses?added=${reservedAppToken}`, //to mycourses with param courseId?
      cancel_url: `http://localhost:3000/individual-trainee/all-courses`, //to allCoursesn
      // customer: req.user?.stripeId,
      payment_intent_data: { setup_future_usage: "on_session" },
    });
    res.json({ url: session.url });
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const pay_package: (
  req: Request,
  res: Response
) => Promise<any> = async (req, res) => {
  try {
    const { familyMemberID, packageId } = req.body; //memberId
    const patient = await Patient.findById(req.user?.id);
    const _package = await Package.findById(packageId);

    let paidPrice = _package?.price!;
    if (familyMemberID && patient?.subscribedPackage) {
      paidPrice -=
        paidPrice * (patient?.subscribedPackage?.familyDiscount as number);
    }

    const tokenData = {
      packageId: packageId,
      subscribingMember: familyMemberID,
      paidFromWallet: Math.min(paidPrice, patient?.wallet ?? 0),
      paidPrice: paidPrice,
    };
    const subscribedPackageToken = jwt.sign(
      tokenData,
      process.env.SUBSCRIBE_PACKAGE_SECRET,
      {
        expiresIn: "15m",
      }
    );

    if (paidPrice - tokenData.paidFromWallet <= 0) {
      return res.json({
        url: `http://localhost:3000/individual-trainee/my-courses?added=${subscribedPackageToken}`,
      });
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd", ///change it
            product_data: {
              name: `Subscrbe to medical package ${_package?.name} `,
            },
            unit_amount: Math.round((tokenData.paidPrice - tokenData.paidFromWallet)*100),
          },
          quantity: 1,
        },
      ],
      success_url: `http://localhost:3000/individual-trainee/my-courses?added=${subscribedPackageToken}`, //to mycourses with param courseId?
      cancel_url: `http://localhost:3000/individual-trainee/all-courses`, //to allCoursesn
      // customer: req.user.stripeId,
      payment_intent_data: { setup_future_usage: "on_session" },
    });
    res.json({ url: session.url });
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

// module.exports = pay;
