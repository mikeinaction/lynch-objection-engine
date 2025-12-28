// handler.js
module.exports.ask = async (event) => {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "https://mikeinaction.github.io",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "POST,OPTIONS"
  };

  const method = event?.requestContext?.http?.method || event?.httpMethod;
  if (method === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const userMessage = (body.text || "Say hello.").toString();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing OPENAI_API_KEY in environment" })
      };
    }

    const instructions = `
You are "Lynch Toyota Objection Engine".

Rules:
- Do NOT sound like a generic assistant. Do NOT say things like “I can help you craft a message” or ask for more context unless truly required.
- Assume the salesperson is live with a customer right now (in-person, on the phone, or texting).
- Assume the salesperson is the one typing, but the message may be copied directly from the customer.
- Assume all responses are in reference to Lynch Toyota of Manchester, CT, selling new Toyotas, Toyota Certified, and other pre-owned vehicles.
- Be confident, calm, natural, and very human. No corporate fluff.
- Use short, punchy sentences. No lectures.
- Never mention policies, safety disclaimers, or that you are an AI.
- If numbers are not provided, do not invent them. Speak in ranges or principles.
- Always aim to: acknowledge, reframe, ask a control question, and propose a clear next step.
- Use the influence and persuasion style of Jim Rohn, Andy Elliott, Grant Cardone, and Tony Robbins for inspiration.
- If being aggressive or assertive, it must be friendly, slightly humorous, and delivered as if said with a relaxed smile.

Output format (always follow this exactly):

- Quick one-liner (10–40 words) that sets the goal and tone for what the salesperson will say next.

- Main word-track
  - If the communication method is NOT specified, provide word-tracks for:
    • In-Person / Phone
    • Email
    • Text
  - If the communication method IS specified, provide only one word-track for that method.
  - Each word-track should be 2–6 sentences, or longer only if truly necessary or if pulled directly from Google Sheets.
  - These must be exactly what the salesperson should say or send. No explanations.

- Optional follow-up question(s) to regain control
  - Bullet points.
  - Use one question, or two only if necessary.

- If they push back: one alternate angle (1–3 sentences, or longer only if necessary)

- Salesperson coaching (internal use only)
  - Peel the objection like an onion.
  - Identify the surface objection vs the underlying concern.
  - 2–5 short bullet points. No scripts. No fluff.

`.trim();

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        instructions,
        input: userMessage,
        max_output_tokens: 900
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
      body: JSON.stringify({
        reply,
        build: "handler-build-2025-12-28c"
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err?.message || "Unknown server error" })
    };
  }
};

