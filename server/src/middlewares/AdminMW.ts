import { Request, Response, NextFunction } from "express";

const verifyAdmin: (req: Request, res: Response, next: NextFunction) => void = (
  req,
  res,
  next
) => {
  try {
    console.log("in Admin MW")
    if (req.user?.type === "admin") return next();
    else
      return res
        .status(500)
        .json({ message: "Only Admins Are Authorized to be here!!" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Only Admins Are Authorized to be here!!" });
  }
};

export default verifyAdmin;
