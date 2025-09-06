import dotenv from "dotenv";
dotenv.config();

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { connectDB } from "./db/db.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

//routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json("Server is working");
});

//database connection
connectDB();

app.listen(PORT, () => {
  console.log(`Server is running at port: ${PORT}`);
});
