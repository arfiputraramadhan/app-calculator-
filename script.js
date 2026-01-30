class SurvivalCalculator {
    constructor() {
        this.currentMode = 'basic';
        this.memory = 0;
        this.history = [];
        this.currentExpression = '';
        this.angleMode = 'DEG';
        this.precision = 10;
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadFromStorage();
        this.updateUI();
    }
    
    initializeElements() {
        // Display elements
        this.expressionEl = document.getElementById('expression');
        this.resultEl = document.getElementById('result');
        this.memoryEl = document.getElementById('memory-value');
        this.angleUnitEl = document.getElementById('angle-unit');
        this.currentModeEl = document.getElementById('current-mode');
        this.precisionLevelEl = document.getElementById('precision-level');
        
        // Mode containers
        this.basicMode = document.getElementById('basic-mode');
        this.formulaMode = document.getElementById('formula-mode');
        this.historyPanel = document.getElementById('history-panel');
        
        // Formula mode elements
        this.formulaInput = document.getElementById('formula-input');
        this.formulaResult = document.getElementById('formula-result');
        this.precisionSelect = document.getElementById('precision-select');
        this.angleToggle = document.getElementById('angle-toggle');
        
        // History elements
        this.historyList = document.getElementById('history-list');
        this.totalCalcEl = document.getElementById('total-calc');
        this.precisionCalcEl = document.getElementById('precision-calc');
    }
    
    setupEventListeners() {
        // Mode tabs
        document.getElementById('basic-tab').addEventListener('click', () => this.switchMode('basic'));
        document.getElementById('formula-tab').addEventListener('click', () => this.switchMode('formula'));
        document.getElementById('history-tab').addEventListener('click', () => this.switchMode('history'));
        
        // Basic mode buttons
        document.querySelectorAll('#basic-mode .btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleButton(e.target.dataset.action));
        });
        
        // Formula mode
        document.getElementById('evaluate-formula').addEventListener('click', () => this.evaluateFormula());
        this.formulaInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.evaluateFormula();
        });
        
        // Example buttons
        document.querySelectorAll('.example-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.formulaInput.value = e.target.dataset.expr;
                this.evaluateFormula();
            });
        });
        
        // Precision control
        this.precisionSelect.addEventListener('change', (e) => {
            this.precision = parseInt(e.target.value);
            this.precisionLevelEl.textContent = `${this.precision} digit`;
            this.updateUI();
        });
        
        // Angle toggle
        this.angleToggle.addEventListener('change', (e) => {
            this.angleMode = e.target.checked ? 'RAD' : 'DEG';
            this.angleUnitEl.textContent = this.angleMode;
            math.config({angles: this.angleMode.toLowerCase()});
        });
        
        // Copy result
        document.getElementById('copy-result').addEventListener('click', () => {
            const text = this.formulaResult.innerText;
            if (text !== 'Hasil akan muncul di sini...') {
                navigator.clipboard.writeText(text);
                this.showToast('Hasil disalin!');
            }
        });
        
        // History clear
        document.getElementById('clear-history').addEventListener('click', () => this.clearHistory());
        
        // Keyboard support
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    switchMode(mode) {
        this.currentMode = mode;
        
        // Update tabs
        document.querySelectorAll('.mode-tab').forEach(tab => tab.classList.remove('active'));
        document.getElementById(`${mode}-tab`).classList.add('active');
        
        // Update content visibility
        this.basicMode.classList.remove('active-mode');
        this.formulaMode.style.display = 'none';
        this.historyPanel.style.display = 'none';
        
        if (mode === 'basic') {
            this.basicMode.classList.add('active-mode');
            this.currentModeEl.textContent = 'BIASA';
        } else if (mode === 'formula') {
            this.formulaMode.style.display = 'block';
            this.currentModeEl.textContent = 'RUMUS PRESISI';
        } else if (mode === 'history') {
            this.historyPanel.style.display = 'block';
            this.currentModeEl.textContent = 'RIWAYAT';
        }
        
        // Update mode description
        const descriptions = {
            basic: 'Kalkulator standar untuk perhitungan sehari-hari',
            formula: 'Mode presisi tinggi menggunakan Math.js untuk akurasi maksimal',
            history: 'Riwayat semua perhitungan yang telah dilakukan'
        };
        document.getElementById('mode-description').textContent = descriptions[mode];
        
        this.updateUI();
    }
    
    handleButton(action) {
        switch(action) {
            case 'C':
                this.clear();
                break;
            case '=':
                this.calculate();
                break;
            case '±':
                this.toggleSign();
                break;
            case 'sqrt':
                this.addToExpression('sqrt(');
                break;
            case 'square':
                this.addToExpression('^2');
                break;
            case 'sin':
            case 'cos':
            case 'tan':
            case 'log':
            case 'ln':
                this.addToExpression(`${action}(`);
                break;
            case 'pi':
                this.addToExpression('pi');
                break;
            case 'mc':
                this.memory = 0;
                this.updateMemoryDisplay();
                break;
            case 'mr':
                this.addToExpression(this.memory.toString());
                break;
            case 'm+':
                this.memory += parseFloat(this.resultEl.value) || 0;
                this.updateMemoryDisplay();
                break;
            case 'm-':
                this.memory -= parseFloat(this.resultEl.value) || 0;
                this.updateMemoryDisplay();
                break;
            default:
                this.addToExpression(action);
        }
    }
    
    addToExpression(value) {
        if (this.currentExpression === '0' && !isNaN(value)) {
            this.currentExpression = value;
        } else {
            this.currentExpression += value;
        }
        this.expressionEl.textContent = this.currentExpression;
    }
    
    clear() {
        this.currentExpression = '';
        this.expressionEl.textContent = '';
        this.resultEl.value = '0';
    }
    
    calculate() {
        if (!this.currentExpression) return;
        
        try {
            // Replace display symbols with math symbols
            let expr = this.currentExpression
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/\^2/g, '**2')
                .replace(/sqrt\(/g, 'sqrt(');
            
            // Handle angle conversion for basic trig functions
            if (this.angleMode === 'DEG') {
                expr = expr.replace(/sin\(/g, 'sin(pi/180*')
                          .replace(/cos\(/g, 'cos(pi/180*')
                          .replace(/tan\(/g, 'tan(pi/180*');
            }
            
            const result = math.evaluate(expr);
            const formattedResult = this.formatNumber(result);
            
            this.resultEl.value = formattedResult;
            this.addToHistory(this.currentExpression, formattedResult);
            this.currentExpression = formattedResult;
            this.expressionEl.textContent = '';
            
        } catch (error) {
            this.resultEl.value = 'Error';
            console.error('Calculation error:', error);
        }
    }
    
    evaluateFormula() {
        const expr = this.formulaInput.value.trim();
        if (!expr) return;
        
        try {
            // Configure math.js with current settings
            math.config({
                number: 'BigNumber',
                precision: this.precision,
                angles: this.angleMode.toLowerCase()
            });
            
            const result = math.evaluate(expr);
            const formattedResult = this.formatPreciseResult(result);
            
            // Display result
            this.formulaResult.innerHTML = `
                <div class="result-expr">${expr}</div>
                <div class="result-equals">=</div>
                <div class="result-value">${formattedResult}</div>
            `;
            
            // Add to history
            this.addToHistory(expr, formattedResult, true);
            
            // Show success
            this.showToast('Perhitungan berhasil!', 'success');
            
        } catch (error) {
            this.formulaResult.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>Error: ${error.message}</div>
                </div>
            `;
            this.showToast('Error dalam rumus!', 'error');
        }
    }
    
    formatNumber(num) {
        if (typeof num !== 'number') return num;
        
        // Avoid scientific notation for large/small numbers
        if (Math.abs(num) > 1e12 || (Math.abs(num) < 1e-6 && num !== 0)) {
            return num.toExponential(6);
        }
        
        // Format with commas for thousands
        const parts = num.toString().split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    }
    
    formatPreciseResult(result) {
        try {
            if (typeof result === 'number') {
                return result.toPrecision(this.precision);
            } else if (result.toString) {
                return result.toString();
            }
            return String(result);
        } catch (e) {
            return String(result);
        }
    }
    
    toggleSign() {
        if (this.currentExpression) {
            if (this.currentExpression.startsWith('-')) {
                this.currentExpression = this.currentExpression.substring(1);
            } else {
                this.currentExpression = '-' + this.currentExpression;
            }
            this.expressionEl.textContent = this.currentExpression;
        } else {
            const current = parseFloat(this.resultEl.value);
            this.resultEl.value = this.formatNumber(-current);
        }
    }
    
    updateMemoryDisplay() {
        this.memoryEl.textContent = this.formatNumber(this.memory);
    }
    
    addToHistory(expression, result, isPrecision = false) {
        const timestamp = new Date().toLocaleTimeString();
        const historyItem = {
            expression,
            result,
            timestamp,
            isPrecision,
            mode: this.currentMode
        };
        
        this.history.unshift(historyItem);
        this.updateHistoryDisplay();
        this.saveToStorage();
    }
    
    updateHistoryDisplay() {
        this.historyList.innerHTML = '';
        
        if (this.history.length === 0) {
            this.historyList.innerHTML = `
                <div class="history-item">
                    <div class="history-expr">Belum ada riwayat</div>
                    <div class="history-value">-</div>
                </div>
            `;
        } else {
            this.history.forEach(item => {
                const div = document.createElement('div');
                div.className = 'history-item';
                div.innerHTML = `
                    <div class="history-expr">
                        <small>${item.timestamp}</small><br>
                        ${item.expression}
                    </div>
                    <div class="history-value">
                        ${item.isPrecision ? '<i class="fas fa-microscope"></i> ' : ''}
                        ${this.formatNumber(item.result)}
                    </div>
                `;
                this.historyList.appendChild(div);
            });
        }
        
        // Update stats
        const precisionCount = this.history.filter(h => h.isPrecision).length;
        this.totalCalcEl.textContent = this.history.length;
        this.precisionCalcEl.textContent = precisionCount;
    }
    
    clearHistory() {
        if (confirm('Hapus semua riwayat?')) {
            this.history = [];
            this.updateHistoryDisplay();
            localStorage.removeItem('survivalCalcHistory');
            this.showToast('Riwayat dihapus');
        }
    }
    
    handleKeyboard(e) {
        if (e.key >= '0' && e.key <= '9') {
            this.addToExpression(e.key);
        } else if (['+', '-', '*', '/', '.', '(', ')'].includes(e.key)) {
            this.addToExpression(e.key);
        } else if (e.key === 'Enter') {
            if (this.currentMode === 'basic') {
                this.calculate();
            } else if (this.currentMode === 'formula') {
                this.evaluateFormula();
            }
        } else if (e.key === 'Escape') {
            this.clear();
        } else if (e.key === 'Backspace') {
            this.currentExpression = this.currentExpression.slice(0, -1);
            this.expressionEl.textContent = this.currentExpression;
        }
    }
    
    showToast(message, type = 'info') {
        // Remove existing toast
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        
        // Create new toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add styles
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--primary)'};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
        
        // Add animation keyframes
        if (!document.getElementById('toast-animations')) {
            const style = document.createElement('style');
            style.id = 'toast-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    updateUI() {
        this.updateMemoryDisplay();
        this.updateHistoryDisplay();
        this.precisionLevelEl.textContent = `${this.precision} digit`;
    }
    
    saveToStorage() {
        try {
            localStorage.setItem('survivalCalcHistory', JSON.stringify(this.history));
            localStorage.setItem('survivalCalcMemory', this.memory.toString());
            localStorage.setItem('survivalCalcSettings', JSON.stringify({
                precision: this.precision,
                angleMode: this.angleMode
            }));
        } catch (e) {
            console.warn('Gagal menyimpan ke localStorage');
        }
    }
    
    loadFromStorage() {
        try {
            const history = localStorage.getItem('survivalCalcHistory');
            if (history) {
                this.history = JSON.parse(history);
            }
            
            const memory = localStorage.getItem('survivalCalcMemory');
            if (memory) {
                this.memory = parseFloat(memory);
            }
            
            const settings = localStorage.getItem('survivalCalcSettings');
            if (settings) {
                const { precision, angleMode } = JSON.parse(settings);
                this.precision = precision || 10;
                this.angleMode = angleMode || 'DEG';
                this.precisionSelect.value = this.precision;
                this.angleToggle.checked = this.angleMode === 'RAD';
            }
        } catch (e) {
            console.warn('Gagal memuat dari localStorage');
        }
    }
}

// Initialize calculator when page loads
document.addEventListener('DOMContentLoaded', () => {
    const calculator = new SurvivalCalculator();
    window.calculator = calculator; // For debugging
    
    console.log('Kalkulator Survival siap digunakan. Berikan ke desa untuk bertahan hidup.');
});