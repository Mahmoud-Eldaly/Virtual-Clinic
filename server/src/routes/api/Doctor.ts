import express, { Request, Response, NextFunction } from "express";
import {
  addDoctor,
  removeDoctor,
  getFilteredDoctors,
  updateDoctor,
} from "../../controllers/DoctorController";
import authenticateToken from "../../middlewares/Authentication";

const DoctorRouter = express.Router();

DoctorRouter.post("/add-doctor", (req, res) => addDoctor(req, res));
DoctorRouter.delete("/remove-doctor/:id", (req, res) => removeDoctor(req, res));
DoctorRouter.get("/filtered-doctors",authenticateToken, (req, res) =>
  getFilteredDoctors(req, res)
);
DoctorRouter.put("/update-package/:id", (req, res) => updateDoctor(req, res));

export default DoctorRouter;
