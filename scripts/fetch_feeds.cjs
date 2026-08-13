const fs = require('fs');
const path = require('path');
const https = require('https');

const newsSources = [
  { id: "prothomalo", url: "https://www.prothomalo.com/feed/" },
  { id: "jagonews", url: "https://www.jagonews24.com/rss/rss.xml" },
  { id: "bd24live", url: "https://www.bd24live.com/feed/" },
  { id: "ittefaq", url: "https://www.ittefaq.com.bd/feed/" },
  { id: "amarbanglabd", url: "https://www.amarbanglabd.com/feeds" },
  { id: "banglatribune", url: "https://www.banglatribune.com/feed/" },
  { id: "ekattor", url: "https://ekattor.tv/feed/" },
  { id: "indiatoday", url: "https://www.indiatoday.in/rss/home" },
  { id: "mehr", url: "https://en.mehrnews.com/rss" },
  { id: "aljazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { id: "nyt", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml" },
  { id: "nyt_home", url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml" },
  { id: "bbc_world", url: "https://feeds.bbci.co.uk/news/world/rss.xml" }
];

const destDir = path.join(__dirname, '../public/feeds');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

function fetchUrl(urlStr) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(urlStr);
    https.get(urlObj, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = new URL(redirectUrl, urlObj.origin).href;
        }
        return resolve(fetchUrl(redirectUrl));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status Code: ${res.statusCode}`));
      }
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  // 1. Fetch all standard news feeds
  for (const source of newsSources) {
    console.log(`Fetching ${source.id} from ${source.url}...`);
    try {
      const xml = await fetchUrl(source.url);
      if (xml && xml.trim().length > 0) {
        const filePath = path.join(destDir, `${source.id}.xml`);
        fs.writeFileSync(filePath, xml, 'utf8');
        console.log(`Saved ${source.id}.xml successfully.`);
      } else {
        console.warn(`Empty response for ${source.id}`);
      }
    } catch (err) {
      console.error(`Failed to fetch ${source.id}:`, err.message);
    }
  }

  // 2. Fetch and generate crypto.xml
  console.log("Fetching cryptocurrency prices from CoinLore...");
  try {
    const jsonStr = await fetchUrl("https://api.coinlore.net/api/tickers/?limit=20");
    const data = JSON.parse(jsonStr);
    let xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>Crypto Prices</title>
  <link>https://www.coinlore.com</link>
  <description>Major Cryptocurrency Prices</description>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
`;
    for (const coin of data.data || []) {
      const changeVal = parseFloat(coin.percent_change_24h || '0');
      const changeSign = changeVal >= 0 ? '+' : '';
      const price = Number(coin.price_usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const title = `${coin.name} (${coin.symbol}) - $${price}`;
      const coinData = {
        rank: coin.rank,
        price_usd: coin.price_usd,
        price_btc: coin.price_btc,
        percent_change_24h: coin.percent_change_24h,
        percent_change_1h: coin.percent_change_1h,
        percent_change_7d: coin.percent_change_7d,
        market_cap_usd: coin.market_cap_usd,
        volume24: coin.volume24,
        csupply: coin.csupply,
        msupply: coin.msupply
      };
      const descText = `Price: $${price} | 24h Change: ${changeSign}${coin.percent_change_24h}% | 1h Change: ${coin.percent_change_1h}% | Market Cap: $${Number(coin.market_cap_usd).toLocaleString()}`;
      const description = `${descText} ||JSON:${JSON.stringify(coinData)}`;
      const pubDate = new Date().toUTCString();
      xml += `  <item>
    <title>${title}</title>
    <link>https://www.coinlore.com/coin/${coin.nameid}</link>
    <description>${description}</description>
    <pubDate>${pubDate}</pubDate>
  </item>
`;
    }
    xml += `</channel>\n</rss>`;
    fs.writeFileSync(path.join(destDir, 'crypto.xml'), xml, 'utf8');
    console.log("Saved crypto.xml successfully.");
  } catch (err) {
    console.error("Failed to generate crypto.xml:", err.message);
  }
}

run();
