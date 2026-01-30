// Math.js Minimal Version for Offline Survival Use
// Core mathematical functions only

const math = (function() {
    'use strict';
    
    const config = {
        number: 'number',
        precision: 10,
        angles: 'deg'
    };
    
    function configure(options) {
        Object.assign(config, options);
    }
    
    // Number type detection and conversion
    function isNumber(x) {
        return typeof x === 'number' && !isNaN(x);
    }
    
    function toNumber(x) {
        if (Array.isArray(x)) {
            return x.map(toNumber);
        }
        if (typeof x === 'boolean') {
            return x ? 1 : 0;
        }
        if (typeof x === 'string') {
            const num = parseFloat(x);
            return isNaN(num) ? 0 : num;
        }
        return x;
    }
    
    // Basic operations with precision
    function add(a, b) {
        const result = toNumber(a) + toNumber(b);
        return parseFloat(result.toPrecision(config.precision));
    }
    
    function subtract(a, b) {
        const result = toNumber(a) - toNumber(b);
        return parseFloat(result.toPrecision(config.precision));
    }
    
    function multiply(a, b) {
        const result = toNumber(a) * toNumber(b);
        return parseFloat(result.toPrecision(config.precision));
    }
    
    function divide(a, b) {
        if (b === 0) throw new Error('Division by zero');
        const result = toNumber(a) / toNumber(b);
        return parseFloat(result.toPrecision(config.precision));
    }
    
    // Trigonometric functions with angle mode support
    function toRadians(angle) {
        return config.angles === 'deg' ? angle * Math.PI / 180 : angle;
    }
    
    function sin(x) {
        return Math.sin(toRadians(toNumber(x)));
    }
    
    function cos(x) {
        return Math.cos(toRadians(toNumber(x)));
    }
    
    function tan(x) {
        return Math.tan(toRadians(toNumber(x)));
    }
    
    function asin(x) {
        const result = Math.asin(toNumber(x));
        return config.angles === 'deg' ? result * 180 / Math.PI : result;
    }
    
    function acos(x) {
        const result = Math.acos(toNumber(x));
        return config.angles === 'deg' ? result * 180 / Math.PI : result;
    }
    
    function atan(x) {
        const result = Math.atan(toNumber(x));
        return config.angles === 'deg' ? result * 180 / Math.PI : result;
    }
    
    // Exponential and logarithmic functions
    function exp(x) {
        return Math.exp(toNumber(x));
    }
    
    function log(x, base = Math.E) {
        return Math.log(toNumber(x)) / Math.log(toNumber(base));
    }
    
    function log10(x) {
        return Math.log10(toNumber(x));
    }
    
    function sqrt(x) {
        const num = toNumber(x);
        if (num < 0) throw new Error('Square root of negative number');
        return Math.sqrt(num);
    }
    
    function pow(a, b) {
        return Math.pow(toNumber(a), toNumber(b));
    }
    
    // Constants
    const pi = Math.PI;
    const e = Math.E;
    
    // Factorial
    function factorial(n) {
        const num = Math.floor(toNumber(n));
        if (num < 0) throw new Error('Factorial of negative number');
        if (num === 0 || num === 1) return 1;
        let result = 1;
        for (let i = 2; i <= num; i++) {
            result *= i;
        }
        return result;
    }
    
    // Absolute value
    function abs(x) {
        return Math.abs(toNumber(x));
    }
    
    // Complex number support (basic)
    function complex(re, im) {
        return {
            re: toNumber(re),
            im: toNumber(im || 0),
            toString: function() {
                return `${this.re}${this.im >= 0 ? '+' : ''}${this.im}i`;
            }
        };
    }
    
    // Matrix operations (2x2 only for minimal version)
    function det(matrix) {
        if (matrix.length === 2 && matrix[0].length === 2) {
            return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
        }
        throw new Error('Only 2x2 matrices supported in minimal version');
    }
    
    // Expression parser (simplified)
    function evaluate(expr) {
        // Replace common math symbols
        expr = expr.replace(/pi/g, 'Math.PI')
                  .replace(/e/g, 'Math.E')
                  .replace(/sqrt\(/g, 'Math.sqrt(')
                  .replace(/sin\(/g, 'Math.sin(')
                  .replace(/cos\(/g, 'Math.cos(')
                  .replace(/tan\(/g, 'Math.tan(')
                  .replace(/log\(/g, 'Math.log10(')
                  .replace(/ln\(/g, 'Math.log(')
                  .replace(/\^/g, '**')
                  .replace(/π/g, 'Math.PI');
        
        // Handle angle conversion if in degree mode
        if (config.angles === 'deg') {
            expr = expr.replace(/Math\.sin\(/g, 'Math.sin(Math.PI/180*')
                      .replace(/Math\.cos\(/g, 'Math.cos(Math.PI/180*')
                      .replace(/Math\.tan\(/g, 'Math.tan(Math.PI/180*');
        }
        
        try {
            // Use Function constructor for safety
            const result = Function('"use strict"; return (' + expr + ')')();
            
            // Apply precision
            if (typeof result === 'number') {
                return parseFloat(result.toPrecision(config.precision));
            }
            return result;
        } catch (error) {
            throw new Error(`Evaluation error: ${error.message}`);
        }
    }
    
    // Public API
    return {
        config: config,
        configure: configure,
        
        // Basic operations
        add: add,
        subtract: subtract,
        multiply: multiply,
        divide: divide,
        
        // Functions
        sin: sin,
        cos: cos,
        tan: tan,
        asin: asin,
        acos: acos,
        atan: atan,
        exp: exp,
        log: log,
        log10: log10,
        sqrt: sqrt,
        pow: pow,
        factorial: factorial,
        abs: abs,
        
        // Constants
        pi: pi,
        e: e,
        E: e,
        PI: pi,
        
        // Complex numbers
        complex: complex,
        
        // Matrix
        det: det,
        
        // Evaluation
        evaluate: evaluate,
        
        // Type checking
        isNumber: isNumber,
        
        // Version info
        version: '1.0.0-minimal',
        description: 'Math.js Minimal for Survival Situation'
    };
})();

// Make available globally
window.math = math;