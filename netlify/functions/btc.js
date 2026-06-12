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
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true"
      );
      const d = await res.json();
      return new Response(JSON.stringify({
        price: d.bitcoin.usd,
        change24h: d.bitcoin.usd_24h_change,
      }), { headers });
    }

    if (type === "klines") {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=210&interval=daily"
      );
      const d = await res.json();
      const closes = d.prices.map(p => p[1]);
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

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
  }
};

export const config = { path: "/netlify/functions/btc" };
