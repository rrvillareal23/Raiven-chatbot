import dotenv from "dotenv";
import { OpenAI } from "openai";
import express from "express";
import fs from "fs";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
const PORT = 5501;

app.use(express.json());

let vectorStoreId = null;
let assistantId = null;
let funMode = true;

// Delay function to pause between retries
const delay = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));

// Retry mechanism
const retryOperation = async (operation, retries = 3, delaySeconds = 10) => {
  let attempts = 0;
  while (attempts < retries) {
    try {
      return await operation();
    } catch (error) {
      attempts++;
      console.error(`Attempt ${attempts} failed: ${error.message}`);
      if (attempts < retries) {
        console.log(`Retrying in ${delaySeconds} seconds...`);
        await delay(delaySeconds);
      } else {
        throw new Error(`Operation failed after ${retries} attempts`);
      }
    }
  }
};

// Upload file with retry logic
const uploadFile = async (filePath) => {
  return await retryOperation(async () => {
    const fileStream = fs.createReadStream(filePath);
    const response = await openai.files.create({
      purpose: "assistants",
      file: fileStream,
    });
    console.log(`Uploaded: ${filePath}, ID: ${response.id}`);
    return response.id;
  });
};

// Create vector store with retry logic
const createVectorStore = async (fileIds) => {
  return await retryOperation(async () => {
    const vectorStore = await openai.beta.vectorStores.create({
      file_ids: fileIds,
    });
    console.log(`Vector Store Created: ID - ${vectorStore.id}`);
    return vectorStore.id;
  });
};

// Create assistant with retry logic
const createAssistant = async (vectorStoreId) => {
  return await retryOperation(async () => {
    const assistant = await openai.beta.assistants.create({
      instructions:
        "You have access to two documents Emporia Guide EV Charger Technical Specifications. These documents contain all the information you need to answer user questions. Important: Do not guess or provide answers that aren't explicitly found in the documents.",
      name: "Emporia EV Assistant",
      tools: [{ type: "file_search" }],
      tool_resources: { file_search: { vector_store_ids: [vectorStoreId] } },
      model: "gpt-4o",
    });
    console.log(`Assistant Created: ID - ${assistant.id}`);
    return assistant.id;
  });
};

// Endpoint to initialize the system
app.post("/api/initialize", async (req, res) => {
  try {
    if (!vectorStoreId || !assistantId) {
      const files = [
        "./files/EmporiaGuide.pdf",
        "./files/EV-Charger-Technical-Specs_1.pdf",
      ];

      const fileIds = await Promise.all(files.map(uploadFile));
      vectorStoreId = await createVectorStore(fileIds);
      assistantId = await createAssistant(vectorStoreId);

      console.log("System initialized successfully!");
    }

    res.json({
      message: "System initialized successfully!",
      vectorStoreId,
      assistantId,
    });
  } catch (error) {
    console.error("System initialization failed:", error.message);
    res.status(500).json({ error: "System initialization failed." });
  }
});

// Endpoint to toggle fun mode
app.post("/api/toggle-fun-mode", (req, res) => {
  const { mode } = req.body;
  console.log("Toggle request received with mode:", mode);

  if (typeof mode !== "boolean") {
    console.error("Invalid mode:", mode);
    return res
      .status(400)
      .json({ error: "Mode must be a boolean (true or false)." });
  }

  funMode = mode;
  console.log(`Fun mode is now: ${funMode}`);
  res.json({ message: `Fun mode is now ${funMode ? "ON" : "OFF"}.` });
});

// Endpoint to ask a question
app.post("/api/ask", async (req, res) => {
  const { question, funMode } = req.body;

  if (!question)
    return res.status(400).json({ error: "Question is required." });
  if (!assistantId)
    return res.status(500).json({ error: "Assistant not initialized." });

  try {
    const systemMessage = funMode
      ? "You are a knowledgeable assistant with access to two documents: the Emporia Guide and the EV Charger Technical Specifications. Your job is to provide clear and precise answers based solely on these documents. Use friendly language and include emojis for engagement. ⚡😊"
      : "You are a knowledgeable assistant with access to two documents: the Emporia Guide and the EV Charger Technical Specifications. Your job is to provide clear and precise answers based solely on these documents. Avoid using emojis or unnecessary language.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: question },
      ],
    });

    const answer = response.choices[0].message.content.trim();
    res.json({ answer });
  } catch (error) {
    console.error("Error querying assistant:", error.message);
    res.status(500).json({ error: "Failed to process the request." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
