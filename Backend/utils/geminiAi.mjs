import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to simulate a delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const googleGeminiAiResponse = async (prompt, retries = 3, initialDelayMs = 1000) => {
    if (!prompt) {
        throw new Error("Prompt is required for Gemini API call.");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    for (let i = 0; i < retries; i++) {
        try {
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            });

            const response = await result.response;
            const text = await response.text();

            return text;

        } catch (error) {
            console.error(`Attempt ${i + 1} failed: Error calling Gemini API:`, error.message);

            // Check if it's a 429 (Too Many Requests) error
            if (error.status === 429 && i < retries - 1) {
                const retryAfterSeconds = error.errorDetails?.[2]?.retryDelay ?
                    parseInt(error.errorDetails[2].retryDelay.replace('s', '')) :
                    (initialDelayMs / 1000) * Math.pow(2, i); // Exponential backoff

                console.warn(`Rate limit hit (429). Retrying in ${retryAfterSeconds} seconds...`);
                await delay(retryAfterSeconds * 1000); // Convert to milliseconds
            } else if (error.status === 500 && i < retries - 1) {
                // Basic retry for 500 errors as well
                const currentDelay = initialDelayMs * Math.pow(2, i);
                console.warn(`Server error (500). Retrying in ${currentDelay / 1000} seconds...`);
                await delay(currentDelay);
            } else {
                // Re-throw if it's not a retriable error, or if max retries reached
                console.error("Failed to get Gemini API response after retries.");
                throw new Error(`Gemini API Error: ${error.message || "An unexpected error occurred."}`);
            }
        }
    }
    // If all retries fail
    throw new Error("Failed to get Gemini API response after multiple retries due to persistent issues.");
};