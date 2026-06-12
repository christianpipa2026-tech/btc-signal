const cache = {};

async function cached(key, ttlMs, fetchFn) {
  const now = Date.now();
  if (cache[key] && (now - cache[key].ts) < ttlMs) {
    return cache[key].data;
  }
  const data = await fetchFn();
  cache[key] = { data, ts: now };
  return data;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

exports.handler = async function(event) {
  const type = (event.queryStringParameters && event.queryStringParameters.type) || "price";

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {

    if (type === "price") {
      const data = await cached("price", 10000, async () => {
        const res = await fetch("https://api.kraken.com/0/public/Ticker?pair=XBTUSD");
        if (!res.ok) throw new Error("Kraken HTTP " + res.status);
        const d = await res.json();
        if (d.error && d.error.length > 0) throw new Error("Kraken: " + d.error[0]);
        const ticker = d.result.XXBTZUSD;
        const price = parseFloat(ticker.c[0]);
        const open = parseFloat(ticker.o);
        const change24h = ((price - open) / open) * 100;
        return { price, change24h: parseFloat(change24h.toFixed(4)) };
      });
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    if (type === "klines") {
      const data = await cached("klines", 300000, async () => {
        let lastErr;
        for (let i = 0; i < 3; i++) {
          try {
            if (i > 0) await sleep(2000 * i);
            const res = await fetch(
              "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=210&interval=daily",
              { headers: { "Accept": "application/json" } }
