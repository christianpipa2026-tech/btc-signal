exports.handler = async function(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  try {
    const type = event.queryStringParameters?.type || "price";

    if (type === "price") {
      const res = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT");
      const d = await res.json();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          price: parseFloat(d.lastPrice),
          change24h: parseFloat(d.priceChangePercent),
          high24h: parseFloat(d.highPrice),
          low24h: parseFloat(d.lowPrice),
          volume: parseFloat(d.volume)
        })
      };
    }

    if (type === "klines") {
      const res = await fetch("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=210");
      const klines = await res.json();
      const closes = klines.map(k => parseFloat(k[4]));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ closes })
      };
    }

    if (type === "fng") {
      const res = await fetch("https://api.alternative.me/fng/?limit=1");
      const d = await res.json();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          value: parseInt(d.data[0].value),
          label: d.data[0].value_classification
        })
      };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: "tipo inválido" }) };

  } catch(e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: e.message })
    };
  }
};
