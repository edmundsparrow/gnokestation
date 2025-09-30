// calculator.js - Simple Calculator Application
/**
 * FILE: applications/calculator.js
 * VERSION: 1.0.3 // Updated version
 * BUILD DATE: 2025-09-26
 *
 * PURPOSE:
 * Lightweight calculator app with continuous calculations and
 * error-free input handling.
 */

(function() {
  window.CalculatorApp = {
    currentExpression: '0',
    // We'll rename this flag for clearer intent
    // It indicates the display holds a final result and the next input
    // should either clear the expression (if a number is pressed) 
    // or append an operator (if an operator is pressed).
    isResultDisplayed: false, 

    open() {
      const html = `
        <div class="calc-container" style="display:flex;flex-direction:column;height:100%;font-family:'Segoe UI',sans-serif;background:#DEE8F5;">
          <div style="padding:10px;background:#E4EAF2;border-bottom:1px solid #C4D3E3">
            <div id="calc-display" style="
              background:#fff;color:#1F4765;font-family:monospace;
              font-size:24px;font-weight:600;padding:8px 12px;
              border:1px solid #A5BBD9;border-radius:3px;text-align:right;
              min-height:36px;box-shadow:inset 0 1px 3px rgba(0,0,0,0.1);
            ">0</div>
          </div>
          <div class="calc-grid" style="flex:1;display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:4px;">
            ${this.buttons().map(b => this.buttonHTML(b)).join('')}
          </div>
        </div>
      `;

      const win = WindowManager.createWindow('Calculator', html, 320, 400);
      this.setup(win);
      return win;
    },

    buttons() {
      return [
        { label: 'C', action: 'clear', type: 'util' },
        { label: '⌫', action: 'backspace', type: 'util' },
        { label: '%', value: '%', type: 'op' },
        { label: '÷', value: '/', type: 'op' },
        { label: '7', value: '7' }, { label: '8', value: '8' }, { label: '9', value: '9' }, { label: '×', value: '*', type: 'op' },
        { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' }, { label: '−', value: '-', type: 'op' },
        { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '+', value: '+', type: 'op' },
        { label: '0', value: '0', span:2 }, { label: '.', value: '.' }, { label: '=', action: 'equals', type: 'eq' }
      ];
    },

    buttonHTML(b) {
      const styles = {
        num: "background:linear-gradient(#F7F9FB,#EAEFF7);color:#000;",
        op: "background:linear-gradient(#E8F0F7,#D9E3F0);color:#1F4765;",
        eq: "background:linear-gradient(#89B6D7,#4D8BC1);color:white;",
        util: "background:linear-gradient(#F0F5F9,#DDE6F0);color:#000;"
      };
      const style = b.type ? styles[b.type] : styles.num;
      return `
        <button class="calc-btn ${b.type||'num'}"
          ${b.action ? `data-action="${b.action}"` : `data-value="${b.value}"`}
          style="${style}border:1px solid #B0C4DE;font-size:16px;font-weight:bold;
                 border-radius:3px;cursor:pointer;grid-column:span ${b.span||1};">
          ${b.label}
        </button>
      `;
    },

    setup(win) {
      const display = win.querySelector('#calc-display');

      win.addEventListener('click', e => {
        const btn = e.target.closest('.calc-btn');
        if (!btn) return;
        this.handleButton(btn, display);
      });

      win.addEventListener('keydown', e => {
        const map = { '/':'/', '*':'*', '-':'-', '+':'+', '%':'%', '.':'.' };
        if (/[0-9]/.test(e.key)) {
          this.handleValue(e.key, display);
        } else if (map[e.key]) {
          this.handleValue(map[e.key], display);
        } else if (['Enter','='].includes(e.key)) {
          this.calculate(display);
        } else if (['Escape','c','C'].includes(e.key)) {
          this.clear(display);
        } else if (e.key === 'Backspace') {
          this.backspace(display);
        }
      });

      win.tabIndex = 0; win.focus();
    },

    handleButton(btn, display) {
      const action = btn.dataset.action;
      const value = btn.dataset.value;
      if (action === 'clear') this.clear(display);
      else if (action === 'backspace') this.backspace(display);
      else if (action === 'equals') this.calculate(display);
      else if (value) this.handleValue(value, display);
    },

    // *** UPDATED METHOD ***
    handleValue(value, display) {
      const isOp = this.isOperator(value);
      
      // If a result is currently displayed:
      if (this.isResultDisplayed) {
        if (isOp) {
          // If an operator is pressed (e.g., '+', '*', etc.)
          // Append the operator to the result to continue the calculation.
          this.currentExpression += value;
          // The calculation has started again, so the result is no longer "final".
          this.isResultDisplayed = false;
        } else {
          // If a number is pressed (e.g., '5'), start a brand new calculation.
          this.currentExpression = value;
          this.isResultDisplayed = false;
        }
      } else {
        // Normal input when not coming from a final result.
        
        // Handle operator replacement (e.g., '4+' -> '4*')
        if (isOp && this.isOperator(this.currentExpression.slice(-1))) {
          this.currentExpression = this.currentExpression.slice(0, -1) + value;
        // Handle initial '0' replacement (e.g., '0' -> '5')
        } else if (this.currentExpression === '0' && !isOp) {
          this.currentExpression = value;
        // Normal append
        } else {
          this.currentExpression += value;
        }
      }
      this.updateDisplay(display);
    },

    clear(display) {
      this.currentExpression = '0';
      this.isResultDisplayed = false; // Updated flag name
      this.updateDisplay(display);
    },

    backspace(display) {
      if (this.currentExpression.length > 1) {
        this.currentExpression = this.currentExpression.slice(0, -1);
      } else {
        this.currentExpression = '0';
      }
      this.isResultDisplayed = false; // Updated flag name
      this.updateDisplay(display);
    },

    // *** UPDATED METHOD ***
    calculate(display) {
      // Prevent repeated '=' presses from recalculating the result.
      if (this.isResultDisplayed) return;
      
      try {
        let expr = this.currentExpression.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
        // Basic input sanitization before execution
        if (!/^[0-9+\-*/.% ()]+$/.test(expr)) throw new Error();
        
        // Use Function constructor for safe expression evaluation
        const result = Function('return ' + expr)(); 
        if (!isFinite(result)) throw new Error();

        this.currentExpression = this.formatResult(result);
        this.isResultDisplayed = true; // Set flag to indicate a final result is displayed
      } catch {
        this.currentExpression = 'Error';
        this.isResultDisplayed = true;
      }
      this.updateDisplay(display);
    },

    formatResult(n) {
      return (Math.abs(n) > 1e10 || (Math.abs(n) < 1e-6 && n !== 0))
        ? n.toExponential(6)
        : parseFloat(n.toFixed(10)).toString();
    },

    isOperator(c) { return '+-*/%.'.includes(c); },

    updateDisplay(display) {
      display.textContent = this.currentExpression
        .replace(/\*/g,'×').replace(/\//g,'÷').replace(/-/g,'−');
    }
  };

  if (window.AppRegistry) {
    AppRegistry.registerApp({
      id: 'calculator',
      name: 'Calculator',
      icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><rect x='4' y='4' width='40' height='40' rx='4' fill='url(%23g1)'/><defs><linearGradient id='g1' x1='0%' y1='0%' x2='0%' y2='100%'><stop offset='0%' style='stop-color:%23DDE6F0'/><stop offset='100%' style='stop-color:%23B0C4DE'/></linearGradient></defs><rect x='8' y='8' width='32' height='8' fill='%23FFFFFF' rx='2' stroke='%23A5BBD9'/><text x='24' y='14' font-size='6' fill='%231F4765' text-anchor='middle'>CALC</text><rect x='10' y='20' width='28' height='18' fill='url(%23g2)' rx='2'/><defs><linearGradient id='g2' x1='0%' y1='0%' x2='0%' y2='100%'><stop offset='0%' style='stop-color:%2389B6D7'/><stop offset='100%' style='stop-color:%234D8BC1'/></linearGradient></defs><text x='24' y='34' font-size='12' font-weight='bold' fill='%23FFFFFF' text-anchor='middle'>=</text></svg>",
      handler: () => window.CalculatorApp.open()
    });
  }
})();
