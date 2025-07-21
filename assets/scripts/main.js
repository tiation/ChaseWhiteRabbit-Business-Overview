/**
 * ChaseWhiteRabbit - Enterprise D&D Dice Roller
 * Modern vanilla JavaScript for optimal performance and compatibility
 * 
 * @version 1.0.0
 * @description Fast, reliable dice rolling with enterprise-grade error handling
 */

(function() {
    'use strict';

    // Application state
    const state = {
        selectedDice: null,
        rollHistory: JSON.parse(localStorage.getItem('chasewhiterabbit-roll-history')) || [],
        isRolling: false,
        apiEndpoint: '/api'
    };

    // DOM elements
    const elements = {
        diceButtons: null,
        diceCountInput: null,
        modifierInput: null,
        rollButton: null,
        resultContainer: null,
        rollHistory: null,
        clearHistoryButton: null
    };

    // Initialize the application
    function init() {
        try {
            cacheDOMElements();
            bindEvents();
            initializeInterface();
            loadHistoryFromStorage();
            
            console.log('🐰 ChaseWhiteRabbit Dice Roller initialized successfully');
        } catch (error) {
            console.error('Failed to initialize dice roller:', error);
            showError('Failed to initialize application');
        }
    }

    // Cache DOM elements for performance
    function cacheDOMElements() {
        elements.diceButtons = document.querySelectorAll('.dice-btn');
        elements.diceCountInput = document.getElementById('dice-count');
        elements.modifierInput = document.getElementById('modifier');
        elements.rollButton = document.getElementById('roll-btn');
        elements.resultContainer = document.getElementById('result');
        elements.rollHistory = document.getElementById('roll-history');
        elements.clearHistoryButton = document.getElementById('clear-history');

        // Validate required elements
        const requiredElements = ['rollButton', 'resultContainer', 'rollHistory'];
        for (const elementName of requiredElements) {
            if (!elements[elementName]) {
                throw new Error(`Required element ${elementName} not found`);
            }
        }
    }

    // Bind event handlers
    function bindEvents() {
        // Dice selection buttons
        elements.diceButtons.forEach(button => {
            button.addEventListener('click', handleDiceSelection);
        });

        // Roll button
        elements.rollButton.addEventListener('click', handleRollDice);

        // Enter key support
        [elements.diceCountInput, elements.modifierInput].forEach(input => {
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        handleRollDice();
                    }
                });
            }
        });

        // Clear history button
        if (elements.clearHistoryButton) {
            elements.clearHistoryButton.addEventListener('click', handleClearHistory);
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);

        // Prevent form submission on enter
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
                e.preventDefault();
            }
        });
    }

    // Initialize interface state
    function initializeInterface() {
        updateRollButton();
        displayWelcomeMessage();
    }

    // Handle dice selection
    function handleDiceSelection(event) {
        const selectedButton = event.currentTarget;
        const diceType = selectedButton.dataset.dice;

        // Update visual state
        elements.diceButtons.forEach(btn => btn.classList.remove('selected'));
        selectedButton.classList.add('selected');

        // Update application state
        state.selectedDice = diceType;
        updateRollButton();

        // Provide feedback
        showMessage(`Selected ${diceType.toUpperCase()} die`);

        // Analytics (if available)
        trackEvent('dice_selected', { diceType });
    }

    // Handle dice rolling
    async function handleRollDice() {
        if (!state.selectedDice) {
            showMessage('Please select a die first!', 'warning');
            return;
        }

        if (state.isRolling) {
            return; // Prevent double-clicking
        }

        try {
            state.isRolling = true;
            updateRollButton();
            showRollingAnimation();

            const rollParams = {
                diceType: state.selectedDice,
                count: parseInt(elements.diceCountInput?.value) || 1,
                modifier: parseInt(elements.modifierInput?.value) || 0
            };

            // Validate parameters
            if (rollParams.count < 1 || rollParams.count > 20) {
                throw new Error('Number of dice must be between 1 and 20');
            }

            if (rollParams.modifier < -100 || rollParams.modifier > 100) {
                throw new Error('Modifier must be between -100 and 100');
            }

            const result = await rollDiceAPI(rollParams);
            displayRollResult(result);
            addToHistory(result);
            
            // Analytics
            trackEvent('dice_rolled', {
                diceType: rollParams.diceType,
                count: rollParams.count,
                result: result.total,
                isCritical: result.isCriticalHit || result.isCriticalFail
            });

        } catch (error) {
            console.error('Roll failed:', error);
            showError(error.message || 'Failed to roll dice');
        } finally {
            state.isRolling = false;
            updateRollButton();
            hideRollingAnimation();
        }
    }

    // API call to roll dice
    async function rollDiceAPI(params) {
        const response = await fetch(`${state.apiEndpoint}/dice/roll`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'Roll failed');
        }

        return data.result;
    }

    // Display roll result
    function displayRollResult(result) {
        let resultHTML = '';
        let resultClass = '';

        if (result.isCriticalHit) {
            resultClass = 'critical-hit';
            resultHTML = `
                <div class="roll-result ${resultClass}">
                    🎉 CRITICAL HIT! 🎉<br>
                    ${result.total}
                </div>
                <div class="roll-details">
                    ${formatRollDetails(result)}
                </div>
            `;
        } else if (result.isCriticalFail) {
            resultClass = 'critical-fail';
            resultHTML = `
                <div class="roll-result ${resultClass}">
                    💀 CRITICAL FAIL! 💀<br>
                    ${result.total}
                </div>
                <div class="roll-details">
                    ${formatRollDetails(result)}
                </div>
            `;
        } else {
            resultHTML = `
                <div class="roll-result">
                    ${result.total}
                </div>
                <div class="roll-details">
                    ${formatRollDetails(result)}
                </div>
            `;
        }

        elements.resultContainer.innerHTML = resultHTML;
        
        // Add animation class
        elements.resultContainer.classList.add('result-animate');
        setTimeout(() => {
            elements.resultContainer.classList.remove('result-animate');
        }, 500);
    }

    // Format roll details
    function formatRollDetails(result) {
        let details = `${result.count}${result.diceType}: [${result.rolls.join(', ')}]`;
        
        if (result.modifier !== 0) {
            const modifierText = result.modifier > 0 ? `+${result.modifier}` : `${result.modifier}`;
            details += ` ${modifierText} = ${result.total}`;
        } else if (result.rolls.length > 1) {
            details += ` = ${result.total}`;
        }

        return details;
    }

    // Add roll to history
    function addToHistory(result) {
        const historyItem = {
            ...result,
            displayText: `${result.count}${result.diceType} → ${result.total}`,
            timestamp: new Date().toISOString()
        };

        state.rollHistory.unshift(historyItem);
        
        // Limit history size
        if (state.rollHistory.length > 100) {
            state.rollHistory = state.rollHistory.slice(0, 100);
        }

        updateHistoryDisplay();
        saveHistoryToStorage();
    }

    // Update history display
    function updateHistoryDisplay() {
        if (!elements.rollHistory) return;

        if (state.rollHistory.length === 0) {
            elements.rollHistory.innerHTML = '<li style="text-align: center; color: var(--text-secondary);">No rolls yet</li>';
            return;
        }

        const historyHTML = state.rollHistory.slice(0, 20).map(item => {
            const timestamp = new Date(item.timestamp).toLocaleTimeString();
            let itemClass = '';
            let emoji = '🎲';

            if (item.isCriticalHit) {
                itemClass = 'critical-hit';
                emoji = '🎉';
            } else if (item.isCriticalFail) {
                itemClass = 'critical-fail';
                emoji = '💀';
            }

            return `
                <li class="${itemClass}">
                    <span>${emoji} ${item.displayText}</span>
                    <span class="history-timestamp">${timestamp}</span>
                </li>
            `;
        }).join('');

        elements.rollHistory.innerHTML = historyHTML;
    }

    // Handle clear history
    function handleClearHistory() {
        if (confirm('Are you sure you want to clear the roll history?')) {
            state.rollHistory = [];
            updateHistoryDisplay();
            saveHistoryToStorage();
            showMessage('Roll history cleared');
            trackEvent('history_cleared');
        }
    }

    // Keyboard shortcuts
    function handleKeyboardShortcuts(event) {
        // Don't interfere with input fields
        if (event.target.tagName === 'INPUT') return;

        const key = event.key.toLowerCase();
        
        // Dice selection shortcuts (1-6 for d4-d20, 0 for d100)
        const diceMap = {
            '1': 'd4',
            '2': 'd6', 
            '3': 'd8',
            '4': 'd10',
            '5': 'd12',
            '6': 'd20',
            '0': 'd100'
        };

        if (diceMap[key]) {
            const diceButton = document.querySelector(`[data-dice="${diceMap[key]}"]`);
            if (diceButton) {
                diceButton.click();
            }
            event.preventDefault();
        }

        // Spacebar or Enter to roll
        if ((key === ' ' || key === 'enter') && !state.isRolling) {
            handleRollDice();
            event.preventDefault();
        }
    }

    // Update roll button state
    function updateRollButton() {
        if (!elements.rollButton) return;

        if (state.isRolling) {
            elements.rollButton.textContent = 'Rolling...';
            elements.rollButton.disabled = true;
        } else if (!state.selectedDice) {
            elements.rollButton.textContent = 'Select a Die First';
            elements.rollButton.disabled = true;
        } else {
            elements.rollButton.textContent = `Roll ${state.selectedDice.toUpperCase()}`;
            elements.rollButton.disabled = false;
        }
    }

    // Show rolling animation
    function showRollingAnimation() {
        elements.resultContainer.classList.add('rolling');
        elements.resultContainer.innerHTML = `
            <div class="roll-result" style="animation: pulse 0.5s infinite;">
                🎲 Rolling...
            </div>
        `;
    }

    // Hide rolling animation
    function hideRollingAnimation() {
        elements.resultContainer.classList.remove('rolling');
    }

    // Display welcome message
    function displayWelcomeMessage() {
        elements.resultContainer.innerHTML = `
            <div style="text-align: center;">
                <p>🐰 Welcome to ChaseWhiteRabbit Dice Roller!</p>
                <p>Select a die and click roll to get started</p>
                <p><small>Use keyboard shortcuts 1-6 for dice selection, spacebar to roll</small></p>
            </div>
        `;
    }

    // Show general message
    function showMessage(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // You could enhance this to show toast notifications
        if (type === 'warning') {
            // Could show a temporary warning message
        }
    }

    // Show error message
    function showError(message) {
        console.error('[ERROR]', message);
        elements.resultContainer.innerHTML = `
            <div style="color: var(--danger-color); text-align: center;">
                <p>⚠️ Error: ${message}</p>
                <p><small>Please try again</small></p>
            </div>
        `;
    }

    // Local storage management
    function saveHistoryToStorage() {
        try {
            localStorage.setItem('chasewhiterabbit-roll-history', JSON.stringify(state.rollHistory));
        } catch (error) {
            console.warn('Failed to save history to localStorage:', error);
        }
    }

    function loadHistoryFromStorage() {
        try {
            const stored = localStorage.getItem('chasewhiterabbit-roll-history');
            if (stored) {
                state.rollHistory = JSON.parse(stored);
                updateHistoryDisplay();
            }
        } catch (error) {
            console.warn('Failed to load history from localStorage:', error);
            state.rollHistory = [];
        }
    }

    // Analytics tracking (placeholder)
    function trackEvent(eventName, properties = {}) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, properties);
        }
        
        console.log('📊 Event tracked:', eventName, properties);
    }

    // Error handling for uncaught errors
    window.addEventListener('error', (event) => {
        console.error('Uncaught error:', event.error);
        showError('An unexpected error occurred');
    });

    // Handle API errors gracefully
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        showError('Network error occurred');
        event.preventDefault();
    });

    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose public API for testing
    window.ChaseWhiteRabbit = {
        rollDice: handleRollDice,
        selectDice: (diceType) => {
            const button = document.querySelector(`[data-dice="${diceType}"]`);
            if (button) button.click();
        },
        clearHistory: handleClearHistory,
        getState: () => ({ ...state })
    };

})();
