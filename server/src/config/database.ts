import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoURI = process.env.MONGO_URI;

export const connect = async () => {
  try {
    console.log("DB URI =", mongoURI);
    await mongoose.connect(mongoURI as string);
    console.log("database connected");
  } catch (err) {
    console.log(err)
  }
};
