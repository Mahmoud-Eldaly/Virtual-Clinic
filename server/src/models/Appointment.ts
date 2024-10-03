import { Schema, model, connect, Types, Document } from "mongoose";
import Doctor from "./Doctor";
import Patient from "./Patient";

enum statusEnum {
  Reserved = "reserved",
  Cancelled = "cancelled",
  Done = "done",
}

const appointmentSchema: Schema = new Schema({
  patient: { type: Schema.Types.ObjectId, ref: "Patient" },
  doctor: { type: Schema.Types.ObjectId, ref: "Doctor" },
  date: Date,
  status: {
    type: String,
    enum: Object.values(statusEnum),
    default: statusEnum.Reserved,
  },
});

const Appointment = model("Appointment", appointmentSchema);

export default Appointment;
