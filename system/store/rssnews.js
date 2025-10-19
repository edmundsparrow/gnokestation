// rssnews.js - RSS News Reader Application
// FILE: applications/rssnews.js
// VERSION: 1.0.0
// BUILD DATE: 2025-09-30
//
// PURPOSE:
//   Read RSS feeds from multiple news sources with regional customization.
//
// SETUP:
//   1. RSS feeds are public and require no API keys.
//   2. Uses CORS proxy for cross-origin requests.
//
// ARCHITECTURE:
//   IIFE / window.RSSNewsApp, renders via WindowManager, single instance.

(function(){
  window.RSSNewsApp = {
    // Application Metadata and State
    metadata: {
        name: 'RSS News Reader',
        version: '1.0.0',
        icon: '📡',
        author: 'Gnokestation',
        description: 'Multi-source RSS news reader with regional feeds'
    },

    state: {
        articles: [],
        selectedRegion: 'global',
        selectedSource: 'all',
        customFeeds: JSON.parse(localStorage.getItem('rssCustomFeeds') || '[]'),
        loading: false,
        currentWindow: null,
        lastUpdate: null
    },

    // Regional RSS Feed Collections
    FEED_REGIONS: {
        'global': {
            name: 'Global News',
            sources: {
                'bbc-world': { name: 'BBC World', url: 'http://feeds.bbci.co.uk/news/world/rss.xml', icon: '🌍' },
                'cnn': { name: 'CNN International', url: 'http://rss.cnn.com/rss/edition.rss', icon: '📰' },
                'reuters': { name: 'Reuters', url: 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best', icon: '📊' },
                'guardian': { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss', icon: '🗞️' }
            }
        },
        'us': {
            name: 'United States',
            sources: {
                'cnn-us': { name: 'CNN US', url: 'http://rss.cnn.com/rss/cnn_us.rss', icon: '🇺🇸' },
                'npr': { name: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml', icon: '📻' },
                'nyt': { name: 'NY Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', icon: '📰' },
                'wapo': { name: 'Washington Post', url: 'https://feeds.washingtonpost.com/rss/world', icon: '🗞️' }
            }
        },
        'uk': {
            name: 'United Kingdom',
            sources: {
                'bbc-uk': { name: 'BBC UK', url: 'http://feeds.bbci.co.uk/news/uk/rss.xml', icon: '🇬🇧' },
                'guardian-uk': { name: 'Guardian UK', url: 'https://www.theguardian.com/uk/rss', icon: '🗞️' },
                'telegraph': { name: 'The Telegraph', url: 'https://www.telegraph.co.uk/rss.xml', icon: '📰' },
                'independent': { name: 'Independent', url: 'https://www.independent.co.uk/rss', icon: '📄' }
            }
        },
        'africa': {
            name: 'Africa',
            sources: {
                'bbc-africa': { name: 'BBC Africa', url: 'http://feeds.bbci.co.uk/news/world/africa/rss.xml', icon: '🌍' },
                'aljazeera-africa': { name: 'Al Jazeera Africa', url: 'https://www.aljazeera.com/xml/rss/all.xml', icon: '📡' },
                'africa-news': { name: 'Africanews', url: 'https://www.africanews.com/feed/', icon: '📰' }
            }
        },
        'asia': {
            name: 'Asia',
            sources: {
                'bbc-asia': { name: 'BBC Asia', url: 'http://feeds.bbci.co.uk/news/world/asia/rss.xml', icon: '🌏' },
                'cnn-asia': { name: 'CNN Asia', url: 'http://rss.cnn.com/rss/edition_asia.rss', icon: '📰' },
                'straits-times': { name: 'Straits Times', url: 'https://www.straitstimes.com/news/singapore/rss.xml', icon: '🗞️' }
            }
        },
        'europe': {
            name: 'Europe',
            sources: {
                'bbc-europe': { name: 'BBC Europe', url: 'http://feeds.bbci.co.uk/news/world/europe/rss.xml', icon: '🇪🇺' },
                'euronews': { name: 'Euronews', url: 'https://www.euronews.com/rss', icon: '📡' },
                'dw': { name: 'Deutsche Welle', url: 'https://rss.dw.com/rdf/rss-en-all', icon: '📰' }
            }
        },
        'middle-east': {
            name: 'Middle East',
            sources: {
                'bbc-me': { name: 'BBC Middle East', url: 'http://feeds.bbci.co.uk/news/world/middle_east/rss.xml', icon: '🌍' },
                'aljazeera': { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', icon: '📡' }
            }
        },
        'latin-america': {
            name: 'Latin America',
            sources: {
                'bbc-latam': { name: 'BBC Latin America', url: 'http://feeds.bbci.co.uk/news/world/latin_america/rss.xml', icon: '🌎' },
                'cnn-latam': { name: 'CNN Latin America', url: 'http://rss.cnn.com/rss/edition_americas.rss', icon: '📰' }
            }
        }
    },

    CORS_PROXY: 'https://api.allorigins.win/raw?url=',

    // --- Core Window Management Methods ---

    open() {
        const readerHTML = `
            <div id="rss-app-container" style="
              display: flex;
              flex-direction: column;
              height: 100%;
            ">
            </div>
        `;
        
        const win = window.WindowManager.createWindow(
            'RSS News Reader', readerHTML, 450, 600
        );
        this.state.currentWindow = win;

        if (window.EventBus) {
          const cleanup = (data) => {
            if (data.windowId === win.id) {
              this.cleanup();
              window.EventBus.off('window-closed', cleanup);
            }
          };
          window.EventBus.on('window-closed', cleanup);
        }

        this.init(win.querySelector('#rss-app-container'));
        return win;
    },

    init(container) {
        this.container = container;
        this.render();
        this.fetchFeeds();
    },

    cleanup() {
      if (this.container) {
          this.container.innerHTML = '';
      }
      this.state.currentWindow = null;
    },

    // --- Data Management ---

    async fetchFeeds() {
        this.state.loading = true;
        this.state.articles = [];
        this.render();

        const region = this.FEED_REGIONS[this.state.selectedRegion];
        if (!region) return;

        const sources = this.state.selectedSource === 'all' 
            ? Object.entries(region.sources)
            : [[this.state.selectedSource, region.sources[this.state.selectedSource]]];

        try {
            const fetchPromises = sources.map(async ([id, source]) => {
                try {
                    const response = await fetch(this.CORS_PROXY + encodeURIComponent(source.url));
                    const text = await response.text();
                    return this.parseRSS(text, source.name, source.icon);
                } catch (error) {
                    console.error(`Failed to fetch ${source.name}:`, error);
                    return [];
                }
            });

            const results = await Promise.all(fetchPromises);
            this.state.articles = results.flat().sort((a, b) => b.date - a.date);
            this.state.lastUpdate = new Date();
        } catch (error) {
            this.showError('Failed to fetch news feeds.');
            console.error('RSS Fetch Error:', error);
        } finally {
            this.state.loading = false;
            this.render();
        }
    },

    parseRSS(xmlText, sourceName, sourceIcon) {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, 'text/xml');
        
        const items = xml.querySelectorAll('item');
        const articles = [];

        items.forEach((item, index) => {
            if (index >= 15) return; // Limit to 15 per source

            const title = item.querySelector('title')?.textContent || 'No title';
            const link = item.querySelector('link')?.textContent || '#';
            const description = item.querySelector('description')?.textContent || '';
            const pubDate = item.querySelector('pubDate')?.textContent || '';
            
            // Clean HTML from description
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = description;
            const cleanDesc = tempDiv.textContent || tempDiv.innerText || '';

            articles.push({
                title,
                link,
                description: cleanDesc.substring(0, 200) + (cleanDesc.length > 200 ? '...' : ''),
                date: pubDate ? new Date(pubDate) : new Date(),
                source: sourceName,
                sourceIcon: sourceIcon
            });
        });

        return articles;
    },

    // --- Utility Methods ---

    formatDate(date) {
        const now = new Date();
        const diff = Math.floor((now - date) / 1000); // seconds

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },

    showError(message) {
        const winEl = this.state.currentWindow;
        if (!winEl) return;
        
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = 'position:absolute;top:10px;right:10px;background:#dc2626;color:white;padding:10px 15px;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.5);z-index:1000;font-size:12px;';
        errorDiv.textContent = message;
        winEl.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 4000);
    },

    // --- Rendering Methods ---

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div style="display:flex;flex-direction:column;height:100%;background:#18181b;color:#fafafa;font-family:system-ui,-apple-system,sans-serif;">
                ${this.renderHeader()}
                ${this.renderContent()}
            </div>
        `;

        this.attachEventListeners();
    },

    renderHeader() {
        const region = this.FEED_REGIONS[this.state.selectedRegion];
        const updateTime = this.state.lastUpdate 
            ? this.state.lastUpdate.toLocaleTimeString() 
            : 'Never';

        return `
            <div style="background:#27272a;padding:20px;border-bottom:2px solid #3f3f46;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                    <h2 style="margin:0;font-size:24px;font-weight:700;">📡 RSS News</h2>
                    <button data-action="refresh" style="background:#3b82f6;color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;">
                        🔄 Refresh
                    </button>
                </div>

                <select data-select="region" style="width:100%;padding:10px;background:#18181b;border:1px solid #3f3f46;border-radius:6px;color:white;font-size:14px;margin-bottom:10px;">
                    ${Object.entries(this.FEED_REGIONS).map(([id, region]) => `
                        <option value="${id}" ${this.state.selectedRegion === id ? 'selected' : ''}>
                            ${region.name}
                        </option>
                    `).join('')}
                </select>

                ${region ? `
                    <select data-select="source" style="width:100%;padding:10px;background:#18181b;border:1px solid #3f3f46;border-radius:6px;color:white;font-size:14px;">
                        <option value="all">All Sources</option>
                        ${Object.entries(region.sources).map(([id, source]) => `
                            <option value="${id}" ${this.state.selectedSource === id ? 'selected' : ''}>
                                ${source.icon} ${source.name}
                            </option>
                        `).join('')}
                    </select>
                ` : ''}

                <div style="margin-top:10px;font-size:12px;color:#a1a1aa;">
                    Last updated: ${updateTime} • ${this.state.articles.length} articles
                </div>
            </div>
        `;
    },

    renderContent() {
        if (this.state.loading) {
            return `
                <div style="text-align:center;padding:60px 20px;color:#a1a1aa;flex:1;overflow-y:auto;">
                    <div style="font-size:48px;margin-bottom:20px;">📡</div>
                    <div style="font-size:18px;font-weight:600;margin-bottom:10px;">Loading Feeds...</div>
                    <div>Fetching latest news</div>
                </div>
            `;
        }

        if (this.state.articles.length === 0) {
            return `
                <div style="text-align:center;padding:60px 20px;color:#a1a1aa;flex:1;overflow-y:auto;">
                    <div style="font-size:48px;margin-bottom:20px;">📰</div>
                    <div style="font-size:18px;font-weight:600;margin-bottom:10px;">No Articles</div>
                    <div>Try selecting a different region or source</div>
                </div>
            `;
        }

        return `
            <div style="flex:1;overflow-y:auto;padding:20px;">
                ${this.state.articles.map(article => this.renderArticleCard(article)).join('')}
            </div>
        `;
    },

    renderArticleCard(article) {
        return `
            <div style="background:#27272a;border:1px solid #3f3f46;border-radius:12px;padding:20px;margin-bottom:15px;cursor:pointer;transition:background 0.2s;"
                 onclick="window.open('${article.link}', '_blank')"
                 onmouseover="this.style.background='#3f3f46'"
                 onmouseout="this.style.background='#27272a'">
                <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:16px;">${article.sourceIcon}</span>
                        <span style="font-size:12px;color:#a1a1aa;font-weight:600;">${article.source}</span>
                    </div>
                    <span style="font-size:11px;color:#71717a;">${this.formatDate(article.date)}</span>
                </div>
                
                <h3 style="margin:0 0 10px 0;font-size:16px;font-weight:700;line-height:1.4;color:#fafafa;">
                    ${article.title}
                </h3>
                
                ${article.description ? `
                    <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.6;">
                        ${article.description}
                    </p>
                ` : ''}
            </div>
        `;
    },

    attachEventListeners() {
        // Region select
        const regionSelect = this.container.querySelector('[data-select="region"]');
        if (regionSelect) {
            regionSelect.addEventListener('change', (e) => {
                this.state.selectedRegion = e.target.value;
                this.state.selectedSource = 'all';
                this.fetchFeeds();
            });
        }

        // Source select
        const sourceSelect = this.container.querySelector('[data-select="source"]');
        if (sourceSelect) {
            sourceSelect.addEventListener('change', (e) => {
                this.state.selectedSource = e.target.value;
                this.fetchFeeds();
            });
        }

        // Refresh button
        const refreshBtn = this.container.querySelector('[data-action="refresh"]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.fetchFeeds());
        }
    }
  };

  // Register with AppRegistry
  if (window.AppRegistry) {
    window.AppRegistry.registerApp({
      id: 'rss-news-reader',
      name: 'RSS News Reader',
      icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='6.18' cy='17.82' r='2.18'/><path d='M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z'/></svg>",
      handler: () => window.RSSNewsApp.open(),
      singleInstance: true
    });
  }

  // Register documentation
  (function registerRSSNewsDoc() {
    const tryRegister = () => {
      if (window.Docs && window.Docs.initialized && typeof window.Docs.register === 'function') {
        window.Docs.register('rss-news-reader', {
          name: "RSS News Reader",
          version: "1.0.0",
          description: "Multi-source RSS news reader with regional customization for global, US, UK, Africa, Asia, Europe, Middle East, and Latin America.",
          type: "User",
          features: [
            "8 regional news collections",
            "BBC, CNN, Reuters, Guardian, NPR, Al Jazeera, and more",
            "No API keys required",
            "Real-time feed updates",
            "Filter by source or view all",
            "Direct links to full articles",
            "Completely free"
          ],
          methods: [
            { name: "open()", description: "Open the RSS news reader window." },
            { name: "cleanup()", description: "Clean up resources when window closes." }
          ],
          autoGenerated: false
        });
        console.log('RSS News Reader documentation registered');
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

