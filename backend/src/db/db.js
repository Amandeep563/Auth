import dotenv from "dotenv";
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

dotenv.config();

if (!process.env.MONGODB_URI) {
  throw new Error("Please provide MongoDB URI");
}

const connectDB = async () => {
  const options = {
    connectTimeoutMS: 60000,
    socketTimeoutMS: 60000,
  };

  try {
    const conn = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`,
      options
    );
    console.log(` MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export { connectDB };
