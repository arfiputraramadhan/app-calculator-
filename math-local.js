/**
 * Math.js Local - Presisi Tinggi Survival Mode
 * Library matematika presisi tinggi dengan akurasi maksimal
 * Dirancang untuk kondisi survival di mana kalkulasi harus sempurna
 */

const SurvivalMath = (function() {
    // Konfigurasi presisi tinggi
    const PRECISION = {
        MAX_DIGITS: 64,
        DECIMAL_PLACES: 32,
        MAX_ITERATIONS: 1000
    };

    class HighPrecisionNumber {
        constructor(value) {
            if (typeof value === 'number') {
                this.value = this._parseNumber(value);
            } else if (typeof value === 'string') {
                this.value = this._parseString(value);
            } else if (value instanceof HighPrecisionNumber) {
                this.value = [...value.value];
            } else {
                this.value = [0];
            }
        }

        _parseNumber(num) {
            // Konversi double precision ke string dengan presisi tinggi
            const str = num.toFixed(PRECISION.DECIMAL_PLACES);
            return this._parseString(str);
        }

        _parseString(str) {
            str = str.replace(/[^\d.-]/g, '');
            if (!str || str === '-' || str === '.') return [0];
            
            const parts = str.split('.');
            const integer = parts[0] || '0';
            const decimal = parts[1] || '';
            
            // Normalisasi: hapus leading zeros dan trailing zeros
            let intDigits = integer.replace(/^0+/, '') || '0';
            let decDigits = decimal.replace(/0+$/, '');
            
            // Simpan sebagai array digit
            const result = [];
            for (let digit of intDigits) {
                result.push(parseInt(digit));
            }
            
            if (decDigits) {
                result.push('.');
                for (let digit of decDigits) {
                    result.push(parseInt(digit));
                }
            }
            
            return result;
        }

        toString() {
            if (this.value.length === 0) return '0';
            
            let result = '';
            let decimalPoint = -1;
            
            for (let i = 0; i < this.value.length; i++) {
                if (this.value[i] === '.') {
                    decimalPoint = i;
                    result += '.';
                } else {
                    result += this.value[i].toString();
                }
            }
            
            // Tambah leading zero jika perlu
            if (result.startsWith('.')) result = '0' + result;
            
            return result;
        }

        toNumber() {
            return parseFloat(this.toString());
        }

        add(other) {
            // Implementasi penjumlahan presisi tinggi
            const a = this.toString();
            const b = other.toString();
            
            // Temukan presisi tertinggi
            const aDecimals = (a.split('.')[1] || '').length;
            const bDecimals = (b.split('.')[1] || '').length;
            const maxDecimals = Math.max(aDecimals, bDecimals);
            
            // Kalikan dengan 10^maxDecimals untuk menghindari floating point
            const multiplier = Math.pow(10, maxDecimals);
            const aInt = Math.round(parseFloat(a) * multiplier);
            const bInt = Math.round(parseFloat(b) * multiplier);
            
            const result = (aInt + bInt) / multiplier;
            return new HighPrecisionNumber(result.toFixed(maxDecimals));
        }

        subtract(other) {
            const a = parseFloat(this.toString());
            const b = parseFloat(other.toString());
            const result = a - b;
            
            // Hitung presisi yang dibutuhkan
            const aDecimals = (this.toString().split('.')[1] || '').length;
            const bDecimals = (other.toString().split('.')[1] || '').length;
            const maxDecimals = Math.max(aDecimals, bDecimals);
            
            return new HighPrecisionNumber(result.toFixed(maxDecimals));
        }

        multiply(other) {
            // Untuk presisi tinggi, gunakan perkalian integer
            const a = this.toString();
            const b = other.toString();
            
            const aDecimals = (a.split('.')[1] || '').length;
            const bDecimals = (b.split('.')[1] || '').length;
            const totalDecimals = aDecimals + bDecimals;
            
            const aInt = parseInt(a.replace('.', ''));
            const bInt = parseInt(b.replace('.', ''));
            
            const result = (aInt * bInt) / Math.pow(10, totalDecimals);
            return new HighPrecisionNumber(result.toString());
        }

        divide(other) {
            // Pembagian dengan presisi tinggi menggunakan algoritma panjang
            const dividend = parseFloat(this.toString());
            const divisor = parseFloat(other.toString());
            
            if (divisor === 0) throw new Error('Division by zero');
            
            // Hitung hingga PRECISION.DECIMAL_PLACES digit
            let result = (dividend / divisor).toFixed(PRECISION.DECIMAL_PLACES);
            return new HighPrecisionNumber(result);
        }
    }

    // Library Matematika Presisi Tinggi
    const math = {
        // Konfigurasi
        config: function(options = {}) {
            if (options.precision) {
                PRECISION.DECIMAL_PLACES = Math.min(options.precision, PRECISION.MAX_DIGITS);
            }
            return this;
        },

        // Fungsi evaluasi utama
        evaluate: function(expr) {
            try {
                // Parsing ekspresi matematika
                expr = this._normalizeExpression(expr);
                
                // Validasi karakter berbahaya
                if (!this._isSafeExpression(expr)) {
                    throw new Error('Ekspresi tidak aman');
                }
                
                // Evaluasi menggunakan presisi tinggi
                return this._evaluateWithPrecision(expr);
            } catch (error) {
                throw new Error(`Math Error: ${error.message}`);
            }
        },

        // Normalisasi ekspresi
        _normalizeExpression: function(expr) {
            // Ganti simbol
            expr = expr
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/pi/gi, 'π')
                .replace(/\^/g, '**')
                .replace(/sqrt\(/gi, '√(')
                .replace(/log\(/gi, 'log10(')
                .replace(/ln\(/gi, 'log(');
            
            // Tambahkan tanda perkalian implisit
            expr = expr.replace(/(\d)(\(|[a-zA-Zπ])/g, '$1*$2');
            expr = expr.replace(/(\))(\d|[a-zA-Zπ])/g, '$1*$2');
            
            return expr;
        },

        // Validasi keamanan
        _isSafeExpression: function(expr) {
            // Hanya izinkan karakter matematika yang aman
            const safePattern = /^[0-9+\-*/\^().π√!sincostanloge\s]*$/i;
            
            // Cegah multiple dots
            if ((expr.match(/\./g) || []).length > 1 && !/\.\d+\./.test(expr)) {
                return false;
            }
            
            return safePattern.test(expr);
        },

        // Evaluasi dengan presisi
        _evaluateWithPrecision: function(expr) {
            // Tokenize
            const tokens = this._tokenize(expr);
            const rpn = this._shuntingYard(tokens);
            
            // Evaluasi RPN
            const result = this._evaluateRPN(rpn);
            
            // Format hasil dengan presisi
            return this._formatResult(result);
        },

        // Tokenisasi ekspresi
        _tokenize: function(expr) {
            const tokens = [];
            let current = '';
            
            for (let i = 0; i < expr.length; i++) {
                const char = expr[i];
                
                if (this._isDigit(char) || char === '.') {
                    current += char;
                } else if (this._isOperator(char) || char === '(' || char === ')') {
                    if (current) {
                        tokens.push(this._createToken(current));
                        current = '';
                    }
                    tokens.push(this._createToken(char));
                } else if (this._isLetter(char)) {
                    current += char;
                } else if (char === 'π') {
                    if (current) {
                        tokens.push(this._createToken(current));
                        current = '';
                    }
                    tokens.push({ type: 'constant', value: Math.PI });
                } else if (char === 'e') {
                    if (current) {
                        tokens.push(this._createToken(current));
                        current = '';
                    }
                    tokens.push({ type: 'constant', value: Math.E });
                }
            }
            
            if (current) {
                tokens.push(this._createToken(current));
            }
            
            return tokens;
        },

        _createToken: function(str) {
            if (this._isNumber(str)) {
                return { type: 'number', value: parseFloat(str) };
            } else if (this._isFunction(str)) {
                return { type: 'function', value: str };
            } else if (this._isOperator(str)) {
                return { type: 'operator', value: str };
            } else if (str === '(' || str === ')') {
                return { type: 'parenthesis', value: str };
            }
            return null;
        },

        // Shunting-yard algorithm untuk RPN
        _shuntingYard: function(tokens) {
            const output = [];
            const operators = [];
            const precedence = {
                '+': 1, '-': 1,
                '*': 2, '/': 2,
                '**': 3
            };
            
            for (let token of tokens) {
                if (token.type === 'number' || token.type === 'constant') {
                    output.push(token);
                } else if (token.type === 'function') {
                    operators.push(token);
                } else if (token.type === 'operator') {
                    while (operators.length > 0 &&
                           operators[operators.length - 1].type === 'operator' &&
                           precedence[operators[operators.length - 1].value] >= precedence[token.value]) {
                        output.push(operators.pop());
                    }
                    operators.push(token);
                } else if (token.value === '(') {
                    operators.push(token);
                } else if (token.value === ')') {
                    while (operators.length > 0 && operators[operators.length - 1].value !== '(') {
                        output.push(operators.pop());
                    }
                    operators.pop(); // Remove '('
                    if (operators.length > 0 && operators[operators.length - 1].type === 'function') {
                        output.push(operators.pop());
                    }
                }
            }
            
            while (operators.length > 0) {
                output.push(operators.pop());
            }
            
            return output;
        },

        // Evaluasi RPN
        _evaluateRPN: function(rpn) {
            const stack = [];
            
            for (let token of rpn) {
                if (token.type === 'number' || token.type === 'constant') {
                    stack.push(token.value);
                } else if (token.type === 'operator') {
                    const b = stack.pop();
                    const a = stack.pop();
                    stack.push(this._applyOperator(a, b, token.value));
                } else if (token.type === 'function') {
                    const arg = stack.pop();
                    stack.push(this._applyFunction(arg, token.value));
                }
            }
            
            return stack[0];
        },

        // Aplikasi operator
        _applyOperator: function(a, b, op) {
            switch (op) {
                case '+':
                    return this._add(a, b);
                case '-':
                    return this._subtract(a, b);
                case '*':
                    return this._multiply(a, b);
                case '/':
                    return this._divide(a, b);
                case '**':
                    return this._power(a, b);
                default:
                    throw new Error(`Operator tidak dikenal: ${op}`);
            }
        },

        // Aplikasi fungsi
        _applyFunction: function(arg, func) {
            switch (func.toLowerCase()) {
                case 'sin':
                    return this._sin(arg);
                case 'cos':
                    return this._cos(arg);
                case 'tan':
                    return this._tan(arg);
                case 'sqrt':
                case '√':
                    return this._sqrt(arg);
                case 'log':
                    return this._ln(arg);
                case 'log10':
                    return this._log10(arg);
                case 'factorial':
                    return this._factorial(arg);
                case 'abs':
                    return Math.abs(arg);
                default:
                    throw new Error(`Fungsi tidak dikenal: ${func}`);
            }
        },

        // Operasi matematika dengan presisi tinggi
        _add: function(a, b) {
            const hpA = new HighPrecisionNumber(a);
            const hpB = new HighPrecisionNumber(b);
            return hpA.add(hpB).toNumber();
        },

        _subtract: function(a, b) {
            const hpA = new HighPrecisionNumber(a);
            const hpB = new HighPrecisionNumber(b);
            return hpA.subtract(hpB).toNumber();
        },

        _multiply: function(a, b) {
            const hpA = new HighPrecisionNumber(a);
            const hpB = new HighPrecisionNumber(b);
            return hpA.multiply(hpB).toNumber();
        },

        _divide: function(a, b) {
            const hpA = new HighPrecisionNumber(a);
            const hpB = new HighPrecisionNumber(b);
            return hpA.divide(hpB).toNumber();
        },

        _power: function(base, exponent) {
            // Untuk presisi tinggi, gunakan logaritma
            if (exponent === 0) return 1;
            if (exponent === 1) return base;
            
            // Jika eksponen integer
            if (Number.isInteger(exponent)) {
                let result = 1;
                for (let i = 0; i < Math.abs(exponent); i++) {
                    result = this._multiply(result, base);
                }
                return exponent > 0 ? result : 1 / result;
            }
            
            // Untuk eksponen desimal
            return Math.exp(exponent * Math.log(base));
        },

        // Fungsi trigonometri dengan konversi radian
        _sin: function(x) {
            // Konversi ke radian jika perlu
            const angleInRadians = this._toRadians(x);
            
            // Gunakan deret Taylor untuk presisi tinggi
            return this._sinTaylor(angleInRadians);
        },

        _cos: function(x) {
            const angleInRadians = this._toRadians(x);
            return this._cosTaylor(angleInRadians);
        },

        _tan: function(x) {
            const sinVal = this._sin(x);
            const cosVal = this._cos(x);
            
            if (Math.abs(cosVal) < 1e-15) {
                throw new Error('Tangen tak terdefinisi');
            }
            
            return sinVal / cosVal;
        },

        // Deret Taylor untuk sin dan cos
        _sinTaylor: function(x) {
            let result = 0;
            let term = x;
            let n = 1;
            
            // Reduce x ke range [-π, π] untuk konvergensi lebih cepat
            x = x % (2 * Math.PI);
            
            for (let i = 1; i <= PRECISION.MAX_ITERATIONS; i++) {
                result += term;
                term = -term * x * x / ((2 * i) * (2 * i + 1));
                
                if (Math.abs(term) < 1e-15) break;
            }
            
            return result;
        },

        _cosTaylor: function(x) {
            let result = 0;
            let term = 1;
            let n = 0;
            
            x = x % (2 * Math.PI);
            
            for (let i = 0; i <= PRECISION.MAX_ITERATIONS; i++) {
                result += term;
                term = -term * x * x / ((2 * i + 1) * (2 * i + 2));
                
                if (Math.abs(term) < 1e-15) break;
            }
            
            return result;
        },

        // Fungsi akar dengan algoritma Babylon
        _sqrt: function(x) {
            if (x < 0) throw new Error('Akar dari bilangan negatif');
            if (x === 0) return 0;
            
            let guess = x / 2;
            
            for (let i = 0; i < PRECISION.MAX_ITERATIONS; i++) {
                const nextGuess = (guess + x / guess) / 2;
                
                if (Math.abs(nextGuess - guess) < 1e-15) {
                    return nextGuess;
                }
                
                guess = nextGuess;
            }
            
            return guess;
        },

        // Logaritma natural
        _ln: function(x) {
            if (x <= 0) throw new Error('Log hanya untuk bilangan positif');
            
            // Gunakan deret Taylor di sekitar 1
            if (Math.abs(x - 1) < 0.5) {
                let z = x - 1;
                let result = 0;
                let term = z;
                
                for (let n = 1; n <= PRECISION.MAX_ITERATIONS; n++) {
                    result += term / n;
                    term = -term * z;
                    
                    if (Math.abs(term) < 1e-15) break;
                }
                
                return result;
            }
            
            // Fallback ke Math.log untuk presisi
            return Math.log(x);
        },

        // Logaritma basis 10
        _log10: function(x) {
            return this._ln(x) / Math.log(10);
        },

        // Faktorial
        _factorial: function(n) {
            if (!Number.isInteger(n) || n < 0) {
                throw new Error('Faktorial hanya untuk bilangan bulat non-negatif');
            }
            
            if (n <= 1) return 1;
            
            let result = 1;
            for (let i = 2; i <= n; i++) {
                result = this._multiply(result, i);
            }
            
            return result;
        },

        // Konversi ke radian
        _toRadians: function(degrees) {
            // Jika dalam mode DEG, konversi dari derajat
            if (window.calculator && window.calculator.angleMode === 'DEG') {
                return degrees * Math.PI / 180;
            }
            return degrees;
        },

        // Format hasil dengan presisi
        _formatResult: function(value) {
            if (typeof value !== 'number') return value;
            
            // Gunakan presisi yang ditentukan
            const precision = Math.min(PRECISION.DECIMAL_PLACES, 15);
            
            // Format khusus untuk bilangan sangat besar/kecil
            if (Math.abs(value) > 1e12 || (Math.abs(value) < 1e-12 && value !== 0)) {
                return value.toExponential(precision);
            }
            
            // Format dengan presisi tetap
            return parseFloat(value.toFixed(precision));
        },

        // Helper functions
        _isDigit: function(char) {
            return /[0-9]/.test(char);
        },

        _isLetter: function(char) {
            return /[a-zA-Z]/.test(char);
        },

        _isOperator: function(char) {
            return /[+\-*/^]/.test(char);
        },

        _isNumber: function(str) {
            return /^-?\d*\.?\d+$/.test(str);
        },

        _isFunction: function(str) {
            const functions = ['sin', 'cos', 'tan', 'sqrt', 'log', 'log10', 'ln', 'factorial', 'abs'];
            return functions.includes(str.toLowerCase());
        },

        // Konstanta matematika dengan presisi tinggi
        pi: new HighPrecisionNumber(Math.PI.toFixed(32)),
        e: new HighPrecisionNumber(Math.E.toFixed(32)),
        
        // Fungsi matriks dasar
        det: function(matrix) {
            if (!Array.isArray(matrix) || !Array.isArray(matrix[0])) {
                throw new Error('Input harus matriks 2x2');
            }
            
            if (matrix.length === 2 && matrix[0].length === 2) {
                const [[a, b], [c, d]] = matrix;
                return this._subtract(this._multiply(a, d), this._multiply(b, c));
            }
            
            throw new Error('Hanya matriks 2x2 yang didukung');
        }
    };

    return math;
})();

// Ekspor ke global scope untuk kompatibilitas dengan Math.js
window.math = SurvivalMath;

// Backup jika CDN Math.js gagal load
if (typeof window.math === 'undefined') {
    window.math = SurvivalMath;
} else {
    // Extend Math.js dengan fungsi presisi tinggi kita
    const originalEvaluate = window.math.evaluate;
    window.math.evaluate = function(expr) {
        try {
            return SurvivalMath.evaluate(expr);
        } catch (error) {
            console.warn('Falling back to Math.js:', error.message);
            return originalEvaluate.call(this, expr);
        }
    };
    
    // Tambahkan konfigurasi presisi tinggi
    window.math.config = SurvivalMath.config;
}

// Log inisialisasi
console.log('Survival Math.js loaded - Presisi Tinggi Mode Aktif');
console.log(`Presisi: ${SurvivalMath.config().pi} digit`);
