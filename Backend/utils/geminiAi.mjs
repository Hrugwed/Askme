import "dotenv/config"; // Import dotenv/config for process.env access
import { GoogleGenerativeAI } from "@google/generative-ai";
// No axios import needed for this version as it uses the GoogleGenerativeAI SDK's native methods

// Ensure GEMINI_API_KEY is set in your .env file
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set in environment variables.");
    // In a production environment, you might want to throw an error or handle this more gracefully
    // process.exit(1); // Exiting process might be too aggressive for a web service
}

// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Function to simulate a delay for retries
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calls the Google Gemini AI to generate a response with retry logic for rate limits and server errors.
 * @param {string} prompt The user's input prompt.
 * @param {number} [retries=3] The maximum number of retry attempts.
 * @param {number} [initialDelayMs=1000] The initial delay in milliseconds before the first retry.
 * @returns {Promise<string>} The generated text response from the AI.
 * @throws {Error} If the prompt is missing, or if all retry attempts fail.
 */
export const googleGeminiAiResponse = async (prompt, retries = 3, initialDelayMs = 1000) => {
    if (!prompt) {
        throw new Error("Prompt is required for Gemini API call.");
    }

    // Use the specific model as requested by the user
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    for (let i = 0; i < retries; i++) {
        try {
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
            });

            const response = await result.response;
            const text = await response.text(); // Await the text() method

            return text;

        } catch (error) {
            console.error(`Attempt ${i + 1} failed: Error calling Gemini API:`, error.message);

            // Check if it's a retriable error and if max retries haven't been reached
            if ((error.status === 429 || error.status === 500) && i < retries - 1) {
                let retryAfterSeconds;
                if (error.status === 429 && error.errorDetails?.[2]?.retryDelay) {
                    // Extract retry-after from errorDetails if available for 429
                    retryAfterSeconds = parseInt(error.errorDetails[2].retryDelay.replace('s', ''));
                } else {
                    // Exponential backoff for other retriable errors (e.g., 500) or if 429 has no retryDelay
                    retryAfterSeconds = (initialDelayMs / 1000) * Math.pow(2, i); 
                }

                console.warn(`Retriable error (${error.status}). Retrying in ${retryAfterSeconds} seconds...`);
                await delay(retryAfterSeconds * 1000); // Convert to milliseconds for delay
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
