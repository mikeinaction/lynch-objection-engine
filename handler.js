const { google } = require("googleapis");

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
    const userMessage = (body.text || "").toString();

    const openaiKey = process.env.OPENAI_API_KEY;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const saKeyB64 = process.env.GOOGLE_SA_KEY_B64;

    if (!openaiKey || !sheetId || !saKeyB64) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing environment variables" })
      };
    }

    const saKey = JSON.parse(Buffer.from(saKeyB64, "base64").toString("utf8"));

    const auth = new google.auth.JWT({
      email: saKey.client_email,
      key: saKey.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    });

    const sheets = google.sheets({ version: "v4", auth });

    const sheetRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Objections!A:I"
    });

    const rows = sheetRes.data.values || [];
    if (rows.length < 2) {
      throw new Error("Sheet has no data");
    }

    const headers = rows[0];
    const data = rows.slice(1).map((r) =>
      headers.reduce((o, h, i) => {
        o[h] = r[i] || "";
        return o;
      }, {})
    );

    const msg = userMessage.toLowerCase();
    const match = data.find((r) => {
      const objection = (r["Objection"] || "").toLowerCase().trim();
      return objection && msg.includes(objection);
    });

    if (!match) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          reply: "I couldn’t find that objection in the sheet yet."
        })
      };
    }

    // NOTE: Your sheet header is currently "Test Response".
    // If you rename it to "Text Response" in Google Sheets, change this one line accordingly.
    const prompt =
      "Customer said:\n" + userMessage + "\n\n" +
      "Matched objection:\n" + (match["Objection"] || "") + "\n\n" +
      "Goal:\n" + (match["Goal or Internal Framing"] || "") + "\n\n" +
      "Tone:\n" + (match["Tone Lock"] || "") + "\n\n" +
      "In Person:\n" + (match["In Person Response"] || "") + "\n\n" +
      "Phone:\n" + (match["Phone Response"] || "") + "\n\n" +
      "Email:\n" + (match["Email Response"] || "") + "\n\n" +
      "Text:\n" + (match["Test Response"] || "") + "\n\n" +
      "Rules:\n" + (match["Rules for AI"] || "") + "\n\n" +
      "Additional coaching:\n" + (match["Additional Training for Salesperson"] || "");

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
        max_output_tokens: 700
      })
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({
          error: json?.error?.message || `OpenAI HTTP ${res.status}`
        })
      };
    }

    // Robust extraction so we don't lose text if output_text isn't present
    const reply =
      json.output_text ||
      (Array.isArray(json?.output)
        ? json.output
            .flatMap((o) => (Array.isArray(o?.content) ? o.content : []))
            .map((c) => c?.text)
            .filter(Boolean)
            .join(" ")
        : "") ||
      "No response generated.";

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ reply, source: "google-sheet" })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message })
    };
  }
};

