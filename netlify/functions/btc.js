// Cache para evitar rate limit de CoinGecko
let cache = {};
const CACHE_MS = 60000; // 1 minuto

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
      const data = await fetchWithCache("price", async () => {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
          { headers: { "Accept": "application/json" } }
        );
        if (!res.ok) throw new Error("HTTP " + res.status);
        const d = await res.json();
        return { price: d.bitcoin.usd, change24h: d.bitcoin.usd_24h_change };
      });
      return new Response(JSON.stringify(data), { headers });
    }

    if (type === "klines") {
      const data = await fetchWithCache("klines", async () => {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=210&interval=daily",
          { headers: { "Accept": "application/json" } }
        );
        if (!res.ok) throw new Error("HTTP " + res.status);
        const d = await res.json();
        return { closes: d.prices.map(p => p[1]) };
      });
      return new Response(JSON.stringify(data), { headers });
    }

    if (type === "fng") {
      const data = await fetchWithCache("fng", async () => {
        const res = await fetch("https://api.alternative.me/fng/?limit=1");
        if (!res.ok) throw new Error("HTTP " + res.status);
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
