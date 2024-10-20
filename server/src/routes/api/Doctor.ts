import express, { Request, Response, NextFunction } from "express";
import {
  addDoctor,
  removeDoctor,
  getFilteredDoctors,
  updateDoctor,
  getMyData,
} from "../../controllers/DoctorController";
import authenticateToken from "../../middlewares/Authentication";
import verifyDoctor from "../../middlewares/DoctorMW";
import { changeMyPassword } from "../../controllers/UserDataController";

//Here Goes Endpoints related to the logged in User (*As a* in user stories)

const DoctorRouter = express.Router();

DoctorRouter.use(authenticateToken, verifyDoctor);
DoctorRouter.get("/my-data", (req, res) => getMyData(req, res));
DoctorRouter.get("/filtered-doctors", (req, res) =>
  getFilteredDoctors(req, res)
);
DoctorRouter.put("/update-my-data/", (req, res) => updateDoctor(req, res));
DoctorRouter.put("/change-password", (req, res) => changeMyPassword(req, res));

export default DoctorRouter;
