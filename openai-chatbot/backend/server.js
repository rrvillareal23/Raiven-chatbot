import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { OpenAI } from "openai";

// Load environment variables
dotenv.config();

// Validate required environment variables
const { OPENAI_API_KEY, VECTOR_STORE_ID, ASSISTANT_ID } = process.env;
if (!OPENAI_API_KEY || !VECTOR_STORE_ID) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

// Initialize OpenAI
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Constants
const PORT = process.env.PORT || 5501;
const DEFAULT_INSTRUCTIONS =
  "You have access to two documents. Answer questions based on these documents. Do not site sources, use markdown text, or guess.";
const FUN_INSTRUCTIONS = `${DEFAULT_INSTRUCTIONS} Use friendly language and include a lot of emojis for engagement when answering questions. ⚡😊`;

// App setup
const app = express();
app.use(express.json());
app.use(cors());

let assistantId = ASSISTANT_ID;

// Helper function to create or retrieve the assistant
const initializeAssistant = async () => {
  if (assistantId) {
    try {
      console.log(`Checking assistant ID: ${assistantId}`);
      const assistant = await openai.beta.assistants.retrieve(assistantId);
      console.log("Assistant is active and ready.");
      return assistant;
    } catch (error) {
      if (error.status === 404) {
        console.warn("Assistant ID not found. Creating a new assistant...");
      } else {
        throw new Error(`Failed to retrieve assistant: ${error.message}`);
      }
    }
  }

  try {
    const newAssistant = await openai.beta.assistants.create({
      instructions: DEFAULT_INSTRUCTIONS,
      name: "File-Based Assistant",
      tools: [{ type: "file_search" }],
      tool_resources: { file_search: { vector_store_ids: [VECTOR_STORE_ID] } },
      model: "gpt-4o-mini",
    });
    assistantId = newAssistant.id;
    console.log(`Assistant created with ID: ${assistantId}`);
    return newAssistant;
  } catch (error) {
    throw new Error(`Failed to create assistant: ${error.message}`);
  }
};

// Route: Initialize assistant
app.post("/api/initialize", async (req, res) => {
  try {
    const assistant = await initializeAssistant();
    res.status(200).json({
      message: "System initialized successfully!",
      assistantId: assistant.id || assistant,
    });
  } catch (error) {
    console.error("Error in /api/initialize:", error.message);
    res.status(500).json({ error: "System initialization failed." });
  }
});

// Route: Ask a question
app.post("/api/ask", async (req, res) => {
  const { question, funMode = false } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required." });
  }

  try {
    const instructions = funMode ? FUN_INSTRUCTIONS : DEFAULT_INSTRUCTIONS;

    // Create thread
    const thread = await openai.beta.threads.create();
    console.log("Thread created with ID:", thread.id);

    // Add user message
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: question,
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
      instructions: instructions,
    });

    // Poll for completion
    let response;
    const maxRetries = 10;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      response = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      console.log("thread run status: ", response.status);
      if (response.status === "completed") break;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    if (response.status !== "completed") {
      throw new Error("Assistant run did not complete within the retry limit.");
    }

    // Fetch assistant messages
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessages = messages.data
      .filter((msg) => msg.role === "assistant")
      .map((msg) => msg.content[0].text.value)
      .join("\n");

    res.json({ answer: assistantMessages });
  } catch (error) {
    console.error("Error in /api/ask:", error.message);
    res.status(500).json({ error: "Failed to process the request." });
  }
});

// Start the server
app.listen(PORT, async () => {
  try {
    console.log(`Server is running on http://localhost:${PORT}`);
    await initializeAssistant();
    console.log("System initialized successfully!");
  } catch (error) {
    console.error("Failed to initialize system on startup:", error.message);
  }
});
