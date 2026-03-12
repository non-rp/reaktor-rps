import express from "express";
import cors from "cors"; 
import helmet from "helmet"; // security middleware(setting HTTP headers)
import morgan from "morgan"; // loging middleware
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import historyRouter from "./modules/history/history.routes";
import usersRouter from "./modules/users/users.routes";
import { startHistorySyncJob } from "./modules/history/sync/historySync.job";
import { startHistorySync } from "./modules/history/sync/historySync.service";
import { swaggerSpec } from "./swagger";

dotenv.config();

const app = express();
app.use(cors());
app.use(helmet());

const format = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(morgan(format));
app.use(express.json());

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api/docs.json", (req, res) => {
  res.json(swaggerSpec);
});

/**
 * @openapi
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Check API availability
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/history", historyRouter);
app.use("/api/users", usersRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API is running on port ${port}`);
});

startHistorySyncJob();

void startHistorySync("startup");
