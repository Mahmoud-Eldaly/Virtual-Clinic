import { model, Schema } from "mongoose";

interface Itoken extends Document {
  token: string;
}

export const tokenSchema: Schema = new Schema<Itoken>({
  token: { type: String, required: true },
});

const ValidToken = model<Itoken>("ValidToken", tokenSchema);

export default ValidToken;
