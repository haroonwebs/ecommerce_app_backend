import dotenv from "dotenv";
import express from "express";
import connectDB from "./db/dbConnection";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config();
connectDB();
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.send("Express + TypeScript API running 🚀");
});

app.listen(port, () => {
  console.log(`app is running at port ${port}`);
});

export default app;
