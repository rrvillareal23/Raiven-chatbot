import dotenv from "dotenv";
dotenv.config();
const backend = process.env.BACKEND;

export async function POST(request) {
  try {
    const { question, funMode } = await request.json();

    // Validate question presence
    if (!question) {
      console.error("Question is missing in request body.");
      return new Response(JSON.stringify({ error: "Question is required." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Send the question and funMode to the backend
    const response = await fetch(`http://localhost:5500/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, funMode }),
    });

    // Handle error response from backend
    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Backend error: ${response.status} ${response.statusText}. Details: ${errorText}`
      );
      return new Response(
        JSON.stringify({
          error: `Failed to fetch response from backend: ${response.statusText}`,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    console.log("Backend response data:", data);

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in API route:", error.message);
    return new Response(JSON.stringify({ error: "Internal server error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
