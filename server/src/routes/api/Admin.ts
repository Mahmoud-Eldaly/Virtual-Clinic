import express, { Request, Response, NextFunction } from "express";
import { addAdmin, removeAdmin } from "../../controllers/AdminController";
import authenticateToken from "../../middlewares/Authentication";
import verifyAdmin from "../../middlewares/AdminMW";
import {
  approveDoctor,
  removeDoctor,
} from "../../controllers/DoctorController";
import { removePatient } from "../../controllers/PatientController";
import {
  addPackage,
  removePackage,
  updatePackage,
} from "../../controllers/PackageController";
import { changeMyPassword } from "../../controllers/UserDataController";

//Here Goes Endpoints related to the logged in User (*As a* in user stories)

const AdminRouter = express.Router();

AdminRouter.use(authenticateToken, verifyAdmin);
AdminRouter.post("/add-admin", (req, res) => addAdmin(req, res));
AdminRouter.post("/add-package", (req, res) => addPackage(req, res));

AdminRouter.put("/change-password", (req, res) => changeMyPassword(req, res));
AdminRouter.put("/approve-doctor/:id", (req, res) => approveDoctor(req, res));
AdminRouter.put("/update-package/:id", (req, res) => updatePackage(req, res));

AdminRouter.delete("/remove-admin/:id", (req, res) => removeAdmin(req, res));
AdminRouter.delete("/remove-doctor/:id", (req, res) => removeDoctor(req, res));
AdminRouter.delete("/remove-patient/:id", (req, res) =>
  removePatient(req, res)
);
AdminRouter.delete("/remove-package/:id", (req, res) =>
  removePackage(req, res)
);

export default AdminRouter;
