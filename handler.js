module.exports.ask = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const userMessage = body.text || "Say hello.";

    const OpenAI = require("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: userMessage
    });

    const output = response.output_text || "No response";

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: output })
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
