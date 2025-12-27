module.exports.ask = async (event) => {
  try {
    // Use built-in fetch on Node 18. If not available, fall back to undici safely.
    let fetchFn = globalThis.fetch;
    if (!fetchFn) {
      const undici = require("undici");
      fetchFn = undici.fetch;
    }

    const body = JSON.parse(event.body || "{}");
    const userMessage = body.text || "Say hello.";

    const apiKey = process.env.OPENAI_API_KEY;
    console.log("HAS OPENAI_API_KEY:", Boolean(apiKey));

    if (!apiKey) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          reply: "OpenAI call failed",
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
        statusCode: 200,
        body: JSON.stringify({
          reply: "OpenAI call failed",
          error: data?.error?.message || `HTTP ${res.status}`
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
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    console.log("HANDLER ERROR:", err);
    return {
      statusCode: 200,
      body: JSON.stringify({
        reply: "OpenAI call failed",
        error: err.message
      })
    };
  }
};
