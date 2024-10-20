import Package from "../models/Package";

import { Request, Response } from "express";
//Here Goes Endpoints related to the DB Model


export const addPackage: (
  req: Request,
  res: Response
) => Promise<void> = async (req: Request, res: Response) => {
  try {
    const newPackage = new Package(req.body);
    const savedPackage = await newPackage.save();
    console.log("added New Package");
    res.send(savedPackage);
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ message: err.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export const removePackage: (
  req: Request,
  res: Response
) => Promise<void> = async (req, res) => {
  try {
    console.log("try to remove", req.params);
    const removedpackage = await Package.findByIdAndDelete(req.params.id);
    if (!removedpackage) {
      res.status(404).send("Package not found");
      return;
    }

    res.send(removedpackage);
  } catch (err) {
    console.log(err);
  }
};

export const updatePackage: (
  req: Request,
  res: Response
) => Promise<void> = async (req, res) => {
  console.log("updating",req.body)
  const packageId = req.params.id;
  const updatedPackage =await Package.findByIdAndUpdate(
    packageId,
    { ...req.body },
    { new: true }
  );
  console.log(updatedPackage)
  if (updatedPackage !== null) res.json(updatedPackage);
  else {
    res.status(500).json({ message: "package not found" });
  }
};


