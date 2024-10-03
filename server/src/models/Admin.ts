import { Schema, model, connect, Types, Document } from "mongoose";
import Doctor from "./Doctor";
import Patient from "./Patient";
interface IAdmin extends Document {
  userName: string;
  password: string;
}

const adminSchema: Schema = new Schema<IAdmin>({
  userName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minLength: [8, "password must be 8 charchters minimum"],
  },
});

const Admin = model<IAdmin>("Admin", adminSchema);

export default Admin;
