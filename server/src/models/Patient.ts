import { Schema, model, connect, Types } from "mongoose";

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
const patientSchema = new Schema({
  name: { type: String, required: true },
  userName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  birthDate: { type: Date, required: true },
  gender: { enum: genderEnum, required: true },
  mobileNumer: { type: String, required: true },
  emergencyName: { type: String, required: true },
  emergencyMobileNumber: { type: String, required: true },
  subscribedPackage: { type: Schema.Types.ObjectId, ref: "Package" },
  familyMembers: { type: Array, default: [] },
  wallet: { type: Number, default: 0 },
});

// 3. Create a Model.
const Patient = model("Patient", patientSchema);

export default Patient;
// module.export=Patient;
