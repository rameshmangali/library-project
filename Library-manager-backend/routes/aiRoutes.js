import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Attendance from "../models/attendanceModel.js";
import Student from "../models/studentModel.js";

const router = express.Router();


router.get("/analyze/:cardId", async (req, res) => {
    let student = null;
    let logs = [];

    try {
        const { cardId } = req.params;

        // 1. Fetch Student Details
        student = await Student.findOne({ cardId });
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // 2. Fetch Attendance History
        logs = await Attendance.find({ cardId }).sort({ inTime: 1 });

        if (logs.length === 0) {
            return res.json({
                suggestion: `Hello ${student.name}! It looks like you haven't visited the library yet. Come drop by to start your study streak!`
            });
        }

        // 3. Format Data for AI
        const historyText = logs.map(log => {
            const date = log.inTime ? new Date(log.inTime).toDateString() : "Unknown Date";
            const duration = log.duration || "Ongoing";
            return `- ${date}: Spent ${duration}`;
        }).join("\n");

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey.startsWith("PASTE")) {
            return res.status(500).json({ message: "Server Error: GEMINI_API_KEY is missing or invalid in .env file." });
        }

        const prompt = `
      You are a friendly and encouraging library study coach.
      Analyze the following attendance history for a student named ${student.name} (${student.branch}).
      
      Attendance History:
      ${historyText}

      Give 2-3 short, personalized, and motivating suggestions to help them improve their study habits. 
      Tone: Positive, constructive, and concise. 
      Avoid generic advice; try to reference their specific patterns (e.g., if they come in the morning, encourage that).
      Output as plain text, no markdown formatting.
    `;

        // 4. Call Gemini AI
        console.log("🤖 Initializing Gemini with Key: ", process.env.GEMINI_API_KEY ? "Present (Starts with " + process.env.GEMINI_API_KEY.substring(0, 5) + ")" : "Missing");

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Switch to gemini-2.0-flash-exp to avoid quota issues with stable models
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        console.log("📤 Sending prompt to Gemini...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("✅ Received response from Gemini");

        res.json({ suggestion: text });

    } catch (error) {
        console.error("❌ AI ROUTE ERROR EXCEPTION:", error);

        // --- FALLBACK LOGIC ---
        // If API fails (Quota limit, 429, etc), we generate a localized response so the app still works.
        console.log("⚠️ Switching to Offline Fallback Mode...");

        let suggestion = `Hi ${student.name}, here are some insights based on your recent activity:\n`;

        // Simple Heuristics based on logs
        const hours = logs.map(l => l.inTime ? new Date(l.inTime).getHours() : 0);
        const morningCount = hours.filter(h => h < 12).length;
        const eveningCount = hours.filter(h => h >= 17).length;
        const weekendCount = logs.filter(l => {
            const d = l.date ? new Date(l.date).getDay() : -1;
            return d === 0 || d === 6;
        }).length;

        if (logs.length > 5 && morningCount > logs.length / 2) {
            suggestion += "🌞 You are a true Morning Bird! You are most consistent before noon. Keep capitalizing on that fresh energy.";
        } else if (logs.length > 5 && eveningCount > logs.length / 2) {
            suggestion += "🦉 You are a dedicated Night Owl. Your focus seems to peak in the evenings. Just show make sure to get enough rest!";
        } else if (weekendCount > 2) {
            suggestion += "🗓️ You are a Weekend Warrior! Great job utilizing your free time for deep work sessions.";
        } else {
            suggestion += "📉 Your schedule seems a bit sporadic. Try to pick a consistent time slot daily to build a stronger habit.";
        }

        res.json({ suggestion, isFallback: true });
    }
});

export default router;
