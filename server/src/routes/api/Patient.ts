import {
  addFamilyMembers,
  addMyMedicalHistoryItems,
  addPatient,
  getMyData,
  removeMyMedicalHistoryItem,
  removePatient,
  subscribeForPackage,
  viewFamilyMembers,
  viewMyMedicalHistoryItems,
  viewMyWallet,
} from "../../controllers/PatientController";
import express, { Request, Response, NextFunction } from "express";
import authenticateToken from "../../middlewares/Authentication";
import verifyPatient from "../../middlewares/PatientMW";
import { changeMyPassword } from "../../controllers/UserDataController";
import { viewDoctorAvailableSlots } from "../../controllers/DoctorController";
import {
  addAppointment,
  getFilteredAppointments,
} from "../../controllers/AppointmentController";
import { viewPackages } from "../../controllers/PackageController";
import {
  pay_appointment,
  pay_package,
} from "../../controllers/PaymentController";
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });
const PatientRouter = express.Router();

PatientRouter.use(authenticateToken, verifyPatient);
PatientRouter.put(
  "/add-medical-history-items",
  upload.fields([{ name: "medicalHistoryItems", maxCount: 10 }]),
  (req, res) => addMyMedicalHistoryItems(req, res)
);
PatientRouter.get("/view-medical-history-items", (req, res) =>
  viewMyMedicalHistoryItems(req, res)
);
PatientRouter.get("/view-wallet", (req, res) => viewMyWallet(req, res));
PatientRouter.get("/view-doctor-slots/:id", (req, res) =>
  viewDoctorAvailableSlots(req, res)
);
PatientRouter.put("/remove-medical-history-item", (req, res) =>
  removeMyMedicalHistoryItem(req, res)
);
PatientRouter.put("/change-password", (req, res) => changeMyPassword(req, res));

PatientRouter.post("/add-family-members", (req, res) =>
  addFamilyMembers(req, res)
);

PatientRouter.get("/view-family-members", (req, res) =>
  viewFamilyMembers(req, res)
);

PatientRouter.get("/filtered-appointments", (req, res) =>
  getFilteredAppointments(req, res)
);

PatientRouter.get("/view-packages", (req, res) => viewPackages(req, res));

PatientRouter.post("/pay-package", (req, res) => pay_package(req, res))

PatientRouter.post("/pay-reserve-appiontment", (req, res) => pay_appointment(req, res));

PatientRouter.post("/add-appointment", (req, res) => addAppointment(req, res));

PatientRouter.get("/my-data", (req, res) => getMyData(req, res));

PatientRouter.put("/subscribe-to-package", (req, res) =>
  subscribeForPackage(req, res)
);

export default PatientRouter;
