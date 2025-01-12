import { Schema, model, connect, Types } from "mongoose";
import Patient from "./Patient";
import Admin from "./Admin";
import { DuplicateUsername } from "../utils/DublicateUserNameChecker";

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
const employmentContractSchema = new Schema({
  data: { type: Buffer, required: true },
  contentType: { type: String, required: true },
});
// 2. Create a Schema corresponding to the document interface.
const doctorSchema = new Schema({
  name: {
    type: String,
    required: true,
    minLength: [1, "name can not be empty"],
  },
  userName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please fill a valid email address",
    ],
  },
  password: {
    type: String,
    required: true,
    minLength: [8, "password must be 8 charchters minimum"],
  },
  birthDate: {
    type: Date,
    required: true,
    max: [Date.now(), "birth date can not be in future"],
  },
  hourlyRate: { type: Number, required: true },
  affiliation: { type: String, required: true },
  educationalBackground: { type: String, required: true },
  nationalID: {
    data: Buffer,
    contentType: String,
  },
  medicalDegree: {
    data: Buffer,
    contentType: String,
  },
  medicalLicence: {
    data: Buffer,
    contentType: String,
  },
  approved: { type: Boolean, default: false },
  employmentContractAccepted: { type: Boolean, default: false },
  employmentContract: {
    type: employmentContractSchema,
    required: false,
    validate: {
      validator: function (value: { data: any; contentType: any; }) {
        if (value) {
          return value.data && value.contentType;
        }
        return true;
      },
      message: 'Both data and contentType are required if employmentContract is provided',
    },
  },
  availableSlots: { type: Array, default: [] },
  wallet: { type: Number, default: 0 },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});

// 3. Create a Model.
const Doctor = model("Doctor", doctorSchema);

export default Doctor;
// module.export=Doctor;
