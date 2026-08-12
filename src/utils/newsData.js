export const newsSources = [
  { id: "mehr", name: "Mehr News", url: "https://en.mehrnews.com/rss" },
  { id: "prothomalo", name: "Prothom Alo", url: "https://www.prothomalo.com/feed/" },
  { id: "jagonews", name: "Jago News 24", url: "https://www.jagonews24.com/rss/rss.xml" },
  { id: "bd24live", name: "BD24Live", url: "https://www.bd24live.com/feed/" },
  { id: "aljazeera", name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { id: "indiatoday", name: "India Today", url: "https://www.indiatoday.in/rss/home" },
  { id: "nyt", name: "NYT World", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml" },
  { id: "ittefaq", name: "Daily Ittefaq", url: "https://www.ittefaq.com.bd/feed/" }
];

const CORS_PROXIES = [
  "/api/rss?url=",
  "https://api.allorigins.win/raw?url=",
  "https://corsproxy.io/?url="
];

export async function fetchFeed(sourceId) {
  const source = newsSources.find(s => s.id === sourceId);
  if (!source) throw new Error("Source not found");

  // Try parsing the feed using available proxies
  let xmlText = "";
  let errorMsg = "";

  for (const proxy of CORS_PROXIES) {
    try {
      // If it is a local relative proxy, resolve it relative to current window origin, otherwise build full proxy URL
      const targetUrl = proxy.startsWith("/")
        ? window.location.origin + proxy + encodeURIComponent(source.url)
        : proxy + encodeURIComponent(source.url);

      const response = await fetch(targetUrl);
      if (response.ok) {
        xmlText = await response.text();
        break;
      } else {
        errorMsg = `HTTP error! status: ${response.status}`;
      }
    } catch (e) {
      errorMsg = e.message;
    }
  }

  if (!xmlText) {
    throw new Error(`Failed to fetch RSS feed. CORS proxy error: ${errorMsg}`);
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  const items = xmlDoc.getElementsByTagName("item");
  const articles = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const title = item.getElementsByTagName("title")[0]?.textContent || "";
    const link = item.getElementsByTagName("link")[0]?.textContent || "";
    const description = item.getElementsByTagName("description")[0]?.textContent || "";
    const pubDate = item.getElementsByTagName("pubDate")[0]?.textContent || "";

    // 1. Extract image url
    let imageUrl = "";

    // Check enclosure tag
    const enclosure = item.getElementsByTagName("enclosure")[0];
    if (enclosure && enclosure.getAttribute("type")?.startsWith("image/")) {
      imageUrl = enclosure.getAttribute("url");
    }

    // Check media:content or media:thumbnail
    if (!imageUrl) {
      const mediaContent = item.getElementsByTagName("media:content")[0] || item.getElementsByTagName("content")[0];
      if (mediaContent) {
        imageUrl = mediaContent.getAttribute("url") || "";
      }
    }
    if (!imageUrl) {
      const mediaThumbnail = item.getElementsByTagName("media:thumbnail")[0] || item.getElementsByTagName("thumbnail")[0];
      if (mediaThumbnail) {
        imageUrl = mediaThumbnail.getAttribute("url") || "";
      }
    }

    // Check inside description for <img> tag (common in some feeds)
    if (!imageUrl && description) {
      const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch) {
        imageUrl = imgMatch[1];
      }
    }

    // Clean description text (strip HTML tags)
    let cleanDesc = description.replace(/<[^>]*>/g, "").trim();
    // Decode HTML entities if present
    const tempText = document.createElement("textarea");
    tempText.innerHTML = cleanDesc;
    cleanDesc = tempText.value;

    articles.push({
      id: i + 1, // Index within this source's list
      sourceId,
      title,
      link,
      summary: cleanDesc.length > 150 ? cleanDesc.slice(0, 150) + "..." : cleanDesc,
      content: cleanDesc,
      date: formatDate(pubDate),
      imageUrl
    });
  }

  return articles;
}

// Utility to parse/format date string
function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    }
  } catch (e) {
    // Ignore and return original
  }
  return dateStr;
}
