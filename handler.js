module.exports.ask = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({ reply: "ask endpoint is live" })
  };
};
