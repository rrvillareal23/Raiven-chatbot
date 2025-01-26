import dotenv from "dotenv";
import { OpenAI } from "openai";
import express from "express";
import readline from "readline";
const app = express();

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(express.json());

const vectorStoreId = process.env.VECTOR_STORE_ID;
let assistantId = process.env.ASSISTANT_ID;
const PORT = 5500;
let funMode = true;

const initializeSystem = async () => {
  if (assistantId) {
    try {
      console.log(`Checking the status of assistant ID: ${assistantId}`);
      const assistant = await openai.beta.assistants.retrieve(assistantId);
      console.log("Assistant is active and ready to use.");
      return assistantId;
    } catch (error) {
      if (error.status === 404) {
        console.warn(
          "Assistant ID not found or inactive. Creating a new assistant..."
        );
      } else {
        console.error("Error checking assistant status:", error.message);
        process.exit(1);
      }
    }
  }
};

app.post("/api/ask", async (req, res) => {
  const { question, funMode } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required." });
  }
  if (typeof funMode !== "boolean") {
    return res
      .status(400)
      .json({ error: "funMode must be a boolean (true or false)." });
  }
  if (!assistantId) {
    return res.status(500).json({ error: "Assistant not initialized." });
  }

  try {
    const currentSystemMessage = funMode
      ? "You are a knowledgeable assistant with access to two documents: the Emporia Guide and the EV Charger Technical Specifications. Use friendly language and include alot ofemojis for engagement when answer questions. ⚡😊"
      : "You are a knowledgeable assistant with access to two documents: the Emporia Guide and the EV Charger Technical Specifications. Avoid using emojis or unnecessary language.";

    const thread = await openai.beta.threads.create();
    console.log("Thread created. Thread ID:", thread.id);

    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: question,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
      instructions: currentSystemMessage,
    });

    let response;
    while (true) {
      response = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      if (response.status === "completed") {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const messages = await openai.beta.threads.messages.list(thread.id);

    const assistantMessages = messages.data.filter(
      (msg) => msg.role === "assistant"
    );
    const assistantResponse = assistantMessages
      .map((msg) => msg.content[0].text.value)
      .join("\n");

    res.json({ answer: assistantResponse });
  } catch (error) {
    console.error("Error querying assistant:", error.message);
    res.status(500).json({ error: "Failed to process the request." });
  }
});

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  try {
    await initializeSystem();
    console.log("System initialized successfully!");
  } catch (error) {
    console.error("System initialization failed:", error.message);
  }
});
