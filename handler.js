module.exports.ping = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true })
  };
};
