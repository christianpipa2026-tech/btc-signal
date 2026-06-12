// Cache para klines y fng (cambian lento)
let cache = {};
const CACHE_MS = 300000; // 5 minutos para datos históricos

async function fetchWithCache(key, fetchFn) {
  const now = Date.now();
  if (cache[key] && (now - cache[key].time) < CACHE_MS) {
    return cache[key].data;
  }
  const data = await fetchFn();
  cache[key] = { data, time: now };
  return data;
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
      // Kraken da precio exacto con decimales, sin restricciones
      const res = await fetch("https://api.kraken.com/0/public/Ticker?pair=XBTUSD");
      if (!res.ok) throw new Error("Kraken error: " + res.status);
      const d = await res.json();
      const ticker = d.result.XXBTZUSD;
      const price = parseFloat(ticker.c[0]);
      const open = parseFloat(ticker.o);
      const change24h = ((price - open) / open) * 100;
      return new Response(JSON.stringify({
        price: price,
        change24h: parseFloat(change24h.toFixed(4)),
      }), { headers });
    }

    if (type === "klines") {
      const data = await fetchWithCache("klines", async () => {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=210&interval=daily",
          { headers: { "Accept": "application/json" } }
        );
        if (!res.ok) throw new Error("CoinGecko klines: " + res.status);
        const d = await res.json();
        return { closes: d.prices.map(p => p[1]) };
      });
      return new Response(JSON.stringify(data), { headers });
    }

    if (type === "fng") {
      const data = await fetchWithCache("fng", async () => {
        const res = await fetch("https://api.alternative.me/fng/?limit=1");
        if (!res.ok) throw new Error("FNG: " + res.status);
        const d = await res.json();
        return { value: parseInt(d.data[0].value), label: d.data[0].value_classification };
      });
      return new Response(JSON.stringify(data), { headers });
    }

    return new Response(JSON.stringify({ error: "tipo invalido" }), { status: 400, headers });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
};

export const config = { path: "/netlify/functions/btc" };
