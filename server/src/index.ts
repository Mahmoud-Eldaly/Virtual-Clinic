// import express from 'express';
import express from "express";
import { connect } from "./config/database";
import PatientRouter from "./routes/api/Patient";
import DoctorRouter from "./routes/api/Doctor";
import AdminRouter from "./routes/api/Admin";
import PackageRouter from "./routes/api/Package";
import AppointmentRouter from "./routes/api/Appointment";
import UserDataRouter from "./routes/api/UserData";
import authenticateToken from "./middlewares/Authentication";
const cookieParser = require("cookie-parser");

const app = express();

app.use(express.json());
app.use(cookieParser());
// app.use((req, res, next) => {
//     authenticateToken(req, res, next);
//   });

// app.use(authenticateToken);
app.use("/patient", PatientRouter);
app.use("/doctor", DoctorRouter);
app.use("/admin", AdminRouter);
app.use("/package", PackageRouter);
app.use("/appointment", AppointmentRouter);
app.use("/", UserDataRouter);

app.listen(5000, async () => {
  await connect();
  console.log("http://localhost:5000");
});
