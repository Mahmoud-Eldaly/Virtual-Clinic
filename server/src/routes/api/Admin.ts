import express, { Request, Response, NextFunction } from "express";
import { addAdmin, removeAdmin } from "../../controllers/AdminController";
import authenticateToken from "../../middlewares/Authentication";

const AdminRouter = express.Router();

// AdminRouter.use(async (req, res, next) => {
//   await authenticateToken(req, res, next);
//   next();
// });
AdminRouter.post("/add-admin", authenticateToken, (req, res) =>
  addAdmin(req, res)
);
AdminRouter.delete("/remove-admin/:id", (req, res) => removeAdmin(req, res));

export default AdminRouter;
