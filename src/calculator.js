export function initCalculator() {
    let currentInput = '0';
    let previousInput = '';
    let operation = null;
    let shouldResetScreen = false;
    const history = [];
    const MAX_DIGITS = 12; // Prevent overflow
    const MAX_HISTORY = 20;

    // DOM Elements
    const currentDisplay = document.getElementById('current-display');
    const previousOperationDisplay = document.getElementById('previous-operation');
    const buttonsGrid = document.querySelector('.buttons-grid');
    const historyModal = document.getElementById('history-modal');
    const historyList = document.getElementById('history-list');
    const historyBtn = document.getElementById('history-btn');
    const closeHistoryBtn = document.getElementById('close-history');
    const clearHistoryBtn = document.getElementById('clear-history-btn');

    // Operator mapping for safe evaluation
    const operatorMap = {
        '×': '*',
        '÷': '/',
        '−': '-',
        '^': '**'
    };

    function handleButtonClick(event) {
        const button = event.target;
        if (!button.matches('button')) return;

        const buttonType = button.dataset.type;
        const buttonValue = button.dataset.value;

        switch (buttonType) {
            case 'number':
                appendNumber(buttonValue);
                break;
            case 'operator':
                appendOperator(buttonValue);
                break;
            case 'equals':
                calculate();
                break;
            case 'clear':
                clearAll();
                break;
            case 'percentage':
                calculatePercentage();
                break;
            case 'sign':
                toggleSign();
                break;
        }
    }

    function roundResult(number) {
        // Handle scientific notation and regular numbers
        if (Math.abs(number) < 1e-7 || Math.abs(number) > 1e10) {
            return Number(number.toExponential(7));
        }
        return Number(Math.round(number + 'e7') + 'e-7');
    }

    function updateDisplay() {
        // Format numbers for display
        const formatNumber = (num) => {
            if (num === '') return '';
            const [integer, decimal] = num.split('.');
            const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            return decimal ? `${formattedInteger}.${decimal}` : formattedInteger;
        };

        currentDisplay.textContent = formatNumber(currentInput);
        previousOperationDisplay.textContent = previousInput;
    }

    function updateHistory() {
        if (history.length === 0) {
            historyList.textContent = 'No history';
            return;
        }

        const lastEntries = history.slice(-MAX_HISTORY);
        historyList.innerHTML = lastEntries
            .map(entry => `<div class="history-entry">${entry}</div>`)
            .join('');
        historyList.scrollTop = historyList.scrollHeight;
    }

    function appendNumber(number) {
        if (shouldResetScreen) {
            currentInput = '';
            shouldResetScreen = false;
        }

        // Prevent numbers that are too long
        if (currentInput.replace(/[.,]/g, '').length >= MAX_DIGITS) return;

        if (number === '.' && currentInput.includes('.')) return;

        if (currentInput === '0' && number !== '.') {
            currentInput = number.toString();
        } else {
            currentInput += number.toString();
        }
        updateDisplay();
    }

    function appendOperator(op) {
        if (currentInput === 'Error') return;
        
        if (operation !== null) calculate();
        if (currentInput === '0' && op === '−') {
            currentInput = '-0';
            return;
        }

        previousInput = `${currentInput} ${op}`;
        operation = op;
        shouldResetScreen = true;
        updateDisplay();
    }

    function calculate() {
        try {
            if (!operation || currentInput === 'Error') return;

            let expression = previousInput + ' ' + currentInput;
            
            // Replace operators
            for (const [display, js] of Object.entries(operatorMap)) {
                expression = expression.replaceAll(display, js);
            }

            // Clean the expression
            expression = expression.replace(/[^\d+\-*/.() ]/g, '');

            // Safely evaluate
            const result = Function('"use strict";return (' + expression + ')')();

            // Handle special cases
            if (!Number.isFinite(result)) {
                throw new Error('Invalid calculation');
            }

            const roundedResult = roundResult(result);
            history.push(`${previousInput} ${currentInput} = ${roundedResult}`);

            currentInput = roundedResult.toString();
            previousInput = '';
            operation = null;
            shouldResetScreen = true;
            updateDisplay();
            updateHistory();

        } catch (e) {
            currentInput = 'Error';
            previousInput = '';
            operation = null;
            updateDisplay();
        }
    }

    function clearAll() {
        currentInput = '0';
        previousInput = '';
        operation = null;
        shouldResetScreen = false;
        updateDisplay();
    }

    function calculatePercentage() {
        if (currentInput === 'Error') return;
        
        const value = parseFloat(currentInput);
        if (!isNaN(value)) {
            currentInput = roundResult(value / 100).toString();
            updateDisplay();
        }
    }

    function toggleSign() {
        if (currentInput === 'Error' || currentInput === '0') return;
        
        currentInput = (parseFloat(currentInput) * -1).toString();
        updateDisplay();
    }

    // Event Handlers
    function handleKeyboardInput(event) {
        if (event.repeat) return;

        const key = event.key;

        // Modal handling
        if (key === 'Escape') {
            if (historyModal.getAttribute('aria-hidden') === 'false') {
                event.preventDefault();
                closeHistoryModal();
            } else {
                event.preventDefault();
                clearAll();
            }
            return;
        }

        if (historyModal.getAttribute('aria-hidden') === 'false') return;

        // Number and operator handling
        const keyMap = {
            '+': '+',
            '-': '−',
            '*': '×',
            'x': '×',
            '/': '÷',
            '^': '^',
            'Enter': '=',
            '=': '=',
            'c': 'clear',
            'Escape': 'clear',
            '%': 'percentage'
        };

        if (/^[0-9.]$/.test(key)) {
            event.preventDefault();
            appendNumber(key);
        } else if (key in keyMap) {
            event.preventDefault();
            const mappedKey = keyMap[key];
            if (mappedKey === '=') {
                calculate();
            } else if (mappedKey === 'clear') {
                clearAll();
            } else if (mappedKey === 'percentage') {
                calculatePercentage();
            } else {
                appendOperator(mappedKey);
            }
        }
    }

    function openHistoryModal() {
        historyModal.setAttribute('aria-hidden', 'false');
        updateHistory();
    }

    function closeHistoryModal() {
        historyModal.setAttribute('aria-hidden', 'true');
    }

    function clearHistory() {
        history.length = 0;
        updateHistory();
    }
    
    // Event Listeners
    buttonsGrid.addEventListener('click', handleButtonClick);
    document.addEventListener('keydown', handleKeyboardInput);
    historyBtn.addEventListener('click', openHistoryModal);
    closeHistoryBtn.addEventListener('click', closeHistoryModal);
    clearHistoryBtn.addEventListener('click', clearHistory);

    // Initialize
    updateDisplay();
    updateHistory();
}

// Entry point
document.addEventListener('DOMContentLoaded', () => {
    initCalculator();
});