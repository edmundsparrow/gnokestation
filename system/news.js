// applications/news.js
/**
 * FILE: applications/news.js
 * VERSION: 1.2.0
 * BUILD DATE: 2025-09-29
 *
 * PURPOSE:
 *   Displays top global news headlines using NewsAPI.org
 *   Free tier: 100 requests/day for development use
 *
 * SETUP:
 *   1. Get free API key at: https://newsapi.org/register
 *   2. Replace NEWS_API_KEY below with your key
 *   3. Keep requests under 100/day (check every 15+ minutes)
 *
 * ARCHITECTURE:
 *   IIFE / window.NewsApp, renders via WindowManager, single instance.
 */

(function(){
  window.NewsApp = {
    // Get your free key at: https://newsapi.org/register
    NEWS_API_KEY: '88c297ebbe674ab0be297a109dd1111c',

    // NewsAPI endpoint for top headlines
    NEWS_API_BASE: 'https://newsapi.org/v2/top-headlines',

    refreshTimer: null,
    currentWindow: null,

    open() {
      const newsHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #fff;
          color: #333;
          font-family: Arial, sans-serif;
        ">
          <div style="
            padding: 12px 16px;
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-bottom: 1px solid #5a67d8;
          ">
            <h2 style="margin: 0; font-size: 18px; font-weight: 600;">📰 Top Headlines</h2>
          </div>

          <div id="news-list-container" style="
            flex: 1;
            overflow-y: auto;
            padding: 10px;
          ">
            <div id="status-message" style="text-align: center; color: #666; padding: 20px;">
              Loading headlines...
            </div>
          </div>

          <div id="last-update" style="
            padding: 8px 12px;
            text-align: center;
            background: #f8f9fa;
            border-top: 1px solid #dee2e6;
            font-size: 11px;
            color: #666;
            cursor: pointer;
            transition: background 0.2s;
          " onmouseover="this.style.background='#e9ecef'" onmouseout="this.style.background='#f8f9fa'">
            Click to refresh
          </div>
        </div>
      `;

      const win = window.WindowManager.createWindow('News', newsHTML, 320, 480);
      this.currentWindow = win;
      
      // Listen for window closure via EventBus
      if (window.EventBus) {
        const cleanup = (data) => {
          if (data.windowId === win.id) {
            this.cleanup();
            window.EventBus.off('window-closed', cleanup);
          }
        };
        window.EventBus.on('window-closed', cleanup);
      }
      
      this.setupNews(win);
      return win;
    },

    setupNews(win) {
      const listContainer = win.querySelector('#news-list-container');
      const statusMessageEl = win.querySelector('#status-message');
      const lastUpdateEl = win.querySelector('#last-update');

      const fetchAndRender = () => {
        // Check for valid API key
        if (!this.NEWS_API_KEY || this.NEWS_API_KEY === 'YOUR_API_KEY_HERE') {
          listContainer.innerHTML = `
            <div style="text-align:center; padding:20px;">
              <div style="font-size: 48px; margin-bottom: 10px;">🔑</div>
              <p style="font-weight: 600; color: #e74c3c; margin: 10px 0;">API Key Required</p>
              <p style="font-size: 13px; color: #666; margin: 10px 0; line-height: 1.5;">
                This app needs a free NewsAPI.org key to fetch headlines.
              </p>
              <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; margin: 15px 0; font-size: 12px; text-align: left;">
                <strong>Quick Setup:</strong><br>
                1. Visit <a href="https://newsapi.org/register" target="_blank" style="color: #667eea;">newsapi.org/register</a><br>
                2. Sign up (free, instant)<br>
                3. Copy your API key<br>
                4. Edit applications/news.js<br>
                5. Replace NEWS_API_KEY value
              </div>
              <p style="font-size: 11px; color: #999;">Free tier: 100 requests/day</p>
            </div>
          `;
          statusMessageEl.textContent = '';
          lastUpdateEl.textContent = 'Configure API key to use';
          return;
        }

        statusMessageEl.textContent = 'Fetching headlines...';
        listContainer.innerHTML = '';

        // Build URL with parameters
        const params = new URLSearchParams({
          apiKey: this.NEWS_API_KEY,
          country: 'us',  // Change to: gb, ca, au, etc.
          pageSize: 10,
          category: 'general'  // Options: business, entertainment, health, science, sports, technology
        });

        const url = `${this.NEWS_API_BASE}?${params.toString()}`;

        fetch(url)
        .then(res => {
          if (!res.ok) {
            if (res.status === 401) throw new Error('Invalid API key');
            if (res.status === 426) throw new Error('Upgrade required');
            if (res.status === 429) throw new Error('Rate limit exceeded (100/day)');
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          statusMessageEl.textContent = '';

          if (data.status === 'ok' && data.articles && data.articles.length > 0) {
            data.articles.forEach((article, index) => {
              const newsItem = document.createElement('div');
              newsItem.style.cssText = `
                padding: 12px;
                margin-bottom: 8px;
                border-bottom: 1px solid #e9ecef;
                cursor: pointer;
                transition: all 0.2s;
                border-radius: 4px;
              `;
              newsItem.onmouseover = () => {
                newsItem.style.backgroundColor = '#f8f9fa';
                newsItem.style.transform = 'translateX(4px)';
              };
              newsItem.onmouseout = () => {
                newsItem.style.backgroundColor = 'transparent';
                newsItem.style.transform = 'translateX(0)';
              };

              // Get source name
              const sourceName = article.source?.name || 'Unknown Source';
              
              // Format published time
              let timeAgo = '';
              if (article.publishedAt) {
                const publishedDate = new Date(article.publishedAt);
                const now = new Date();
                const diffMs = now - publishedDate;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMins / 60);
                
                if (diffMins < 60) {
                  timeAgo = `${diffMins}m ago`;
                } else if (diffHours < 24) {
                  timeAgo = `${diffHours}h ago`;
                } else {
                  timeAgo = publishedDate.toLocaleDateString();
                }
              }

              newsItem.innerHTML = `
                <div style="display: flex; align-items: start; gap: 8px;">
                  <div style="
                    min-width: 24px;
                    height: 24px;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 11px;
                    font-weight: 600;
                  ">${index + 1}</div>
                  <div style="flex: 1;">
                    <p style="font-size: 14px; font-weight: 600; line-height: 1.4; margin: 0 0 6px; color: #2c3e50;">
                      ${article.title}
                    </p>
                    <div style="display: flex; gap: 8px; align-items: center; font-size: 11px; color: #95a5a6;">
                      <span style="font-weight: 500;">${sourceName}</span>
                      ${timeAgo ? `<span>•</span><span>${timeAgo}</span>` : ''}
                    </div>
                  </div>
                </div>
              `;
              
              if (article.url) {
                newsItem.addEventListener('click', () => {
                  window.open(article.url, '_blank');
                });
              }
              
              listContainer.appendChild(newsItem);
            });
            
            lastUpdateEl.textContent = `Updated: ${new Date().toLocaleTimeString()} • Click to refresh`;
          } else {
            listContainer.innerHTML = `
              <div style="text-align:center; color: #666; padding:40px;">
                <div style="font-size: 36px; margin-bottom: 10px;">📭</div>
                <p>No headlines available</p>
              </div>
            `;
            lastUpdateEl.textContent = 'No articles found • Click to retry';
          }
        })
        .catch(err => {
          console.error('NewsApp fetch error:', err);
          listContainer.innerHTML = `
            <div style="text-align:center; color: #e74c3c; padding:20px;">
              <div style="font-size: 36px; margin-bottom: 10px;">⚠️</div>
              <p style="font-weight: 600; margin: 10px 0;">Could not fetch news</p>
              <p style="font-size: 12px; color: #666; margin: 10px 0;">${err.message}</p>
              ${err.message.includes('Rate limit') ? 
                '<p style="font-size: 11px; background: #fff3cd; padding: 8px; border-radius: 4px; margin-top: 10px;">Free tier allows 100 requests/day. Try again later.</p>' : 
                ''}
            </div>
          `;
          lastUpdateEl.textContent = 'Error • Click to retry';
        });
      };

      // Initial fetch
      fetchAndRender();
      
      // Auto-refresh every 15 minutes (well within 100/day limit)
      this.refreshTimer = setInterval(fetchAndRender, 15 * 60 * 1000);
      
      // Manual refresh on click
      lastUpdateEl.addEventListener('click', fetchAndRender);
    },

    cleanup() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
      this.currentWindow = null;
    }
  };

  // Register with AppRegistry
  if (window.AppRegistry) {
    window.AppRegistry.registerApp({
      id: 'news',
      name: 'News Feed',
      icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%23667eea' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M4 22h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2z'/><line x1='8' y1='6' x2='16' y2='6'/><line x1='8' y1='10' x2='16' y2='10'/><line x1='8' y1='14' x2='16' y2='14'/><line x1='8' y1='18' x2='12' y2='18'/></svg>",
      handler: () => window.NewsApp.open(),
      singleInstance: true
    });
  }

  // Register documentation
  (function registerNewsDoc() {
    const tryRegister = () => {
      if (window.Docs && window.Docs.initialized && typeof window.Docs.register === 'function') {
        window.Docs.register('news', {
          name: "News Feed",
          version: "1.2.0",
          description: "Displays top news headlines from NewsAPI.org with automatic refresh, time indicators, and clickable links to full articles.",
          type: "User",
          features: [
            "Real-time news from 70,000+ sources",
            "Auto-refresh every 15 minutes",
            "Numbered headlines with source attribution",
            "Time-ago indicators (e.g., '2h ago')",
            "Click headlines to read full articles",
            "Rate limit protection (100 requests/day)",
            "Helpful API key setup instructions",
            "Clean, modern UI with hover effects"
          ],
          methods: [
            { name: "open()", description: "Open the news feed window with top headlines" },
            { name: "cleanup()", description: "Clear refresh timer and clean up resources" }
          ],
          autoGenerated: false
        });
        console.log('News Feed documentation registered');
        return true;
      }
      return false;
    };

    if (tryRegister()) return;
    if (window.EventBus) {
      const onDocsReady = () => {
        if (tryRegister()) window.EventBus.off('docs-ready', onDocsReady);
      };
      window.EventBus.on('docs-ready', onDocsReady);
    }

    let attempts = 0;
    const pollInterval = setInterval(() => {
      if (tryRegister() || attempts++ > 50) clearInterval(pollInterval);
    }, 100);
  })();

})();
