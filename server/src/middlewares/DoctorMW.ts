import { Request, Response, NextFunction } from "express";

const verifyDoctor: (req: Request, res: Response, next: NextFunction) => void = (
  req,
  res,
  next
) => {
  try {
    console.log("in Doctor MW")
    if (req.user?.type === "doctor") return next();
    else
      return res
        .status(500)
        .json({ message: "Only Doctors Are Authorized to be here!!" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Only Doctors Are Authorized to be here!!" });
  }
};

export default verifyDoctor;
