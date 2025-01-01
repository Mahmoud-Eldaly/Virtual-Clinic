import mongoose, { Schema, model, connect, Types } from "mongoose";
import Admin from "./Admin";
import Doctor from "./Doctor";
import { packageSchema } from "./Package";
// 1. Create an interface representing a document in MongoDB.
enum genderEnum {
  "male",
  "female",
}
enum relationToPatientEnum {
  "spouse",
  "child",
}
interface File {
  _id: Types.ObjectId;
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}
const FileSchema = new Schema<File>({
  _id: {
    type: Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  },
  buffer: { type: Buffer, required: true },
  mimetype: { type: String, required: true },
  originalname: { type: String, required: true },
});
interface FamilyMember {
  _id: Types.ObjectId;
  userName?: string;
  name: string;
  nationalID?: string;
  age: number;
  gender: string;
  relationToPatient: string;
  memberId?: Types.ObjectId;
  package?: any;
  packageRenewalDate?: Date;
}
export const FamilyMemberSchema = new Schema<FamilyMember>({
  _id: {
    type: Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  },
  userName: { type: String },
  name: { type: String, required: true },
  nationalID: { type: String },
  age: { type: Number, required: true },
  gender: { type: String, enum: Object.values(genderEnum), required: true },
  relationToPatient: {
    type: String,
    enum: Object.values(relationToPatientEnum),
    required: true,
  },
  memberId: { type: Schema.Types.ObjectId, required: false },
  package: { type: packageSchema, required: false },
  packageRenewalDate: { type: Date, required: false },
});

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
  //check strength
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
    unique: true,
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
  renewalDate: Date,
  familyMembers: { type: [FamilyMemberSchema], default: [] },
  wallet: { type: Number, default: 0 },
  medicalHistoryItems: { type: [FileSchema], default: [] },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});

// 3. Create a Model.
const Patient = model("Patient", patientSchema);

export default Patient;
