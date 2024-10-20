// import express from 'express';
import express from "express";
import { connect } from "./config/database";
import PatientRouter from "./routes/api/Patient";
import DoctorRouter from "./routes/api/Doctor";
import AdminRouter from "./routes/api/Admin";
import AppointmentRouter from "./routes/api/Appointment";
import UserDataRouter from "./routes/api/UserData";
// import bodyParser from "body-parser";
const cookieParser = require("cookie-parser");

const app = express();

app.use(express.json());
app.use(cookieParser());
// app.use(bodyParser.urlencoded({ extended: true }));

app.use("/patient", PatientRouter);
app.use("/doctor", DoctorRouter);
app.use("/admin", AdminRouter);
app.use("/appointment", AppointmentRouter);
app.use("/", UserDataRouter);

app.listen(5000, async () => {
  await connect();
  console.log("http://localhost:5000");
});
