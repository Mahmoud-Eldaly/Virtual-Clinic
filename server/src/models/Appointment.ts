import { Schema, model, connect, Types, Document } from "mongoose";

export enum statusEnum {
  Reserved = "reserved",
  Cancelled = "cancelled",
  Done = "done",
}

interface Appointment {
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  date: Date;
  status: statusEnum;
  prescription: string[];
  familyMemberName?: string;
  pricePaid?: number;
}

// Extend Mongoose Document to include Appointment
interface AppointmentDocument extends Appointment, Document {}

const appointmentSchema: Schema = new Schema<Appointment>({
  patient: { type: Schema.Types.ObjectId, ref: "Patient" },
  doctor: { type: Schema.Types.ObjectId, ref: "Doctor" },
  date: Date,
  status: {
    type: String,
    enum: Object.values(statusEnum),
    default: statusEnum.Reserved,
  },
  prescription: { type: [String], default: [] },
  familyMemberName: { type: String, required: false },
  pricePaid: Number,
});

const Appointment = model<AppointmentDocument>("Appointment", appointmentSchema);

// const Appointment = model("Appointment", appointmentSchema);

export default Appointment;
