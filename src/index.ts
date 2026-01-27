import dotenv from "dotenv";
import express from "express";
import connectDB from "./db/dbConnection";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config();
connectDB();
const app = express();
const port = process.env.PORT || 4000;

app.use(express.json({ limit: "16kb" }));
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));

// import user routes
import userRouter from "./routes/user.routes";
import videoRouter from "./routes/video.routes";
import SubscriptionRouter from "./routes/subscription.route";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/subscriptions", SubscriptionRouter);

app.listen(port, () => {
  console.log(`app is running at port ${port}`);
});

export default app;
