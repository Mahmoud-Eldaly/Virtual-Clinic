import { Schema, model, connect, Types } from "mongoose";
interface IAdmin {
  userName: string;
  password: string;
}

const adminSchema: Schema = new Schema<IAdmin>({
  userName: { type: String },
  password: { type: String },
});


const Admin = model<IAdmin>("Admin", adminSchema);

export default Admin;