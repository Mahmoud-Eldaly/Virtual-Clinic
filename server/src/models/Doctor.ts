import { Schema, model, connect, Types } from "mongoose";

// interface IDoctor {
//   name: string;
//   userName: string;
//   email: string;
//   password: string;
//   birthDate: Date;
//   hourlyRate: number;
//   affiliation: string;
//   educationalBackground: string;
//   nationalID: string; //img
//   medicalLicence: string; //img
//   medicalDegree: string; //img
//   approved: boolean;
//   employmentContract: string;
//   employmentContractAccepted: boolean;
//   availableSlots?: Array<{ startTime: Date; endTime: Date }>;
//   wallet: number;
// }

// 2. Create a Schema corresponding to the document interface.
const doctorSchema = new Schema({
  name: { type: String, required: true },
  userName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  birthDate: { type: Date, required: true },
  hourlyRate: { type: Number, required: true },
  affiliation: { type: String, required: true },
  educationalBackground: { type: String, required: true },
  nationalID: { type: String, required: true },
  medicalDegree: { type: String, required: true },
  medicalLicence: { type: String, required: true },
  approved: { type: Boolean, default: false },
  employmentContractAccepted: { type: Boolean, default: false },
  employmentContract: { type: String },
  availableSlots: { type: Array, default: [] },
  wallet: { type: Number, default: 0 },
});

// 3. Create a Model.
const Doctor = model("Doctor", doctorSchema);

export default Doctor;
// module.export=Doctor;
