const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '.env') });

if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined.");
  process.exit(1);
}

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const staffRoutes = require("./routes/staff.routes");
const { notFoundHandler, errorHandler } = require("./middlewares/errorHandler");
const { connectDB } = require("./config/db");

const app = express();
const port = process.env.PORT || 5000;

/* -------------------- MIDDLEWARE -------------------- */
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("combined"));

/* -------------------- DB -------------------- */
connectDB();

/* -------------------- HEALTH -------------------- */
app.get("/health", async (req, res) => {
  res.json({ status: "ok", db: "connected" });
});

/* -------------------- ROUTES -------------------- */
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/organiser/staff", staffRoutes);

/* -------------------- ERRORS -------------------- */
app.use(notFoundHandler);
app.use(errorHandler);

/* -------------------- SERVER -------------------- */
app.listen(port, () => {
  console.log(`🚀 API listening on port ${port}`);
});
