import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import routes from "./routes/index.js";

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 100,
  })
);

app.use("/api", routes);

export default app;
