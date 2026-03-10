import express from "express";
import cors from "cors"; 
import helmet from "helmet"; // security middleware(setting HTTP headers)
import morgan from "morgan"; // loging middleware
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(helmet());

const format = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(morgan(format));
app.use(express.json());

app.get("/api/health", (req, res) => {
  console.log(process.env.PORT, process.env.RPS_BASE_URL, process.env.RPS_API_KEY);
  res.status(200).json({ status: "ok" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API is running on port ${port}`);
});