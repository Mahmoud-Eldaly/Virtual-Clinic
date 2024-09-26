import { model, Schema } from "mongoose";

interface IPackage {
  name: string;
  price: number;
  sessionDiscount: number;
  pharmacyDiscount: number;
  familyDiscount: number;
}

const packageSchema: Schema = new Schema<IPackage>({
  name: { type: String },
  price: { type: Number },
  sessionDiscount: { type: Number },
  pharmacyDiscount: { type: Number },
  familyDiscount: { type: Number },
});


const Package = model<IPackage>("Package", packageSchema);

export default Package;
