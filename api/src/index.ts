import express from "express";
import cors from "cors"; 
import helmet from "helmet"; // security middleware(setting HTTP headers)
import morgan from "morgan"; // loging middleware
import dotenv from "dotenv";
import historyRouter from "./modules/history/history.routes";
import { startHistorySyncJob } from "./modules/history/sync/historySync.job";
import { startHistorySync } from "./modules/history/sync/historySync.service";

dotenv.config();

const app = express();
app.use(cors());
app.use(helmet());

const format = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(morgan(format));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/history", historyRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API is running on port ${port}`);
});

startHistorySyncJob();

void startHistorySync("startup");
