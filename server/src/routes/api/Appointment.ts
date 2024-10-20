import express, { Request, Response, NextFunction } from "express";
import {
  addAppointment,
  getFilteredAppointments,
  removeAppointment,
  updateAppointment,
} from "../../controllers/AppointmentController";

//Here Goes Endpoints related to the logged in User (*As a* in user stories)


const AppointmentRouter = express.Router();

AppointmentRouter.post("/add-appointment", (req, res) =>
  addAppointment(req, res)
);
AppointmentRouter.get("/filtered-appointments", (req, res) =>
  getFilteredAppointments(req, res)  
);
AppointmentRouter.delete("/remove-appointment/:id", (req, res) =>
  removeAppointment(req, res)
);
AppointmentRouter.put("/update-appointment/:id", (req, res) => {
  updateAppointment(req, res);
});

export default AppointmentRouter;
