module.exports.ask = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const userMessage = body.text || "Say hello.";

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          reply: "OpenAI call failed",
          error: "Missing OPENAI_API_KEY in environment"
        })
      };
    }

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: userMessage
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          reply: "OpenAI call failed",
          error: data?.error?.message || `HTTP ${res.status}`
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: data.output_text || "No response"
      })
    };
  } catch (err) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: "OpenAI call failed",
        error: err.message
      })
    };
  }
};
