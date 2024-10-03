import express, { Request, Response, NextFunction } from "express";
import {
  addPackage,
  removePackage,
  updatePackage,
} from "../../controllers/PackageController";

const PackageRouter = express.Router();

PackageRouter.post("/add-package", (req, res) => addPackage(req, res));
PackageRouter.delete("/remove-package/:id", (req, res) =>
  removePackage(req, res)
);
PackageRouter.put("/update-package/:id", (req, res) => updatePackage(req, res));

export default PackageRouter;
