import { Request, Response, NextFunction } from "express";

const verifyPatient: (req: Request, res: Response, next: NextFunction) => void = (
  req,
  res,
  next
) => {
  try {
    console.log("in Patient MW")
    if (req.user?.type === "patient") return next();
    else
      return res
        .status(500)
        .json({ message: "Only Patients Are Authorized to be here!!" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Only Patients Are Authorized to be here!!" });
  }
};

export default verifyPatient;
