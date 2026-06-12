export default async (request) => {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "price";

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    if (type === "price") {
      const res = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT");
      const d = await res.json();
      return new Response(JSON.stringify({
        price: parseFloat(d.lastPrice),
        change24h: parseFloat(d.priceChangePercent),
        high24h: parseFloat(d.highPrice),
        low24h: parseFloat(d.lowPrice),
      }), { headers });
    }

    if (type === "klines") {
      const res = await fetch("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=210");
      const klines = await res.json();
      const closes = klines.map(k => parseFloat(k[4]));
      return new Response(JSON.stringify({ closes }), { headers });
    }

    if (type === "fng") {
      const res = await fetch("https://api.alternative.me/fng/?limit=1");
      const d = await res.json();
      return new Response(JSON.stringify({
        value: parseInt(d.data[0].value),
        label: d.data[0].value_classification,
      }), { headers });
    }

    return new Response(JSON.stringify({ error: "tipo inválido" }), { status: 400, headers });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
};

export const config = { path: "/netlify/functions/btc" };
