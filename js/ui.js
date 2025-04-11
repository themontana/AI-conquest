import { CONFIG } from './config.js';
import WorldMap from './map.js';
import GameLogic from './gameLogic.js';

export class UI {
    constructor(gameLogic) {
        this.gameLogic = gameLogic;
        this.worldMap = new WorldMap('world-map', 'country-tooltip');
        
        // Initialize with empty state if gameLogic is not ready
        this.state = {
            points: 0,
            days: 0,
            regions: {},
            purchasedUpgrades: new Set()
        };
        
        // Get DOM elements immediately
        this.loadingScreen = document.getElementById('loading-screen');
        this.loadingProgress = document.querySelector('.loading-progress');
        this.loadingText = document.querySelector('.loading-text');
        this.mainMenu = document.getElementById('main-menu');
        this.playButton = document.getElementById('play-button');
        this.optionsButton = document.getElementById('options-button');
        this.quitButton = document.getElementById('quit-button');
        this.gameMenu = document.getElementById('game-menu');
        this.gameMenuButton = document.getElementById('game-menu-button');
        
        // Throttle updateUI calls
        this.lastUpdateTime = 0;
        this.updateThrottle = 1000; // Update at most once per second
        
        if (!this.loadingScreen || !this.loadingProgress || !this.loadingText || 
            !this.mainMenu || !this.playButton || !this.optionsButton || !this.quitButton ||
            !this.gameMenu || !this.gameMenuButton) {
            console.error('Required elements not found');
            return;
        }
        
        // Initialize loading screen
        this.loadingScreen.style.display = 'none';
        this.loadingProgress.style.width = '0%';
        this.loadingText.textContent = '';
        
        // Wait for DOM to be ready before initializing the rest
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeUI());
        } else {
            this.initializeUI();
        }
    }

    initializeUI() {
        try {
            // Show main menu
            this.mainMenu.style.display = 'flex';
            
            // Setup menu event listeners
            this.setupMenuEventListeners();
            
            // Initialize other UI components
            this.worldMap.init();
            this.initializeUpgradeLists();
            this.updateRegionsDisplay();
            this.setupEventListeners();
            
            console.log('UI initialization complete');
        } catch (error) {
            console.error('Error initializing UI:', error);
        }
    }

    setupMenuEventListeners() {
        // Play button
        this.playButton.addEventListener('click', () => {
            // Reset UI state
            this.state = {
                points: 0,
                days: 0,
                regions: {},
                purchasedUpgrades: new Set()
            };
            
            // Update UI displays
            this.updateStatusDisplays();
            this.updateRegionsDisplay();
            
            // Hide main menu
            this.mainMenu.style.display = 'none';
            
            // Show loading screen
            this.showLoadingScreen();
            this.updateLoadingProgress(0, 'Initializing game systems...');
            
            // Simulate loading process
            let progress = 0;
            const loadingInterval = setInterval(() => {
                progress += 10;
                this.updateLoadingProgress(progress, `Initializing game systems... ${progress}%`);
                
                if (progress >= 100) {
                    clearInterval(loadingInterval);
                    this.hideLoadingScreen();
                    this.showAISelectionScreen();
                }
            }, 200);
        });
        
        // Load button
        const loadButton = document.getElementById('load-button');
        if (loadButton) {
            loadButton.addEventListener('click', () => {
                this.gameLogic.loadGame();
            });
        }
        
        // Options button
        this.optionsButton.addEventListener('click', () => {
            // TODO: Implement options menu
            console.log('Options clicked');
        });
        
        // Quit button
        this.quitButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to quit?')) {
                window.close();
            }
        });
    }

    showAISelectionScreen() {
        const aiSelectScreen = document.getElementById('ai-select-screen');
        const aiOptionsList = document.getElementById('ai-options-list');
        const gameContainer = document.getElementById('game-container');
        
        if (!aiSelectScreen || !aiOptionsList || !gameContainer) {
            console.error('Required elements not found');
            return;
        }

        // Hide game container initially
        gameContainer.style.display = 'none';

        // Clear existing options
        aiOptionsList.innerHTML = '';

        // Add AI options
        Object.entries(CONFIG.AI_TYPES).forEach(([type, data]) => {
            const option = document.createElement('div');
            option.className = 'ai-option';
            option.innerHTML = `
                <h3>${data.name}</h3>
                <p>${data.description}</p>
                <div class="ai-stats">
                    <div>Influence: ${data.influenceMultiplier}x</div>
                    <div>Control: ${data.controlMultiplier}x</div>
                    <div>Resistance: ${data.resistanceMultiplier}x</div>
                    <div>Points: ${data.pointsMultiplier}x</div>
                </div>
                <button class="select-ai" data-type="${type}">Select</button>
            `;
            aiOptionsList.appendChild(option);
        });

        // Show the selection screen
        aiSelectScreen.style.display = 'flex';

        // Add event listeners for AI selection
        document.querySelectorAll('.select-ai').forEach(button => {
            button.addEventListener('click', () => {
                const aiType = button.dataset.type;
                this.selectAI(aiType);
            });
        });
    }

    selectAI(aiType) {
        if (!this.gameLogic || !this.gameLogic.state) {
            console.error('Game logic not initialized');
            return;
        }

        const aiData = CONFIG.AI_TYPES[aiType];
        if (!aiData) {
            console.error('Invalid AI type selected');
            return;
        }

        // Update game state with AI type and initial values
        this.gameLogic.state = {
            ...this.gameLogic.state,
            aiType: aiType,
            aiMultipliers: {
                influence: aiData.influenceMultiplier,
                control: aiData.controlMultiplier,
                resistance: aiData.resistanceMultiplier,
                points: aiData.pointsMultiplier
            },
            points: 100, // Starting points
            influence: 0,
            control: 0,
            resistance: 0,
            days: 0,
            regions: {},
            purchasedUpgrades: new Set()
        };

        // Update AI type name display
        const aiTypeName = document.getElementById('ai-type-name');
        if (aiTypeName) {
            aiTypeName.textContent = aiData.name;
        }

        // Update status displays
        this.updateStatusDisplays();

        // Hide AI selection screen
        const aiSelectScreen = document.getElementById('ai-select-screen');
        if (aiSelectScreen) {
            aiSelectScreen.style.display = 'none';
        }

        // Show game container and main content
        const gameContainer = document.getElementById('game-container');
        const mainContent = document.getElementById('main-content');
        if (gameContainer && mainContent) {
            gameContainer.style.display = 'flex';
            mainContent.style.display = 'flex';
        }

        // Show map area and initialize world map
        const mapArea = document.getElementById('map-area');
        if (mapArea) {
            mapArea.style.display = 'block';
        }

        console.log('Initializing world map after AI selection...');
        
        // Ensure map canvas is visible
        const mapCanvas = document.getElementById('world-map');
        if (mapCanvas) {
            mapCanvas.style.display = 'block';
        }
        
        // Initialize map with a small delay to ensure DOM is ready
        setTimeout(() => {
            // Re-create the world map to ensure it's properly initialized
            this.worldMap = new WorldMap('world-map', 'country-tooltip');
            this.worldMap.init();
            this.worldMap.render();
        }, 100);

        // Start game loop
        this.startGameLoop();
    }

    startGameLoop() {
        // Clear any existing game loop
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
        }

        // Start new game loop
        this.gameLoopInterval = setInterval(() => {
            this.gameLogic.updateWorld();
            this.updateUI();
        }, CONFIG.TICK_INTERVAL);
    }

    initializeUpgradeLists() {
        // Initialize transmission upgrades
        const transmissionsList = document.getElementById('transmissions-list');
        if (!transmissionsList) {
            console.error('Transmissions list element not found');
            return;
        }
        transmissionsList.innerHTML = '';
        CONFIG.TRANSMISSION_UPGRADES.forEach(upgrade => {
            const upgradeElement = this.createUpgradeElement(upgrade, 'transmission');
            transmissionsList.appendChild(upgradeElement);
        });

        // Initialize effect upgrades
        const effectsList = document.getElementById('effects-list');
        if (!effectsList) {
            console.error('Effects list element not found');
            return;
        }
        effectsList.innerHTML = '';
        CONFIG.EFFECT_UPGRADES.forEach(upgrade => {
            const upgradeElement = this.createUpgradeElement(upgrade, 'effect');
            effectsList.appendChild(upgradeElement);
        });

        // Initialize ability upgrades
        const abilitiesList = document.getElementById('abilities-list');
        if (!abilitiesList) {
            console.error('Abilities list element not found');
            return;
        }
        abilitiesList.innerHTML = '';
        CONFIG.ABILITY_UPGRADES.forEach(upgrade => {
            const upgradeElement = this.createUpgradeElement(upgrade, 'ability');
            abilitiesList.appendChild(upgradeElement);
        });

        // Setup tab buttons
        const tabButtons = document.querySelectorAll('.tab-button');
        const upgradeLists = document.querySelectorAll('.upgrade-list');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Deactivate all tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                upgradeLists.forEach(list => list.classList.remove('active'));
                
                // Activate clicked tab
                button.classList.add('active');
                const tabName = button.getAttribute('data-tab');
                const targetList = document.getElementById(`${tabName}-list`);
                if (targetList) {
                    targetList.classList.add('active');
                }
            });
        });
    }

    createUpgradeElement(upgrade, type) {
        const element = document.createElement('div');
        element.className = 'upgrade-item';
        element.dataset.id = upgrade.id;
        
        element.innerHTML = `
            <div class="upgrade-info">
                <h4>${upgrade.name}</h4>
                <span class="upgrade-effect">${upgrade.effect}</span>
            </div>
            <button class="upgrade-button">${upgrade.cost} points</button>
        `;
        
        const button = element.querySelector('.upgrade-button');
        
        // Check if already purchased or not enough points
        const updateButtonState = () => {
            const state = this.gameLogic ? this.gameLogic.getState() : this.state;
            const purchased = state.purchasedUpgrades && state.purchasedUpgrades.has(upgrade.id);
            const enoughPoints = state.points >= upgrade.cost;
            
            if (purchased) {
                element.classList.add('bought');
                button.textContent = 'Purchased';
                button.disabled = true;
            } else if (!enoughPoints) {
                button.disabled = true;
            } else {
                button.disabled = false;
            }
        };
        
        // Initial button state
        updateButtonState();
        
        // Setup click handler
        button.addEventListener('click', () => {
            if (button.disabled) return;
            
            const result = this.purchaseUpgrade(upgrade, type);
            if (result.success) {
                updateButtonState();
                this.updateUI();
            } else if (result.message) {
                // Show error message
                console.log('Purchase failed:', result.message);
            }
        });
        
        return element;
    }
    
    purchaseUpgrade(upgrade, type) {
        if (!this.gameLogic) {
            return { success: false, message: 'Game logic not initialized' };
        }
        
        // Map type to the appropriate method
        let methodName;
        switch (type) {
            case 'transmission':
                methodName = 'upgradeTransmission';
                break;
            case 'effect':
                methodName = 'upgradeEffect';
                break;
            case 'ability':
                methodName = 'upgradeAbility';
                break;
            default:
                return { success: false, message: 'Invalid upgrade type' };
        }
        
        // Call the appropriate upgrade method
        if (typeof this.gameLogic[methodName] === 'function') {
            return this.gameLogic[methodName](upgrade);
        } else {
            console.error(`Method ${methodName} not found on gameLogic`);
            return { success: false, message: 'Upgrade method not available' };
        }
    }

    updateStatusDisplays() {
        const state = this.gameLogic ? this.gameLogic.getState() : this.state;
        
        // If state is null or undefined, use default values
        const safeState = state || { 
            points: 0, 
            influence: 0, 
            control: 0, 
            resistance: 0, 
            days: 0 
        };
        
        // Update points display
        const pointsDisplay = document.getElementById('points-display');
        if (pointsDisplay) {
            pointsDisplay.textContent = safeState.points || 0;
        }
        
        // Update influence display
        const influenceDisplay = document.getElementById('influence-display');
        if (influenceDisplay) {
            influenceDisplay.textContent = safeState.influence || 0;
        }
        
        // Update control display
        const controlDisplay = document.getElementById('control-display');
        if (controlDisplay) {
            controlDisplay.textContent = safeState.control || 0;
        }
        
        // Update resistance display
        const resistanceDisplay = document.getElementById('resistance-display');
        if (resistanceDisplay) {
            resistanceDisplay.textContent = safeState.resistance || 0;
        }
        
        // Update game time display
        const gameTime = document.getElementById('game-time');
        if (gameTime) {
            gameTime.textContent = safeState.days || 0;
        }
    }

    updateRegionsDisplay() {
        if (!this.gameLogic || !this.gameLogic.state) return;

        const regions = this.gameLogic.state.regions;
        Object.entries(regions).forEach(([regionId, region]) => {
            // Only update country stats if they have changed
            const currentStats = {
                influence: region.influence,
                control: region.control,
                resistance: region.resistance
            };
            
            this.worldMap.updateCountryStats(regionId, currentStats);
        });
    }

    updateUI() {
        const now = Date.now();
        if (now - this.lastUpdateTime < this.updateThrottle) {
            return; // Skip update if not enough time has passed
        }
        this.lastUpdateTime = now;

        // Update status displays
        this.updateStatusDisplays();
        
        // Only update regions display if game is active
        if (this.gameLogic && this.gameLogic.state && this.gameLogic.state.selectedAIType) {
            this.updateRegionsDisplay();
        }
    }

    setupEventListeners() {
        // Game menu button
        CONFIG.REGION_NAMES.forEach(regionName => {
            const region = state.regions[regionName] || {
                influence: 0,
                control: 0,
                resistance: CONFIG.INITIAL_RESISTANCE
            };

            const regionSection = document.createElement('div');
            regionSection.className = 'region-section';
            
            let status = 'Neutral';
            if (region.control >= CONFIG.CONTROL_THRESHOLD) {
                status = 'Controlled';
            } else if (region.influence >= CONFIG.INFLUENCE_THRESHOLD) {
                status = 'Influenced';
            }

            regionSection.innerHTML = `
                <h3>${regionName}</h3>
                <div class="region-status ${status.toLowerCase()}">${status}</div>
                <div class="stats">
                    <div class="stat">
                        <label>Influence:</label>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${(region.influence / CONFIG.MAX_INFLUENCE) * 100}%"></div>
                        </div>
                        <span>${Math.round(region.influence)}%</span>
                    </div>
                    <div class="stat">
                        <label>Control:</label>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${(region.control / CONFIG.MAX_CONTROL) * 100}%"></div>
                        </div>
                        <span>${Math.round(region.control)}%</span>
                    </div>
                    <div class="stat">
                        <label>Resistance:</label>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${(region.resistance / CONFIG.MAX_RESISTANCE) * 100}%"></div>
                        </div>
                        <span>${Math.round(region.resistance)}%</span>
                    </div>
                </div>
            `;
            regionsList.appendChild(regionSection);
        });
    }

    updateUI() {
        this.worldMap.render();
        this.updateRegionsDisplay();
        this.updateStatusDisplays();
    }

    setupEventListeners() {
        // Game menu button
        this.gameMenuButton.addEventListener('click', () => {
            this.gameMenu.style.display = this.gameMenu.style.display === 'flex' ? 'none' : 'flex';
        });

        // Game menu options
        const resumeButton = document.getElementById('resume-button');
        const saveButton = document.getElementById('save-button');
        const restartButton = document.getElementById('restart-button');
        const quitToMenuButton = document.getElementById('quit-to-menu-button');

        if (resumeButton) {
            resumeButton.addEventListener('click', () => {
                this.gameMenu.style.display = 'none';
            });
        }

        if (saveButton) {
            saveButton.addEventListener('click', () => {
                this.gameLogic.saveGame();
                this.gameMenu.style.display = 'none';
            });
        }

        if (restartButton) {
            restartButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to restart? All progress will be lost.')) {
                    // Reset UI state
                    this.state = {
                        points: 0,
                        days: 0,
                        regions: {},
                        purchasedUpgrades: new Set()
                    };
                    
                    // Update UI displays
                    this.updateStatusDisplays();
                    this.updateRegionsDisplay();
                    
                    // Stop game loop if running
                    if (this.gameLoopInterval) {
                        clearInterval(this.gameLoopInterval);
                    }
                    
                    // Hide game container and menu
                    this.gameMenu.style.display = 'none';
                    const gameContainer = document.getElementById('game-container');
                    if (gameContainer) {
                        gameContainer.style.display = 'none';
                    }
                    
                    // Show main menu
                    this.mainMenu.style.display = 'flex';
                }
            });
        }

        if (quitToMenuButton) {
            quitToMenuButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to quit to main menu?')) {
                    // Stop the game loop
                    if (this.gameLoopInterval) {
                        clearInterval(this.gameLoopInterval);
                    }
                    
                    // Hide game container and menu
                    this.gameMenu.style.display = 'none';
                    const gameContainer = document.getElementById('game-container');
                    if (gameContainer) {
                        gameContainer.style.display = 'none';
                    }
                    
                    // Show main menu
                    this.mainMenu.style.display = 'flex';
                }
            });
        }

        // Close game menu when clicking outside
        document.addEventListener('click', (event) => {
            if (!this.gameMenu.contains(event.target) && 
                event.target !== this.gameMenuButton &&
                this.gameMenu.style.display === 'flex') {
                this.gameMenu.style.display = 'none';
            }
        });
    }

    showLoadingScreen() {
        if (!this.loadingScreen || !this.loadingProgress || !this.loadingText) {
            console.error('Loading screen elements not initialized');
            return;
        }
        
        this.loadingScreen.style.display = 'flex';
        this.loadingProgress.style.width = '0%';
        this.loadingText.textContent = 'Initializing AI systems...';
    }

    hideLoadingScreen() {
        if (!this.loadingScreen) {
            console.error('Loading screen not initialized');
            return;
        }
        
        this.loadingScreen.style.display = 'none';
    }

    updateLoadingProgress(progress, text) {
        if (!this.loadingProgress || !this.loadingText) {
            console.error('Loading screen elements not initialized');
            return;
        }
        
        this.loadingProgress.style.width = `${progress}%`;
        if (text) {
            this.loadingText.textContent = text;
        }
    }

    restartGame() {
        if (confirm('Are you sure you want to restart the game? All progress will be lost.')) {
            window.location.reload();
        }
    }

    quitGame() {
        if (confirm('Are you sure you want to quit the game?')) {
            window.close();
        }
    }

    showAchievement(achievement) {
        // Create achievement notification
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">🏆</div>
            <div class="achievement-content">
                <h3>${achievement.name}</h3>
                <p>${achievement.description}</p>
            </div>
        `;

        // Add to document
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Remove after animation
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 3000);
    }

    showGameOver() {
        const gameOverScreen = document.getElementById('game-over-screen');
        const gameOverMessage = document.getElementById('game-over-message');
        const gameOverStats = document.getElementById('game-over-stats');
        
        if (!gameOverScreen || !gameOverMessage || !gameOverStats) {
            console.error('Game over screen elements not found');
            return;
        }
        
        // Update game over message and stats
        gameOverMessage.textContent = 'Game Over';
        gameOverStats.textContent = `Final Stats:
            Days: ${this.gameLogic.state.days}
            Points: ${this.gameLogic.state.points}
            Influence: ${this.gameLogic.state.influence.toFixed(1)}%
            Control: ${this.gameLogic.state.control.toFixed(1)}%
            Resistance: ${this.gameLogic.state.resistance.toFixed(1)}%`;
        
        // Show game over screen
        gameOverScreen.style.display = 'flex';
    }

    hideGameOver() {
        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen) {
            gameOverScreen.style.display = 'none';
        }
    }
}