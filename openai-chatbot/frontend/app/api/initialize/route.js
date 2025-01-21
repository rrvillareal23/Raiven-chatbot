import dotenv from "dotenv";
dotenv.config();
const backend = process.env.BACKEND;

export async function POST(request) {
  try {
    const response = await fetch(`${backend}/api/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Backend error: ${response.status} ${response.statusText}. Details: ${errorText}`
      );
      return new Response(
        JSON.stringify({
          error: `Failed to initialize system: ${response.statusText}`,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    console.log("Backend initialization response:", data);

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

