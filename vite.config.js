import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// A simple Vite plugin to proxy RSS requests server-side to bypass CORS
const rssProxyPlugin = () => ({
  name: 'rss-proxy',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url.startsWith('/api/rss')) {
        try {
          const urlObj = new URL(req.url, `http://${req.headers.host}`);
          const targetUrl = urlObj.searchParams.get('url');
          if (!targetUrl) {
            res.statusCode = 400;
            res.end('Missing url parameter');
            return;
          }

          // Use fetch on the server side to download the XML feed directly
          const fetchResponse = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });

          if (!fetchResponse.ok) {
            res.statusCode = fetchResponse.status;
            res.end(`Target returned error: ${fetchResponse.statusText}`);
            return;
          }

          const xmlText = await fetchResponse.text();
          res.setHeader('Content-Type', 'text/xml');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(xmlText);
        } catch (error) {
          res.statusCode = 500;
          res.end(`Proxy error: ${error.message}`);
        }
        return;
      }
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  base: './', // Needed for GitHub pages
  build: {
    assetsInlineLimit: 8192,
  },
  plugins: [svgr(), react(), rssProxyPlugin()],
})
