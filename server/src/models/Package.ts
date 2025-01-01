import { model, Schema } from "mongoose";

interface IPackage extends Document {
  name: string;
  price: number;
  sessionDiscount: number;
  pharmacyDiscount: number;
  familyDiscount: number;
}

export const packageSchema: Schema = new Schema<IPackage>({
  name:  String ,
  price:  Number ,
  sessionDiscount: Number ,
  pharmacyDiscount:  Number ,
  familyDiscount:  Number ,
});


const Package = model<IPackage>("Package", packageSchema);

export default Package;
