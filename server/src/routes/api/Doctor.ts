import express, { Request, Response, NextFunction } from "express";
import {
  getFilteredDoctors,
  updateDoctor,
  getMyData,
  viewMyEmploymentContract,
  AcceptMyContract,
  addTimeSlots,
  viewMyWallet,
  getMyPatients,
} from "../../controllers/DoctorController";
import authenticateToken from "../../middlewares/Authentication";
import verifyDoctor from "../../middlewares/DoctorMW";
import { changeMyPassword } from "../../controllers/UserDataController";
import {
  addMedicalHistoryItemToPatient,
  viewMedicalHistoryItemsOfPatient,
} from "../../controllers/PatientController";
import {
  getFilteredAppointments,
  updateAppointment,
} from "../../controllers/AppointmentController";
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });
//Here Goes Endpoints related to the logged in User (*As a* in user stories)

const DoctorRouter = express.Router();

DoctorRouter.use(authenticateToken, verifyDoctor);
DoctorRouter.get("/view-contract", (req, res) =>
  viewMyEmploymentContract(req, res)
);
DoctorRouter.put("/accept-contract", (req, res) => AcceptMyContract(req, res));
DoctorRouter.get("/filtered-doctors", (req, res) =>
  getFilteredDoctors(req, res)
);
DoctorRouter.get("/filtered-appointments", (req, res) =>
  getFilteredAppointments(req, res)
);
DoctorRouter.get("/my-patients", (req, res) => getMyPatients(req, res));
DoctorRouter.get("/view-wallet", (req, res) => viewMyWallet(req, res));
DoctorRouter.put("/update-my-data", (req, res) => updateDoctor(req, res));
// DoctorRouter.put("/change-password", (req, res) => changeMyPassword(req, res));
DoctorRouter.put(
  "/add-health-record/:id",
  upload.fields([{ name: "medicalHistoryItems", maxCount: 10 }]),
  (req, res) => addMedicalHistoryItemToPatient(req, res)
);
//doooooo
DoctorRouter.put("/update-appointment", (req, res) =>
  updateAppointment(req, res)
);

DoctorRouter.get("/view-filtered-appointment", (req, res) =>
  getFilteredAppointments(req, res)
);

DoctorRouter.get("/view-health-records/:id", (req, res) =>
  viewMedicalHistoryItemsOfPatient(req, res)
);

DoctorRouter.post("/add-slots", (req, res) => addTimeSlots(req, res));

DoctorRouter.get("/my-data", (req, res) => getMyData(req, res));

export default DoctorRouter;
