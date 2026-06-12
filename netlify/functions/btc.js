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

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export default async (request) => {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "price";

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
      return new Response(JSON.stringify(data), { headers });
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
            );
            if (!res.ok) throw new Error("CoinGecko HTTP " + res.status);
            const d = await res.json();
            if (!d.prices || d.prices.length < 50) throw new Error("Datos insuficientes");
            return { closes: d.prices.map(p => p[1]) };
          } catch(e) {
            lastErr = e;
          }
        }
        throw lastErr;
      });
      return new Response(JSON.stringify(data), { headers });
    }

    if (type === "fng") {
      const data = await cached("fng", 3600000, async () => {
        const res = await fetch("https://api.alternative.me/fng/?limit=1");
        if (!res.ok) throw new Error("FNG HTTP " + res.status);
        const d = await res.json();
        return {
          value: parseInt(d.data[0].value),
          label: d.data[0].value_classification,
        };
      });
      return new Response(JSON.stringify(data), { headers });
    }

    return new Response(JSON.stringify({ erro
