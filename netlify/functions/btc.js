const cache = {};

exports.handler = async function(event) {
  const params = event.queryStringParameters || {};
  const type = params.type || "price";

  const h = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  try {
    if (type === "price") {
      const now = Date.now();
      if (cache.price && (now - cache.price.ts) < 10000) {
        return { statusCode: 200, headers: h, body: JSON.stringify(cache.price.data) };
      }
      const res = await fetch("https://api.kraken.com/0/public/Ticker?pair=XBTUSD");
      const d = await res.json();
      const ticker = d.result.XXBTZUSD;
      const price = parseFloat(ticker.c[0]);
      const open = parseFloat(ticker.o);
      const change24h = ((price - open) / open) * 100;
      const data = { price: price, change24h: parseFloat(change24h.toFixed(4)) };
      cache.price = { data: data, ts: now };
      return { statusCode: 200, headers: h, body: JSON.stringify(data) };
    }

    if (type === "klines") {
      const now = Date.now();
      if (cache.klines && (now - cache.klines.ts) < 300000) {
        return { statusCode: 200, headers: h, body: JSON.stringify(cache.klines.data) };
      }
      const res = await fetch("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=210&interval=daily");
      const d = await res.json();
      const closes = d.prices.map(function(p) { return p[1]; });
      const data = { closes: closes };
      cache.klines = { data: data, ts: now };
      return { statusCode: 200, headers: h, body: JSON.stringify(data) };
    }

    if (type === "fng") {
      const now = Date.now();
      if (cache.fng && (now - cache.fng.ts) < 3600000) {
        return { statusCode: 200, headers: h, body: JSON.stringify(cache.fng.data) };
      }
      const res = await fetch("https://api.alternative.me/fng/?limit=1");
      const d = await res.json();
      const data = { value: parseInt(d.data[0].value), label: d.data[0].value_classification };
      cache.fng = { data: data, ts: now };
      return { statusCode: 200, headers: h, body: JSON.stringify(data) };
    }

    return { statusCode: 400, headers: h, body: JSON.stringify({ error: "tipo invalido" }) };

  } catch(e) {
    return { statusCode: 500, headers: h, body: JSON.stringify({ error: e.message }) };
  }
};
