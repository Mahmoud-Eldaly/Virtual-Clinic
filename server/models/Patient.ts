import { Schema, model, connect, Types } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
enum genderEnum {
  "male",
  "female",
  
}

interface IPatient {
  name: string;
  userName: string;
  email: string;
  password: string;
  birthDate: Date;
  gender: genderEnum;
  mobileNumer: string;
  emergencyName: string;
  emergencyMobileNumber: string;
  medical_history: string[];
  subscribedPackage?: Types.ObjectId;
  familyMembers?: Array<string | Types.ObjectId>;
}

// 2. Create a Schema corresponding to the document interface.
const patientSchema = new Schema<IPatient>({
  name: { type: String, required: true },
  userName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  birthDate: { type: Date, required: true },
  gender: { enum: genderEnum, required: true },
  mobileNumer: { type: String, required: true },
  emergencyName: { type: String, required: true },
  emergencyMobileNumber: { type: String, required: true },
  subscribedPackage: { type: Schema.Types.ObjectId, ref: "" },
  familyMembers: { type: Array, default: [] },
});

// 3. Create a Model.
const Patient = model<IPatient>("Patient", patientSchema);
