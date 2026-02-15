import express from "express";
import cors from "cors";
import dotenv from "dotenv"; // Import dotenv
import connectDB from "./db.js";
import studentRoutes from "./routes/studentRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import aiRoutes from "./routes/aiRoutes.js"; // Import API routes

dotenv.config(); // Load env vars

const app = express();

// 2. Use the cors middleware BEFORE your routes
// This tells your server to allow requests from any website.
app.use(cors());

app.use(express.json());
connectDB();

app.get("/", (req, res) => res.send("📚 Library Attendance System Backend Running"));
app.use("/api/students", studentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/ai", aiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));