export const newsSources = [
  // Bangladesh
  { id: "prothomalo", name: "Prothom Alo", url: "https://www.prothomalo.com/feed/", country: "Bangladesh" },
  { id: "jagonews", name: "Jago News 24", url: "https://www.jagonews24.com/rss/rss.xml", country: "Bangladesh" },
  { id: "bd24live", name: "BD24Live", url: "https://www.bd24live.com/feed/", country: "Bangladesh" },
  { id: "ittefaq", name: "Daily Ittefaq", url: "https://www.ittefaq.com.bd/feed/", country: "Bangladesh" },
  { id: "amarbanglabd", name: "Amar Bangla BD", url: "https://www.amarbanglabd.com/feeds", country: "Bangladesh" },
  { id: "banglatribune", name: "Bangla Tribune", url: "https://www.banglatribune.com/feed/", country: "Bangladesh" },
  { id: "ekattor", name: "Ekattor TV", url: "https://ekattor.tv/feed/", country: "Bangladesh" },
  { id: "gnews_bangladesh", name: "Google News Bangladesh", url: "https://news.google.com/rss/search?q=Bangladesh", country: "Bangladesh" },
  { id: "gnews_kushtia", name: "Google News Kushtia", url: "https://news.google.com/rss/search?q=Kushtia", country: "Bangladesh" },
  // India
  { id: "indiatoday", name: "India Today", url: "https://www.indiatoday.in/rss/home", country: "India" },
  // Middle East
  { id: "albawaba", name: "Al Bawaba", url: "https://www.albawaba.com/rss/all", country: "Middle East" },
  { id: "almonitor", name: "Al-Monitor", url: "https://www.al-monitor.com/rss", country: "Middle East" },
  { id: "memonitor", name: "Middle East Monitor", url: "https://middleeastmnt.disqus.com/latest.rss", country: "Middle East" },
  { id: "mehr", name: "Mehr News", url: "https://en.mehrnews.com/rss", country: "Middle East" },
  { id: "aljazeera", name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", country: "Middle East" },
  // World News
  { id: "nyt", name: "NYT World", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", country: "World News" },
  { id: "nyt_home", name: "NYT Home", url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", country: "World News" },
  { id: "bbc_world", name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml", country: "World News" },
  { id: "gnews_world", name: "Google News World", url: "https://news.google.com/rss", country: "World News" },
  { id: "timesofindia", name: "Times of India World", url: "https://timesofindia.indiatimes.com/rssfeeds/296589292.cms", country: "World News" },
  { id: "cna_world", name: "CNA World", url: "https://www.channelnewsasia.com/rssfeeds/8395884", country: "World News" },
  { id: "independent_world", name: "The Independent World", url: "https://www.independent.co.uk/news/world/rss", country: "World News" },
  { id: "france24", name: "France 24 World", url: "https://www.france24.com/en/rss", country: "World News" }
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
  
  // Support both standard RSS <item> and Atom <entry>
  let items = xmlDoc.getElementsByTagName("item");
  let isAtom = false;
  
  if (items.length === 0) {
    items = xmlDoc.getElementsByTagName("entry");
    isAtom = true;
  }
  
  const articles = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const title = item.getElementsByTagName("title")[0]?.textContent || "";
    
    let link = "";
    if (isAtom) {
      const linkTag = item.getElementsByTagName("link")[0];
      link = linkTag ? (linkTag.getAttribute("href") || linkTag.textContent || "") : "";
    } else {
      link = item.getElementsByTagName("link")[0]?.textContent || "";
    }
    
    const descriptionTag = isAtom
      ? item.getElementsByTagName("summary")[0] || item.getElementsByTagName("content")[0]
      : item.getElementsByTagName("description")[0];
    const description = descriptionTag?.textContent || "";
    
    const pubDateTag = isAtom
      ? item.getElementsByTagName("updated")[0] || item.getElementsByTagName("published")[0]
      : item.getElementsByTagName("pubDate")[0];
    const pubDate = pubDateTag?.textContent || "";

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

// Utility to parse/format date string in GMT+6 (Asia/Dhaka)
function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const datePart = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "Asia/Dhaka"
      });
      const timePart = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Dhaka"
      });
      return `${datePart} ${timePart}`;
    }
  } catch (e) {
    // Ignore
  }
  return dateStr;
}
