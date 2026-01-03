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
const resourceRoutes = require("./routes/resource.routes");
const customerBookingRoutes = require("./routes/customerBooking.routes");
const appointmentDiscoveryRoutes = require("./routes/appointmentDiscovery.routes");
const adminRoutes = require("./routes/admin.routes");
const appointmentTypeRoutes = require("./routes/appointmentType.routes");
const organizerRoutes = require("./routes/organizer.routes");
const { notFoundHandler, errorHandler } = require("./middlewares/errorHandler");
const { connectDB } = require("./config/db");

const app = express();
const port = process.env.PORT || 5000;

/* -------------------- MIDDLEWARE -------------------- */
app.use(helmet());

// CORS: allow local dev and production Vercel frontend (can be extended via ALLOWED_ORIGINS env)
// Example: ALLOWED_ORIGINS="http://localhost:3000,https://your-app.vercel.app"
const allowedOrigins = (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://odoo-appointment-booking-n5n1.vercel.app'
]);
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS policy does not allow access from this origin'));
  },
  credentials: true,
}));
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
app.use("/api/v1/appointments", appointmentDiscoveryRoutes);
app.use("/api/v1/organiser/resources", resourceRoutes);
app.use("/api/v1/customer/bookings", customerBookingRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/organiser/appointment-types", appointmentTypeRoutes);
app.use("/api/v1/organiser", organizerRoutes);

/* -------------------- ERRORS -------------------- */
app.use(notFoundHandler);
app.use(errorHandler);

/* -------------------- SERVER -------------------- */
app.listen(port, () => {
  console.log(`🚀 API listening on port ${port}`);
});
