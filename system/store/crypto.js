// crypto.js - Cryptocurrency Dashboard Application
// FILE: applications/crypto.js
// VERSION: 1.0.0
// BUILD DATE: 2025-09-30
//
// PURPOSE:
//   Displays real-time cryptocurrency prices and market data using CoinGecko API.
//
// SETUP:
//   1. CoinGecko API is free and requires no key.
//   2. Rate limit is respected by refreshing every 60 seconds.
//
// ARCHITECTURE:
//   IIFE / window.CryptoApp, renders via WindowManager, single instance.

(function(){
  window.CryptoApp = {
    // Application Metadata and State
    metadata: {
        name: 'Crypto Dashboard',
        version: '1.0.0',
        icon: '💰',
        author: 'Gnokestation', // Updated to Gnokestation
        description: 'Real-time cryptocurrency prices and market data'
    },

    state: {
        coins: [],
        favorites: new Set(JSON.parse(localStorage.getItem('cryptoFavorites') || '[]')),
        sortBy: 'market_cap_rank',
        sortAsc: true,
        searchTerm: '',
        lastUpdate: null,
        updateInterval: null,
        selectedCoin: null,
        view: 'list', // 'list' or 'detail'
        currentWindow: null // Added to track the window
    },

    API_BASE: 'https://api.coingecko.com/api/v3',
    REFRESH_INTERVAL: 60000, // 60 seconds (respect rate limits)

    // --- Core Window Management Methods (Matching news.js structure) ---

    open() {
        const dashboardHTML = `
            <div id="crypto-app-container" style="
              display: flex;
              flex-direction: column;
              height: 100%;
            ">
              </div>
        `;
        
        const win = window.WindowManager.createWindow(
            'Crypto Dashboard', dashboardHTML, 380, 560
        );
        this.state.currentWindow = win;

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

        // Initialize and start fetching data
        this.init(win.querySelector('#crypto-app-container'));
        return win;
    },

    init(container) {
        this.container = container;
        this.loadFavorites();
        this.render();
        this.fetchCoins(); // Make it an async call without 'await' to let 'open' return quickly
        this.startAutoRefresh();
    },

    cleanup() {
      this.stopAutoRefresh();
      if (this.container) {
          this.container.innerHTML = '';
      }
      this.state.currentWindow = null;
    },

    // --- Data and State Management ---

    loadFavorites() {
        try {
            const saved = localStorage.getItem('cryptoFavorites');
            this.state.favorites = new Set(JSON.parse(saved || '[]'));
        } catch (e) {
            this.state.favorites = new Set();
        }
    },

    saveFavorites() {
        localStorage.setItem('cryptoFavorites', 
            JSON.stringify([...this.state.favorites]));
    },

    async fetchCoins() {
        try {
            const response = await fetch(
                `${this.API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=1h,24h,7d`
            );
            
            if (!response.ok) throw new Error(`API request failed: HTTP ${response.status}`);
            
            this.state.coins = await response.json();
            this.state.lastUpdate = new Date();
            this.render();
        } catch (error) {
            // Only show toast if window is open
            if (this.state.currentWindow) {
                this.showError('Failed to fetch cryptocurrency data. Please try again.');
            }
            console.error('Crypto API Error:', error);
            // Render to show an error message in the view
            this.render();
        }
    },

    async fetchCoinDetail(coinId) {
        try {
            // Render a loading state immediately
            this.state.view = 'detail';
            this.state.selectedCoin = null; 
            this.render(); 

            const response = await fetch(
                `${this.API_BASE}/coins/${coinId}?localization=false&tickers=false&community_data=true&developer_data=false`
            );
            
            if (!response.ok) throw new Error(`API request failed: HTTP ${response.status}`);
            
            this.state.selectedCoin = await response.json();
            this.render();
        } catch (error) {
            this.showError('Failed to fetch coin details.');
            console.error('Coin Detail Error:', error);
            // Fallback to list view on error
            this.state.view = 'list';
            this.state.selectedCoin = null;
            this.render();
        }
    },

    startAutoRefresh() {
        this.stopAutoRefresh(); // Ensure any existing one is cleared
        this.state.updateInterval = setInterval(() => {
            if (this.state.view === 'list') {
                this.fetchCoins();
            }
        }, this.REFRESH_INTERVAL);
    },

    stopAutoRefresh() {
        if (this.state.updateInterval) {
            clearInterval(this.state.updateInterval);
            this.state.updateInterval = null;
        }
    },

    toggleFavorite(coinId) {
        if (this.state.favorites.has(coinId)) {
            this.state.favorites.delete(coinId);
        } else {
            this.state.favorites.add(coinId);
        }
        this.saveFavorites();
        this.render();
    },

    // --- Utility Methods ---

    sortCoins(coins) {
        const sorted = [...coins].sort((a, b) => {
            let aVal = a[this.state.sortBy];
            let bVal = b[this.state.sortBy];
            
            if (aVal === null || aVal === undefined) aVal = this.state.sortAsc ? Infinity : -Infinity;
            if (bVal === null || bVal === undefined) bVal = this.state.sortAsc ? Infinity : -Infinity;
            
            return this.state.sortAsc ? aVal - bVal : bVal - aVal;
        });
        return sorted;
    },

    filterCoins(coins) {
        if (!this.state.searchTerm) return coins;
        
        const term = this.state.searchTerm.toLowerCase();
        return coins.filter(coin => 
            coin.name.toLowerCase().includes(term) ||
            coin.symbol.toLowerCase().includes(term)
        );
    },

    formatPrice(price) {
        if (price === null || price === undefined) return 'N/A';
        // Your existing formatting logic...
        if (price >= 1) return `$${price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        if (price >= 0.01) return `$${price.toFixed(4)}`;
        return `$${price.toFixed(8)}`;
    },

    formatMarketCap(cap) {
        if (cap === null || cap === undefined) return 'N/A';
        // Your existing formatting logic...
        if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
        if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
        if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
        return `$${cap.toLocaleString()}`;
    },

    formatPercent(percent) {
        if (percent === null || percent === undefined) return 'N/A';
        const sign = percent >= 0 ? '+' : '';
        return `${sign}${percent.toFixed(2)}%`;
    },

    getPercentColor(percent) {
        if (percent === null || percent === undefined) return '#666';
        return percent >= 0 ? '#16a34a' : '#dc2626';
    },

    showError(message) {
        // Find the window element to attach the error to
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
            <div style="display:flex;flex-direction:column;height:100%;background:#0f172a;color:#e2e8f0;font-family:system-ui,-apple-system,sans-serif;">
                ${this.renderHeader()}
                ${this.state.view === 'list' ? this.renderList() : this.renderDetail()}
            </div>
        `;

        this.attachEventListeners();
    },

    renderHeader() {
        const updateTime = this.state.lastUpdate 
            ? this.state.lastUpdate.toLocaleTimeString() 
            : 'Never';

        // Your existing renderHeader logic...
        return `
            <div style="background:#1e293b;padding:20px;border-bottom:1px solid #334155;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                    <h2 style="margin:0;font-size:24px;font-weight:700;">💰 Crypto Dashboard</h2>
                    ${this.state.view === 'detail' ? `
                        <button data-action="back" style="background:#3b82f6;color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:600;">
                            ← Back to List
                        </button>
                    ` : `
                        <button data-action="refresh" style="background:#3b82f6;color:white;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:600;">
                            🔄 Refresh
                        </button>
                    `}
                </div>
                ${this.state.view === 'list' ? `
                    <input 
                        type="text" 
                        data-input="search"
                        placeholder="Search coins..."
                        value="${this.state.searchTerm}"
                        style="width:100%;padding:12px;background:#334155;border:1px solid #475569;border-radius:6px;color:#e2e8f0;font-size:14px;"
                    />
                    <div style="margin-top:10px;font-size:12px;color:#94a3b8;">
                        Last updated: ${updateTime} • Data by CoinGecko
                    </div>
                ` : ''}
            </div>
        `;
    },

    renderList() {
        let coins = this.filterCoins(this.state.coins);
        coins = this.sortCoins(coins);

        const favorites = coins.filter(c => this.state.favorites.has(c.id));
        const others = coins.filter(c => !this.state.favorites.has(c.id));

        // Display a loading/error state if no coins are available
        if (this.state.coins.length === 0 && !this.state.lastUpdate) {
            return `
                <div style="text-align:center;padding:60px 20px;color:#64748b;flex:1;overflow-y:auto;">
                    <div style="font-size:48px;margin-bottom:20px;">📡</div>
                    <div style="font-size:18px;font-weight:600;margin-bottom:10px;">Loading Data...</div>
                    <div>Fetching real-time crypto prices</div>
                </div>
            `;
        }
        
        // Your existing renderList logic...
        return `
            <div style="flex:1;overflow-y:auto;padding:20px;">
                ${favorites.length > 0 ? `
                    <div style="margin-bottom:30px;">
                        <h3 style="margin:0 0 15px 0;font-size:18px;color:#fbbf24;">⭐ Favorites</h3>
                        ${favorites.map(coin => this.renderCoinCard(coin)).join('')}
                    </div>
                ` : ''}
                
                <div>
                    <h3 style="margin:0 0 15px 0;font-size:18px;">All Cryptocurrencies</h3>
                    ${others.map(coin => this.renderCoinCard(coin)).join('')}
                </div>
                
                ${coins.length === 0 ? `
                    <div style="text-align:center;padding:60px 20px;color:#64748b;">
                        <div style="font-size:48px;margin-bottom:20px;">🔍</div>
                        <div style="font-size:18px;font-weight:600;margin-bottom:10px;">No coins found</div>
                        <div>Try adjusting your search</div>
                    </div>
                ` : ''}
            </div>
        `;
    },

    renderCoinCard(coin) {
        const isFavorite = this.state.favorites.has(coin.id);
        const price24h = coin.price_change_percentage_24h;
        
        // Your existing renderCoinCard logic...
        return `
            <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;margin-bottom:15px;cursor:pointer;transition:all 0.2s;" 
                 data-action="select-coin" 
                 data-coin-id="${coin.id}"
                 onmouseover="this.style.background='#334155'"
                 onmouseout="this.style.background='#1e293b'">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div style="display:flex;align-items:center;gap:15px;flex:1;">
                        <img src="${coin.image}" alt="${coin.name}" style="width:40px;height:40px;border-radius:50%;" />
                        <div style="flex:1;">
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:5px;">
                                <span style="font-weight:700;font-size:16px;">${coin.name}</span>
                                <span style="color:#94a3b8;text-transform:uppercase;font-size:12px;font-weight:600;">${coin.symbol}</span>
                                <span style="background:#334155;padding:2px 8px;border-radius:4px;font-size:11px;color:#94a3b8;">
                                    #${coin.market_cap_rank || 'N/A'}
                                </span>
                            </div>
                            <div style="font-size:20px;font-weight:700;color:#f1f5f9;">
                                ${this.formatPrice(coin.current_price)}
                            </div>
                        </div>
                    </div>
                    
                    <div style="text-align:right;display:flex;align-items:center;gap:20px;">
                        <div>
                            <div style="font-size:18px;font-weight:700;color:${this.getPercentColor(price24h)};">
                                ${this.formatPercent(price24h)}
                            </div>
                            <div style="font-size:12px;color:#94a3b8;margin-top:5px;">
                                MCap: ${this.formatMarketCap(coin.market_cap)}
                            </div>
                        </div>
                        <button 
                            data-action="toggle-favorite" 
                            data-coin-id="${coin.id}"
                            style="background:none;border:none;font-size:24px;cursor:pointer;padding:5px;"
                            onclick="event.stopPropagation()">
                            ${isFavorite ? '⭐' : '☆'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    renderDetail() {
        if (!this.state.selectedCoin) {
            // Loading state for detail view
            return `
                <div style="text-align:center;padding:60px 20px;color:#64748b;flex:1;overflow-y:auto;">
                    <div style="font-size:48px;margin-bottom:20px;">⏳</div>
                    <div style="font-size:18px;font-weight:600;margin-bottom:10px;">Loading Coin Details...</div>
                    <div>Please wait while we fetch the data</div>
                </div>
            `;
        }
        
        const coin = this.state.selectedCoin;
        const market = coin.market_data;
        
        // Your existing renderDetail logic...
        return `
            <div style="flex:1;overflow-y:auto;padding:30px;">
                <div style="max-width:900px;margin:0 auto;">
                    <div style="display:flex;align-items:center;gap:20px;margin-bottom:30px;">
                        <img src="${coin.image.large}" alt="${coin.name}" style="width:80px;height:80px;border-radius:50%;" />
                        <div>
                            <h1 style="margin:0 0 5px 0;font-size:32px;font-weight:700;">${coin.name}</h1>
                            <div style="color:#94a3b8;font-size:16px;text-transform:uppercase;font-weight:600;">
                                ${coin.symbol} • Rank #${coin.market_cap_rank}
                            </div>
                        </div>
                    </div>

                    <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:30px;margin-bottom:30px;">
                        <div style="font-size:14px;color:#94a3b8;margin-bottom:10px;">Current Price</div>
                        <div style="font-size:42px;font-weight:700;margin-bottom:20px;">
                            ${this.formatPrice(market.current_price.usd)}
                        </div>
                        
                        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">
                            <div>
                                <div style="font-size:12px;color:#94a3b8;margin-bottom:5px;">24h Change</div>
                                <div style="font-size:20px;font-weight:700;color:${this.getPercentColor(market.price_change_percentage_24h)};">
                                    ${this.formatPercent(market.price_change_percentage_24h)}
                                </div>
                            </div>
                            <div>
                                <div style="font-size:12px;color:#94a3b8;margin-bottom:5px;">7d Change</div>
                                <div style="font-size:20px;font-weight:700;color:${this.getPercentColor(market.price_change_percentage_7d)};">
                                    ${this.formatPercent(market.price_change_percentage_7d)}
                                </div>
                            </div>
                            <div>
                                <div style="font-size:12px;color:#94a3b8;margin-bottom:5px;">30d Change</div>
                                <div style="font-size:20px;font-weight:700;color:${this.getPercentColor(market.price_change_percentage_30d)};">
                                    ${this.formatPercent(market.price_change_percentage_30d)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;margin-bottom:30px;">
                        <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;">
                            <div style="font-size:12px;color:#94a3b8;margin-bottom:5px;">Market Cap</div>
                            <div style="font-size:24px;font-weight:700;">${this.formatMarketCap(market.market_cap.usd)}</div>
                        </div>
                        <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;">
                            <div style="font-size:12px;color:#94a3b8;margin-bottom:5px;">24h Volume</div>
                            <div style="font-size:24px;font-weight:700;">${this.formatMarketCap(market.total_volume.usd)}</div>
                        </div>
                        <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;">
                            <div style="font-size:12px;color:#94a3b8;margin-bottom:5px;">Circulating Supply</div>
                            <div style="font-size:24px;font-weight:700;">${market.circulating_supply.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                        </div>
                        <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;">
                            <div style="font-size:12px;color:#94a3b8;margin-bottom:5px;">Max Supply</div>
                            <div style="font-size:24px;font-weight:700;">${market.max_supply ? market.max_supply.toLocaleString(undefined, {maximumFractionDigits: 0}) : 'Unlimited'}</div>
                        </div>
                    </div>

                    ${coin.description && coin.description.en ? `
                        <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;">
                            <h3 style="margin:0 0 15px 0;font-size:18px;">About ${coin.name}</h3>
                            <div style="line-height:1.8;color:#cbd5e1;">
                                ${coin.description.en.split('</p>')[0]}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    attachEventListeners() {
        // Search input
        const searchInput = this.container.querySelector('[data-input="search"]');
        if (searchInput) {
            // Added a debounce for better performance on rapid typing
            let timeout = null;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.state.searchTerm = e.target.value;
                    this.render();
                }, 300); 
            });
        }

        // Refresh button
        const refreshBtn = this.container.querySelector('[data-action="refresh"]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.fetchCoins());
        }

        // Back button
        const backBtn = this.container.querySelector('[data-action="back"]');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.state.view = 'list';
                this.state.selectedCoin = null;
                this.render();
            });
        }

        // Favorite toggles
        this.container.querySelectorAll('[data-action="toggle-favorite"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const coinId = btn.dataset.coinId;
                this.toggleFavorite(coinId);
            });
        });

        // Coin selection
        this.container.querySelectorAll('[data-action="select-coin"]').forEach(card => {
            card.addEventListener('click', () => {
                const coinId = card.dataset.coinId;
                this.fetchCoinDetail(coinId);
            });
        });
    }
  };

  // Register with AppRegistry (CORRECTED METHOD AND STRUCTURE)
  if (window.AppRegistry) {
    window.AppRegistry.registerApp({ // Changed to registerApp
      id: 'crypto-dashboard',
      name: 'Crypto Dashboard',
      // Using metadata icon since it's just a string, convert it to SVG/data URI if needed for consistency with news.js
      icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%23fbbf24' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'/><path d='M7.5 10.5 12 13l4.5-2.5'/><path d='m12 2v20'/></svg>",
      handler: () => window.CryptoApp.open(),
      singleInstance: true
    });
  }

  // Register documentation
  (function registerCryptoDoc() {
    const tryRegister = () => {
      if (window.Docs && window.Docs.initialized && typeof window.Docs.register === 'function') {
        window.Docs.register('crypto-dashboard', {
          name: "Crypto Dashboard",
          version: "1.0.0",
          description: "Real-time cryptocurrency prices, market capitalization, and daily change percentages sourced from CoinGecko.",
          type: "User",
          features: [
            "Top 100 cryptocurrencies by market cap",
            "Real-time price, 24h/7d change, and volume",
            "Favorite coins list saved locally",
            "Search and sort capabilities",
            "Detailed coin view with market data",
            "Auto-refresh every 60 seconds",
            "No API key required"
          ],
          methods: [
            { name: "open()", description: "Open the crypto dashboard window." },
            { name: "cleanup()", description: "Clear auto-refresh timer and clean up resources." }
          ],
          autoGenerated: false
        });
        console.log('Crypto Dashboard documentation registered');
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

