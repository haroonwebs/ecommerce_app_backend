import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.send("Express + TypeScript API running 🚀");
});

app.listen(port, () => {
  console.log(`app is running at port ${port}`);
});

export default app;
