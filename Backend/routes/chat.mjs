import express from "express";
import Thread from "../models/Thread.mjs";
import { googleGeminiAiResponse } from "../utils/geminiAi.mjs";
import { v4 as uuidv4 } from "uuid";
import ensureAuthenticated from '../middleware/authMiddleware.mjs'; // Import middleware

const router = express.Router();

/* 🔧 1. Test Route (REMOVE or make private if not needed) */
// router.post("/test", async (req, res) => { /* ... */ });

/* 🔧 2. Get All Threads (Protected and by User) */
router.get("/threads", ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id; // Get user ID from authenticated request
        const AllChat = await Thread.find({ userId: userId }).sort({ updatedAt: -1 });
        res.json(AllChat);
    } catch (error) {
        console.error("Error fetching threads:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/* 🔧 3. Get a Specific Thread by threadId (Protected and by User) */
router.get("/threads/:threadId", ensureAuthenticated, async (req, res) => {
    const { threadId } = req.params;
    const userId = req.user.id; // Get user ID from authenticated request
    try {
        const thread = await Thread.findOne({ threadId, userId: userId }); // Find by threadId AND userId
        if (!thread) {
            return res.status(404).json({ error: "Thread not found or you don't have access" });
        }
        res.json(thread.messages); // Return just messages for the frontend to display
    } catch (error) {
        console.error("Error fetching thread:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/* 🔧 4. Delete a Specific Thread (Protected and by User) */
router.delete("/threads/:threadId", ensureAuthenticated, async (req, res) => {
    const { threadId } = req.params;
    const userId = req.user.id; // Get user ID from authenticated request
    try {
        const result = await Thread.deleteOne({ threadId, userId: userId }); // Delete by threadId AND userId
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Thread not found or you don't have access" });
        }
        res.status(200).json({ message: "Thread deleted successfully" });
    } catch (error) {
        console.error("Error deleting thread:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

/* 🔧 5. Create or Update a Chat Thread (Protected and by User) */
router.post("/chat", ensureAuthenticated, async (req, res) => {
    const { threadId, messages } = req.body;
    const userId = req.user.id; // Get user ID from authenticated request

    try {
        let thread;
        let newThreadCreated = false;

        if (threadId) {
            // Attempt to find an existing thread for this user
            thread = await Thread.findOne({ threadId, userId: userId });
        }

        const Answer = await googleGeminiAiResponse(messages);

        if (!thread) {
            // If no threadId was provided, or if the provided threadId wasn't found for THIS user, create a new thread
            const newGeneratedThreadId = uuidv4();
            const title = Answer.split(" ").slice(0, 4).join(" ") || "New Chat";

            thread = new Thread({
                threadId: newGeneratedThreadId,
                userId: userId, // Assign the thread to the current user
                title: title,
                messages: [],
            });
            newThreadCreated = true;
        }

        thread.messages.push({ role: "user", content: messages, timestamp: new Date() });
        thread.messages.push({ role: "model", content: Answer, timestamp: new Date() });

        if (newThreadCreated && Answer) {
            thread.title = Answer.split(" ").slice(0, 4).join(" ") || "New Chat";
        }

        thread.updatedAt = new Date();
        await thread.save();

        res.status(200).json({ Answer, thread });
    } catch (error) {
        console.error("Error creating/updating thread:", error);
        if (error.message.includes("Gemini API Error")) {
            return res.status(502).json({ error: "AI service unavailable. Please try again later." });
        }
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
