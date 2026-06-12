export default async (request) => {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "price";

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    if (type === "price") {
      const res = await fetch(
        "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT",
        { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } }
      );
      const text = await res.text();
      // Devolver respuesta cruda para diagnóstico
      return new Response(text, { headers });
    }

    if (type === "klines") {
      const res = await fetch(
        "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=3",
        { headers: { "User-Agent": "Mozilla/5.0" } }
      );
      const text = await res.text();
      return new Response(text, { headers });
    }

    if (type === "fng") {
      const res = await fetch("https://api.alternative.me/fng/?limit=1");
      const text = await res.text();
      return new Response(text, { headers });
    }

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
};

export const config = { path: "/netlify/functions/btc" };
