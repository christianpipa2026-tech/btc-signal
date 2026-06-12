export default async (request) => {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "price";

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  const binanceHeaders = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json",
  };

  try {
    if (type === "price") {
      const res = await fetch(
        "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT",
        { headers: binanceHeaders }
      );
      const text = await res.text();
      const d = JSON.parse(text);
      return new Response(JSON.stringify({
        price: parseFloat(d.lastPrice),
        change24h: parseFloat(d.priceChangePercent),
        high24h: parseFloat(d.highPrice),
        low24h: parseFloat(d.lowPrice),
      }), { headers });
    }

    if (type === "klines") {
      const res = await fetch(
        "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=210",
        { headers: binanceHeaders }
      );
      const text = await res.text();
      const klines = JSON.parse(text);
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
    return new Response(JSON.stringify({ error: e.message, stack: e.stack }), { status: 500, headers });
  }
};

export const config = { path: "/netlify/functions/btc" };
