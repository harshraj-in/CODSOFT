/**
 * Calculator – Core Logic
 * Handles user input via event listeners, performs arithmetic
 * using if-else/operator logic, and updates the display.
 */

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────
  let currentInput = '0';
  let previousInput = '';
  let operator = null;
  let shouldResetDisplay = false;
  let lastResult = null;

  // ── DOM References ─────────────────────────────────────
  const displayCurrent = document.getElementById('display-current');
  const displayExpression = document.getElementById('display-expression');
  const buttonsGrid = document.querySelector('.buttons-grid');

  // ── Helpers ────────────────────────────────────────────

  /** Format a number for display (commas, max decimals). */
  function formatNumber(numStr) {
    if (numStr === 'Error') return 'Error';
    const num = parseFloat(numStr);
    if (isNaN(num)) return '0';

    // If it's a decimal with trailing zeros being typed, keep raw
    if (numStr.includes('.') && numStr.endsWith('.')) {
      const parts = numStr.split('.');
      return Number(parts[0]).toLocaleString('en-US') + '.';
    }

    // Limit to 12 significant digits
    if (Math.abs(num) >= 1e12) {
      return num.toExponential(4);
    }

    const formatted = parseFloat(num.toPrecision(12));
    return formatted.toLocaleString('en-US', { maximumFractionDigits: 10 });
  }

  /** Get operator symbol for display */
  function getOperatorSymbol(op) {
    const symbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };
    return symbols[op] || op;
  }

  /** Perform the calculation */
  function calculate(a, b, op) {
    const numA = parseFloat(a);
    const numB = parseFloat(b);

    if (isNaN(numA) || isNaN(numB)) return 'Error';

    let result;

    if (op === '+') {
      result = numA + numB;
    } else if (op === '-') {
      result = numA - numB;
    } else if (op === '*') {
      result = numA * numB;
    } else if (op === '/') {
      if (numB === 0) return 'Error';
      result = numA / numB;
    } else {
      return 'Error';
    }

    // Round to avoid floating point issues
    return parseFloat(result.toPrecision(12)).toString();
  }

  /** Adjust font size based on content length */
  function adjustFontSize() {
    const len = currentInput.replace('-', '').length;
    displayCurrent.classList.remove('shrink', 'shrink-more');
    if (len > 12) {
      displayCurrent.classList.add('shrink-more');
    } else if (len > 9) {
      displayCurrent.classList.add('shrink');
    }
  }

  /** Update the display elements */
  function updateDisplay() {
    displayCurrent.textContent = formatNumber(currentInput);
    adjustFontSize();
  }

  /** Flash the result with animation */
  function flashResult() {
    displayCurrent.classList.remove('result-flash');
    // Force reflow
    void displayCurrent.offsetWidth;
    displayCurrent.classList.add('result-flash');
  }

  /** Create a ripple effect at click position */
  function createRipple(e, button) {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    button.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  /** Clear active state from operator buttons */
  function clearOperatorActive() {
    document.querySelectorAll('.btn-operator').forEach(btn => {
      btn.classList.remove('active');
    });
  }

  // ── Action Handlers ────────────────────────────────────

  function handleNumber(value) {
    if (currentInput === 'Error') {
      currentInput = value;
      shouldResetDisplay = false;
      updateDisplay();
      return;
    }

    if (shouldResetDisplay) {
      currentInput = value;
      shouldResetDisplay = false;
    } else {
      if (currentInput === '0' && value !== '.') {
        currentInput = value;
      } else {
        // Limit input length
        if (currentInput.replace('.', '').replace('-', '').length >= 15) return;
        currentInput += value;
      }
    }
    updateDisplay();
  }

  function handleDecimal() {
    if (shouldResetDisplay) {
      currentInput = '0.';
      shouldResetDisplay = false;
    } else if (!currentInput.includes('.')) {
      currentInput += '.';
    }
    updateDisplay();
  }

  function handleOperator(value) {
    clearOperatorActive();

    if (operator && !shouldResetDisplay) {
      // Chain calculation
      const result = calculate(previousInput, currentInput, operator);
      currentInput = result;
      updateDisplay();
      if (result === 'Error') {
        resetState();
        displayCurrent.textContent = 'Error';
        return;
      }
      flashResult();
    }

    previousInput = currentInput;
    operator = value;
    shouldResetDisplay = true;
    displayExpression.textContent = formatNumber(previousInput) + ' ' + getOperatorSymbol(value);

    // Highlight active operator button
    const opButtons = document.querySelectorAll('.btn-operator');
    for (let i = 0; i < opButtons.length; i++) {
      if (opButtons[i].dataset.value === value) {
        opButtons[i].classList.add('active');
        break;
      }
    }
  }

  function handleEquals() {
    clearOperatorActive();

    if (!operator || previousInput === '') return;

    const expression = formatNumber(previousInput) + ' ' + getOperatorSymbol(operator) + ' ' + formatNumber(currentInput);
    const result = calculate(previousInput, currentInput, operator);

    displayExpression.textContent = expression + ' =';
    currentInput = result;
    lastResult = result;
    previousInput = '';
    operator = null;
    shouldResetDisplay = true;

    updateDisplay();
    if (result !== 'Error') {
      flashResult();
    }
  }

  function handleClear() {
    resetState();
    updateDisplay();
    displayExpression.textContent = '';
    clearOperatorActive();
  }

  function handleSign() {
    if (currentInput === '0' || currentInput === 'Error') return;

    if (currentInput.startsWith('-')) {
      currentInput = currentInput.substring(1);
    } else {
      currentInput = '-' + currentInput;
    }
    updateDisplay();
  }

  function handlePercent() {
    if (currentInput === 'Error') return;

    const num = parseFloat(currentInput);
    if (isNaN(num)) return;

    currentInput = (num / 100).toString();
    updateDisplay();
  }

  function resetState() {
    currentInput = '0';
    previousInput = '';
    operator = null;
    shouldResetDisplay = false;
    lastResult = null;
  }

  // ── Event Delegation ───────────────────────────────────
  buttonsGrid.addEventListener('click', function (e) {
    const button = e.target.closest('.btn');
    if (!button) return;

    createRipple(e, button);

    const action = button.dataset.action;
    const value = button.dataset.value;

    // When a number or decimal is pressed, clear operator highlight
    if (action === 'number' || action === 'decimal') {
      clearOperatorActive();
    }

    if (action === 'number') {
      handleNumber(value);
    } else if (action === 'decimal') {
      handleDecimal();
    } else if (action === 'operator') {
      handleOperator(value);
    } else if (action === 'equals') {
      handleEquals();
    } else if (action === 'clear') {
      handleClear();
    } else if (action === 'sign') {
      handleSign();
    } else if (action === 'percent') {
      handlePercent();
    }
  });

  // ── Keyboard Support ───────────────────────────────────
  document.addEventListener('keydown', function (e) {
    const key = e.key;

    if (key >= '0' && key <= '9') {
      handleNumber(key);
      clearOperatorActive();
    } else if (key === '.') {
      handleDecimal();
      clearOperatorActive();
    } else if (key === '+') {
      handleOperator('+');
    } else if (key === '-') {
      handleOperator('-');
    } else if (key === '*') {
      handleOperator('*');
    } else if (key === '/') {
      e.preventDefault();
      handleOperator('/');
    } else if (key === 'Enter' || key === '=') {
      handleEquals();
    } else if (key === 'Escape' || key === 'c' || key === 'C') {
      handleClear();
    } else if (key === '%') {
      handlePercent();
    } else if (key === 'Backspace') {
      if (currentInput.length > 1 && currentInput !== 'Error') {
        currentInput = currentInput.slice(0, -1);
        if (currentInput === '-') currentInput = '0';
      } else {
        currentInput = '0';
      }
      updateDisplay();
    }
  });

  // ── Theme Switcher ──────────────────────────────────────
  const themeToggle = document.getElementById('theme-toggle');
  let currentTheme = localStorage.getItem('theme') || 'dark';

  // Apply initial theme
  if (currentTheme === 'light') {
    document.documentElement.classList.add('light-theme');
  }

  themeToggle.addEventListener('click', () => {
    if (document.documentElement.classList.contains('light-theme')) {
      document.documentElement.classList.remove('light-theme');
      currentTheme = 'dark';
    } else {
      document.documentElement.classList.add('light-theme');
      currentTheme = 'light';
    }
    localStorage.setItem('theme', currentTheme);
  });

  // ── Canvas Interactive Animation ─────────────────────────
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  const stars = [];
  const balls = [];
  const mouse = { x: null, y: null, radius: 120 };

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initParticles();
  });

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  class Star {
    constructor() {
      this.reset();
      this.y = Math.random() * height; // initial distribution
    }

    reset() {
      this.x = Math.random() * width;
      this.y = 0;
      this.size = Math.random() * 1.5 + 0.5;
      this.speed = Math.random() * 0.3 + 0.1;
      this.alpha = Math.random() * 0.5 + 0.3;
      this.twinkleSpeed = Math.random() * 0.02 + 0.005;
      this.hue = Math.floor(Math.random() * 360);
    }

    update() {
      this.y += this.speed;
      this.alpha += this.twinkleSpeed;
      if (this.alpha > 0.95 || this.alpha < 0.2) {
        this.twinkleSpeed = -this.twinkleSpeed;
      }
      if (this.y > height) {
        this.reset();
      }
    }

    draw() {
      if (currentTheme === 'dark') {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      } else {
        ctx.fillStyle = `hsla(${this.hue}, 85%, 50%, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.6, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  }

  function initParticles() {
    stars.length = 0;

    // Scale count based on screen size (denser starfield since balls are removed)
    const starCount = Math.floor((width * height) / 8000);

    for (let i = 0; i < starCount; i++) {
      stars.push(new Star());
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Render & update stars
    for (let i = 0; i < stars.length; i++) {
      stars[i].update();
      stars[i].draw();
    }

    requestAnimationFrame(animate);
  }

  initParticles();
  animate();

  // ── Initial render ─────────────────────────────────────
  updateDisplay();
})();
