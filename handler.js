module.exports.ask = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "ask endpoint is live"
    })
  };
};
