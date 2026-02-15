import mongoose from "mongoose";
import dotenv from "dotenv";
import Student from "./models/studentModel.js";
import Attendance from "./models/attendanceModel.js";
import connectDB from "./db.js";

dotenv.config();

// Helpers
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
};

const seedData = async () => {
    try {
        await connectDB();

        // 1. Fetch Existing Students
        const students = await Student.find({});
        if (students.length === 0) {
            console.log("❌ No students found in database. Please add students via the frontend first.");
            process.exit();
        }
        console.log(`✅ Found ${students.length} existing students.`);

        // 2. Clear ONLY Attendance
        console.log("🧹 Clearing ONLY attendance logs...");
        await Attendance.deleteMany({});

        console.log("📅 Generating Attendance Logs for existing students...");
        const logs = [];
        const today = new Date();

        // 3. Assign patterns based on index
        students.forEach((student, index) => {
            const pattern = index % 4; // 0: Morning, 1: Night, 2: Weekend, 3: Sporadic

            if (pattern === 0) {
                // Morning Person (Last 7 days)
                for (let i = 0; i < 7; i++) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);

                    const inTime = new Date(date);
                    inTime.setHours(9, getRandomInt(0, 15), 0, 0); // ~9:00 AM
                    const outTime = new Date(date);
                    outTime.setHours(13, getRandomInt(0, 30), 0, 0); // ~1:00 PM
                    const durationMs = outTime - inTime;

                    logs.push({
                        rollNumber: student.rollNumber,
                        cardId: student.cardId,
                        name: student.name,
                        branch: student.branch || "GEN",
                        inTime,
                        outTime,
                        duration: formatDuration(durationMs),
                        date: inTime.toDateString()
                    });
                }
            }
            else if (pattern === 1) {
                // Night Owl (Last 5 days)
                for (let i = 0; i < 5; i++) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);

                    const inTime = new Date(date);
                    inTime.setHours(19, getRandomInt(0, 45), 0, 0); // ~7:00 PM
                    const outTime = new Date(date);
                    outTime.setHours(23, 0, 0, 0); // ~11:00 PM
                    const durationMs = outTime - inTime;

                    logs.push({
                        rollNumber: student.rollNumber,
                        cardId: student.cardId,
                        name: student.name,
                        branch: student.branch || "GEN",
                        inTime,
                        outTime,
                        duration: formatDuration(durationMs),
                        date: inTime.toDateString()
                    });
                }
            }
            else if (pattern === 2) {
                // Weekend Warrior (Past 3 weekends)
                for (let i = 0; i < 20; i++) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    const day = date.getDay();
                    if (day === 0 || day === 6) {
                        const inTime = new Date(date);
                        inTime.setHours(11, 0, 0, 0);
                        const outTime = new Date(date);
                        outTime.setHours(17, 0, 0, 0);
                        logs.push({
                            rollNumber: student.rollNumber,
                            cardId: student.cardId,
                            name: student.name,
                            branch: student.branch || "GEN",
                            inTime,
                            outTime,
                            duration: "6h 0m",
                            date: inTime.toDateString()
                        });
                    }
                }
            }
            else {
                // Sporadic / Sparse (1 log a while ago)
                const oldDate = new Date(today);
                oldDate.setDate(oldDate.getDate() - 15);
                logs.push({
                    rollNumber: student.rollNumber,
                    cardId: student.cardId,
                    name: student.name,
                    branch: student.branch || "GEN",
                    inTime: oldDate,
                    outTime: new Date(oldDate.getTime() + 7200000), // 2 hours
                    duration: "2h 0m",
                    date: oldDate.toDateString()
                });
            }
        });

        await Attendance.insertMany(logs);

        console.log(`✅ Generated ${logs.length} attendance logs for ${students.length} students.`);
        process.exit();
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedData();
