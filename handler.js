module.exports.ask = async (event) => {
  // CORS headers
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "https://mikeinaction.github.io",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "POST,OPTIONS"
  };

  // Handle CORS preflight
  const method = event?.requestContext?.http?.method || event?.httpMethod;
  if (method === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ""
    };
  }

  try {
    // Node 18 has fetch; fallback just in case
    let fetchFn = globalThis.fetch;
    if (!fetchFn) {
      const { fetch } = require("undici");
      fetchFn = fetch;
    }

    const body = JSON.parse(event.body || "{}");
    const userMessage = body.text || "Say hello.";

    const apiKey = process.env.OPENAI_API_KEY;
    console.log("HAS OPENAI_API_KEY:", Boolean(apiKey));

    if (!apiKey) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Missing OPENAI_API_KEY in environment"
        })
      };
    }

    const res = await fetchFn("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: userMessage,
        max_output_tokens: 150
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({
          error: data?.error?.message || `OpenAI HTTP ${res.status}`
        })
      };
    }

    const reply =
      data.output_text ||
      (Array.isArray(data?.output)
        ? data.output
            .flatMap((o) => (Array.isArray(o?.content) ? o.content : []))
            .map((c) => c?.text)
            .filter(Boolean)
            .join(" ")
        : "") ||
      "No response";

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    console.error("HANDLER ERROR:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: err.message || "Unknown server error"
      })
    };
  }
};

