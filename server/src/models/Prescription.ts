import  { model, Schema, Types } from "mongoose";

// interface IPrescription {
//   patient: Types.ObjectId;
//   doctor: Types.ObjectId;
//   medicine: Array<string>;
// }

const prescriptionSchema: Schema = new Schema({
  patient: { type: Schema.Types.ObjectId, ref: "Patient" },
  doctor: { type: Schema.Types.ObjectId, ref: "Doctor" },
  medicine:{type:Array,default:[]}

});

const Prescription = model("Prescription", prescriptionSchema);

export default Prescription;