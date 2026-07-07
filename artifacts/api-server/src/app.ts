import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path"; // 1. Import path utilities
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Route API endpoints first
app.use("/api", router);
// 3. Serve the static frontend files safely by forcing a root mount point
app.use("/", express.static(path.join(process.cwd(), "artifacts/mind-partner/dist")));

// 4. Fallback route handler so frontend routing doesn't break on a page refresh
app.use((req, res) => {
  res.sendFile(path.join(process.cwd(), "artifacts/mind-partner/dist/index.html"));
});



export default app;
