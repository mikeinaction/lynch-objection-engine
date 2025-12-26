const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

module.exports.ask = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const userMessage = body.text || "Say hello.";

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: userMessage
    });

    const output =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text ||
      "No response";

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: output })
    };
  } catch (err) {
    console.error("ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message,
        stack: err.stack
      })
    };
  }
};
