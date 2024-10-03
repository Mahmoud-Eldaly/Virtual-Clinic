import { addPatient, removePatient } from "../../controllers/PatientController";
import express, { Request, Response, NextFunction } from "express";

const PatientRouter = express.Router();

PatientRouter.post("/add-patient", (req, res) => addPatient(req, res));
PatientRouter.delete("/remove-patient/:id", (req, res) =>
  removePatient(req, res)
);

export default PatientRouter;
