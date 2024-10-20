import {
  addMedicalHistoryItems,
  addPatient,
  removeMyMedicalHistoryItem,
  removePatient,
  viewMyMedicalHistoryItems,
} from "../../controllers/PatientController";
import express, { Request, Response, NextFunction } from "express";
import authenticateToken from "../../middlewares/Authentication";
import verifyPatient from "../../middlewares/PatientMW";
import { changeMyPassword } from "../../controllers/UserDataController";
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });
const PatientRouter = express.Router();

PatientRouter.use(authenticateToken, verifyPatient);
PatientRouter.put(
  "/add-medical-history-items",
  upload.fields([{ name: "medicalHistoryItems", maxCount: 10 }]),
  (req, res) => addMedicalHistoryItems(req, res)
);
PatientRouter.get("/view-medical-history-items", (req, res) =>
  viewMyMedicalHistoryItems(req, res)
);
PatientRouter.put("/remove-medical-history-item", (req, res) =>
  removeMyMedicalHistoryItem(req, res)
);
PatientRouter.put("/change-password", (req, res) => changeMyPassword(req, res));

export default PatientRouter;
