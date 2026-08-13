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
}

run();
