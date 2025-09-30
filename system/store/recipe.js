// recipe.js - Recipe Browser Application
// FILE: applications/recipe.js
// VERSION: 1.0.0
// BUILD DATE: 2025-09-30
//
// PURPOSE:
//   Browse, search, and view recipes using TheMealDB API.
//
// SETUP:
//   1. TheMealDB API is free and requires no key.
//   2. Provides access to 300+ recipes with images and instructions.
//
// ARCHITECTURE:
//   IIFE / window.RecipeApp, renders via WindowManager, single instance.

(function(){
  window.RecipeApp = {
    // Application Metadata and State
    metadata: {
        name: 'Recipe Browser',
        version: '1.0.0',
        icon: '🍽️',
        author: 'edmundsparrow',
        description: 'Browse and search recipes from around the world'
    },

    state: {
        recipes: [],
        favorites: new Set(JSON.parse(localStorage.getItem('recipeFavorites') || '[]')),
        selectedRecipe: null,
        searchTerm: '',
        category: 'all',
        area: 'all',
        categories: [],
        areas: [],
        view: 'grid', // 'grid' or 'detail'
        currentWindow: null,
        loading: false
    },

    API_BASE: 'https://www.themealdb.com/api/json/v1/1',

    // --- Core Window Management Methods ---

    open() {
        const browserHTML = `
            <div id="recipe-app-container" style="
              display: flex;
              flex-direction: column;
              height: 100%;
            ">
            </div>
        `;
        
        const win = window.WindowManager.createWindow(
            'Recipe Browser', browserHTML, 420, 600
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

        this.init(win.querySelector('#recipe-app-container'));
        return win;
    },

    init(container) {
        this.container = container;
        this.loadFavorites();
        this.render();
        this.fetchInitialData();
    },

    cleanup() {
      if (this.container) {
          this.container.innerHTML = '';
      }
      this.state.currentWindow = null;
    },

    // --- Data and State Management ---

    loadFavorites() {
        try {
            const saved = localStorage.getItem('recipeFavorites');
            this.state.favorites = new Set(JSON.parse(saved || '[]'));
        } catch (e) {
            this.state.favorites = new Set();
        }
    },

    saveFavorites() {
        localStorage.setItem('recipeFavorites', 
            JSON.stringify([...this.state.favorites]));
    },

    async fetchInitialData() {
        this.state.loading = true;
        this.render();
        
        try {
            // Fetch categories and areas
            const [categoriesRes, areasRes] = await Promise.all([
                fetch(`${this.API_BASE}/list.php?c=list`),
                fetch(`${this.API_BASE}/list.php?a=list`)
            ]);

            const categoriesData = await categoriesRes.json();
            const areasData = await areasRes.json();

            this.state.categories = categoriesData.meals || [];
            this.state.areas = areasData.meals || [];

            // Fetch initial recipes (random selection)
            await this.searchRecipes();
        } catch (error) {
            this.showError('Failed to load recipe data.');
            console.error('Recipe API Error:', error);
        } finally {
            this.state.loading = false;
            this.render();
        }
    },

    async searchRecipes(query = '') {
        this.state.loading = true;
        this.render();

        try {
            let url;
            
            if (query) {
                url = `${this.API_BASE}/search.php?s=${encodeURIComponent(query)}`;
            } else if (this.state.category !== 'all') {
                url = `${this.API_BASE}/filter.php?c=${encodeURIComponent(this.state.category)}`;
            } else if (this.state.area !== 'all') {
                url = `${this.API_BASE}/filter.php?a=${encodeURIComponent(this.state.area)}`;
            } else {
                // Get random recipes
                const promises = Array(12).fill().map(() => 
                    fetch(`${this.API_BASE}/random.php`).then(r => r.json())
                );
                const results = await Promise.all(promises);
                this.state.recipes = results.map(r => r.meals[0]).filter(Boolean);
                this.state.loading = false;
                this.render();
                return;
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error(`API request failed: HTTP ${response.status}`);
            
            const data = await response.json();
            this.state.recipes = data.meals || [];
        } catch (error) {
            this.showError('Failed to search recipes.');
            console.error('Recipe Search Error:', error);
            this.state.recipes = [];
        } finally {
            this.state.loading = false;
            this.render();
        }
    },

    async fetchRecipeDetail(recipeId) {
        try {
            this.state.view = 'detail';
            this.state.selectedRecipe = null;
            this.render();

            const response = await fetch(`${this.API_BASE}/lookup.php?i=${recipeId}`);
            if (!response.ok) throw new Error(`API request failed: HTTP ${response.status}`);
            
            const data = await response.json();
            this.state.selectedRecipe = data.meals ? data.meals[0] : null;
            this.render();
        } catch (error) {
            this.showError('Failed to fetch recipe details.');
            console.error('Recipe Detail Error:', error);
            this.state.view = 'grid';
            this.render();
        }
    },

    toggleFavorite(recipeId) {
        if (this.state.favorites.has(recipeId)) {
            this.state.favorites.delete(recipeId);
        } else {
            this.state.favorites.add(recipeId);
        }
        this.saveFavorites();
        this.render();
    },

    // --- Utility Methods ---

    getIngredients(recipe) {
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = recipe[`strIngredient${i}`];
            const measure = recipe[`strMeasure${i}`];
            if (ingredient && ingredient.trim()) {
                ingredients.push({
                    ingredient: ingredient.trim(),
                    measure: measure ? measure.trim() : ''
                });
            }
        }
        return ingredients;
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
            <div style="display:flex;flex-direction:column;height:100%;background:#fef3c7;color:#292524;font-family:system-ui,-apple-system,sans-serif;">
                ${this.renderHeader()}
                ${this.state.view === 'grid' ? this.renderGrid() : this.renderDetail()}
            </div>
        `;

        this.attachEventListeners();
    },

    renderHeader() {
        return `
            <div style="background:#f59e0b;padding:20px;border-bottom:2px solid #d97706;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                    <h2 style="margin:0;font-size:24px;font-weight:700;color:white;">🍽️ Recipe Browser</h2>
                    ${this.state.view === 'detail' ? `
                        <button data-action="back" style="background:white;color:#f59e0b;border:none;padding:10px 20px;border-radius:6px;cursor:pointer;font-weight:600;">
                            ← Back
                        </button>
                    ` : ''}
                </div>
                ${this.state.view === 'grid' ? `
                    <input 
                        type="text" 
                        data-input="search"
                        placeholder="Search recipes..."
                        value="${this.state.searchTerm}"
                        style="width:100%;padding:12px;background:white;border:1px solid #d97706;border-radius:6px;color:#292524;font-size:14px;margin-bottom:10px;"
                    />
                    <div style="display:flex;gap:10px;">
                        <select data-select="category" style="flex:1;padding:8px;border:1px solid #d97706;border-radius:6px;background:white;">
                            <option value="all">All Categories</option>
                            ${this.state.categories.map(c => `
                                <option value="${c.strCategory}" ${this.state.category === c.strCategory ? 'selected' : ''}>
                                    ${c.strCategory}
                                </option>
                            `).join('')}
                        </select>
                        <select data-select="area" style="flex:1;padding:8px;border:1px solid #d97706;border-radius:6px;background:white;">
                            <option value="all">All Cuisines</option>
                            ${this.state.areas.map(a => `
                                <option value="${a.strArea}" ${this.state.area === a.strArea ? 'selected' : ''}>
                                    ${a.strArea}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                ` : ''}
            </div>
        `;
    },

    renderGrid() {
        if (this.state.loading) {
            return `
                <div style="text-align:center;padding:60px 20px;color:#78716c;flex:1;overflow-y:auto;">
                    <div style="font-size:48px;margin-bottom:20px;">🍳</div>
                    <div style="font-size:18px;font-weight:600;margin-bottom:10px;">Loading Recipes...</div>
                    <div>Fetching delicious recipes</div>
                </div>
            `;
        }

        if (this.state.recipes.length === 0) {
            return `
                <div style="text-align:center;padding:60px 20px;color:#78716c;flex:1;overflow-y:auto;">
                    <div style="font-size:48px;margin-bottom:20px;">🔍</div>
                    <div style="font-size:18px;font-weight:600;margin-bottom:10px;">No recipes found</div>
                    <div>Try adjusting your search or filters</div>
                </div>
            `;
        }

        return `
            <div style="flex:1;overflow-y:auto;padding:20px;">
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:15px;">
                    ${this.state.recipes.map(recipe => this.renderRecipeCard(recipe)).join('')}
                </div>
            </div>
        `;
    },

    renderRecipeCard(recipe) {
        const isFavorite = this.state.favorites.has(recipe.idMeal);
        
        return `
            <div style="background:white;border:2px solid #fbbf24;border-radius:12px;overflow:hidden;cursor:pointer;transition:transform 0.2s;" 
                 data-action="select-recipe" 
                 data-recipe-id="${recipe.idMeal}"
                 onmouseover="this.style.transform='translateY(-4px)'"
                 onmouseout="this.style.transform='translateY(0)'">
                <div style="position:relative;">
                    <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" style="width:100%;height:150px;object-fit:cover;" />
                    <button 
                        data-action="toggle-favorite" 
                        data-recipe-id="${recipe.idMeal}"
                        style="position:absolute;top:8px;right:8px;background:rgba(255,255,255,0.9);border:none;font-size:20px;cursor:pointer;padding:5px;border-radius:50%;width:32px;height:32px;"
                        onclick="event.stopPropagation()">
                        ${isFavorite ? '⭐' : '☆'}
                    </button>
                </div>
                <div style="padding:12px;">
                    <div style="font-weight:700;font-size:14px;margin-bottom:5px;line-height:1.3;">
                        ${recipe.strMeal}
                    </div>
                    ${recipe.strCategory ? `
                        <div style="font-size:11px;color:#78716c;background:#fef3c7;padding:3px 8px;border-radius:4px;display:inline-block;">
                            ${recipe.strCategory}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    renderDetail() {
        if (!this.state.selectedRecipe) {
            return `
                <div style="text-align:center;padding:60px 20px;color:#78716c;flex:1;overflow-y:auto;">
                    <div style="font-size:48px;margin-bottom:20px;">⏳</div>
                    <div style="font-size:18px;font-weight:600;margin-bottom:10px;">Loading Recipe...</div>
                </div>
            `;
        }
        
        const recipe = this.state.selectedRecipe;
        const ingredients = this.getIngredients(recipe);
        
        return `
            <div style="flex:1;overflow-y:auto;padding:20px;">
                <div style="max-width:700px;margin:0 auto;">
                    <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" style="width:100%;height:250px;object-fit:cover;border-radius:12px;margin-bottom:20px;" />
                    
                    <h1 style="margin:0 0 10px 0;font-size:28px;font-weight:700;">${recipe.strMeal}</h1>
                    
                    <div style="display:flex;gap:10px;margin-bottom:20px;">
                        ${recipe.strCategory ? `<span style="background:#fbbf24;color:white;padding:5px 12px;border-radius:6px;font-size:12px;font-weight:600;">${recipe.strCategory}</span>` : ''}
                        ${recipe.strArea ? `<span style="background:#f59e0b;color:white;padding:5px 12px;border-radius:6px;font-size:12px;font-weight:600;">${recipe.strArea}</span>` : ''}
                    </div>

                    <div style="background:white;border:2px solid #fbbf24;border-radius:12px;padding:20px;margin-bottom:20px;">
                        <h3 style="margin:0 0 15px 0;font-size:18px;color:#f59e0b;">📋 Ingredients</h3>
                        <ul style="list-style:none;padding:0;margin:0;">
                            ${ingredients.map(ing => `
                                <li style="padding:8px 0;border-bottom:1px solid #fef3c7;">
                                    <span style="font-weight:600;">${ing.ingredient}</span>
                                    ${ing.measure ? `<span style="color:#78716c;"> - ${ing.measure}</span>` : ''}
                                </li>
                            `).join('')}
                        </ul>
                    </div>

                    <div style="background:white;border:2px solid #fbbf24;border-radius:12px;padding:20px;margin-bottom:20px;">
                        <h3 style="margin:0 0 15px 0;font-size:18px;color:#f59e0b;">👨‍🍳 Instructions</h3>
                        <div style="line-height:1.8;white-space:pre-line;">
                            ${recipe.strInstructions}
                        </div>
                    </div>

                    ${recipe.strYoutube ? `
                        <div style="background:white;border:2px solid #fbbf24;border-radius:12px;padding:20px;">
                            <h3 style="margin:0 0 15px 0;font-size:18px;color:#f59e0b;">📺 Video Tutorial</h3>
                            <a href="${recipe.strYoutube}" target="_blank" style="display:inline-block;background:#dc2626;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">
                                Watch on YouTube
                            </a>
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
            let timeout = null;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.state.searchTerm = e.target.value;
                    this.state.category = 'all';
                    this.state.area = 'all';
                    this.searchRecipes(this.state.searchTerm);
                }, 500);
            });
        }

        // Category select
        const categorySelect = this.container.querySelector('[data-select="category"]');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.state.category = e.target.value;
                this.state.area = 'all';
                this.state.searchTerm = '';
                this.searchRecipes();
            });
        }

        // Area select
        const areaSelect = this.container.querySelector('[data-select="area"]');
        if (areaSelect) {
            areaSelect.addEventListener('change', (e) => {
                this.state.area = e.target.value;
                this.state.category = 'all';
                this.state.searchTerm = '';
                this.searchRecipes();
            });
        }

        // Back button
        const backBtn = this.container.querySelector('[data-action="back"]');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.state.view = 'grid';
                this.state.selectedRecipe = null;
                this.render();
            });
        }

        // Favorite toggles
        this.container.querySelectorAll('[data-action="toggle-favorite"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const recipeId = btn.dataset.recipeId;
                this.toggleFavorite(recipeId);
            });
        });

        // Recipe selection
        this.container.querySelectorAll('[data-action="select-recipe"]').forEach(card => {
            card.addEventListener('click', () => {
                const recipeId = card.dataset.recipeId;
                this.fetchRecipeDetail(recipeId);
            });
        });
    }
  };

  // Register with AppRegistry
  if (window.AppRegistry) {
    window.AppRegistry.registerApp({
      id: 'recipe-browser',
      name: 'Recipe Browser',
      icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%23f59e0b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2'/><path d='M7 2v20'/><path d='M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7'/></svg>",
      handler: () => window.RecipeApp.open(),
      singleInstance: true
    });
  }

  // Register documentation
  (function registerRecipeDoc() {
    const tryRegister = () => {
      if (window.Docs && window.Docs.initialized && typeof window.Docs.register === 'function') {
        window.Docs.register('recipe-browser', {
          name: "Recipe Browser",
          version: "1.0.0",
          description: "Browse and search recipes from TheMealDB with detailed instructions and ingredients.",
          type: "User",
          features: [
            "300+ recipes from around the world",
            "Search by recipe name",
            "Filter by category and cuisine",
            "Detailed instructions and ingredients",
            "Video tutorial links (YouTube)",
            "Favorites list saved locally",
            "No API key required"
          ],
          methods: [
            { name: "open()", description: "Open the recipe browser window." },
            { name: "cleanup()", description: "Clean up resources when window closes." }
          ],
          autoGenerated: false
        });
        console.log('Recipe Browser documentation registered');
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

