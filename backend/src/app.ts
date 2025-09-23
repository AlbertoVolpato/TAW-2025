import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";
import dotenv from "dotenv";

import { connectDatabase } from "./config/database";
import { checkDatabaseConnection } from "./middleware/dbCheck";
import indexRouter from "./routes/index";
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import airportsRouter from "./routes/airports";
import airlinesRouter from "./routes/airlines";
import routesRouter from "./routes/routes";
import aircraftRouter from "./routes/aircraft";
import flightsRouter from "./routes/flights";
import paymentsRouter from "./routes/payments";
import bookingsRouter from "./routes/bookings";
import systemRouter from "./routes/system";
import adminRouter from "./routes/admin";

// Load environment variables (don't override existing ones)
dotenv.config({ override: false });

const app = express();

// Connect to database
connectDatabase();

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:4200",
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(logger("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, "../public")));

// View engine setup (for error pages)
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");

// Database connection check middleware
app.use("/api", checkDatabaseConnection);

// Routes
app.use("/api", indexRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/airports", airportsRouter);
app.use("/api/airlines", airlinesRouter);
app.use("/api/routes", routesRouter);
app.use("/api/aircraft", aircraftRouter);
app.use("/api/flights", flightsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/admin/system", systemRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

export default app;
