import { Schema, model, connect, Types } from "mongoose";
import Admin from "./Admin";
import Doctor from "./Doctor";
import { packageSchema } from "./Package";
// 1. Create an interface representing a document in MongoDB.
enum genderEnum {
  "male",
  "female",
}

// interface IPatient {
//   name: string;
//   userName: string;
//   email: string;
//   password: string;
//   birthDate: Date;
//   gender: genderEnum;
//   mobileNumer: string;
//   emergencyName: string;
//   emergencyMobileNumber: string;
//   medical_history: string[];
//   subscribedPackage?: Types.ObjectId;
//   familyMembers?: Array<string | Types.ObjectId>;
//   wallet: number;
// }

// 2. Create a Schema corresponding to the document interface.
export const patientSchema = new Schema({
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
  gender: { type: String, enum: Object.values(genderEnum), required: true },
  mobileNumer: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function (v: string) {
        return /^[0-9]+$/.test(v);
      },
      message: "Mobile number must contain only digits!",
    },
  },
  emergencyName: {
    type: String,
    required: true,
    trim: true,
    minLength: [1, "name can not be empty"],
  },
  emergencyMobileNumber: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function (v: string) {
        return /^[0-9]+$/.test(v);
      },
      message: "Mobile number must contain only digits!",
    },
  },
  //in case admin deleted package after patient subscribed
  subscribedPackage: packageSchema,
  familyMembers: { type: Array, default: [] },
  wallet: { type: Number, default: 0 },
});

// 3. Create a Model.
const Patient = model("Patient", patientSchema);

export default Patient;
