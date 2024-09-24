import  { Schema, Types } from "mongoose";

interface IPrescription {
  patient: Types.ObjectId;
  doctor: Types.ObjectId;
  medicine: Array<string>;
}

const prescriptionSchema: Schema = new Schema<IPrescription>({
//   patient: { type: Schema.Types.ObjectId, ref: "Patient" },
  doctor: { type: Schema.Types.ObjectId, ref: "Package" },

});
