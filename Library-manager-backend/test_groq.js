import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

async function testGroq() {
    try {
        console.log("Checking API Key...");
        const apiKey = process.env.GROQ_API_KEY;
        
        if (!apiKey || apiKey.includes("PASTE_YOUR_GROQ_API_KEY")) {
            console.error("❌ Invalid or missing GROQ_API_KEY in .env");
            return;
        }

        console.log("Initializing Groq...");
        const groq = new Groq({ apiKey });

        console.log("Sending a test prompt to Groq (Llama 3)...");
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: "Reply with 'Groq AI is alive and well!' if you can read this." }],
            model: "llama-3.1-8b-instant",
        });
        
        console.log("-----------------------------------------");
        console.log("✅ SUCCESS! The AI replied:");
        console.log(chatCompletion.choices[0]?.message?.content || "");
        console.log("-----------------------------------------");
        
    } catch (error) {
        console.error("❌ FAILED to connect to Groq API. Error Details:");
        console.error(error.message);
    }
}

testGroq();
