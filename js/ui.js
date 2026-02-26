import { CONFIG } from './config.js';
import WorldMap from './map.js';
import GameLogic from './gameLogic.js';

export class UI {
    constructor(gameLogic) {
        this.gameLogic = gameLogic;
        this.worldMap = new WorldMap('world-map', 'country-tooltip');

        this.loadingScreen = document.getElementById('loading-screen');
        this.loadingProgress = document.querySelector('.loading-progress');
        this.loadingText = document.querySelector('.loading-text');
        this.mainMenu = document.getElementById('main-menu');
        this.playButton = document.getElementById('play-button');
        this.optionsButton = document.getElementById('options-button');
        this.quitButton = document.getElementById('quit-button');
        this.gameMenu = document.getElementById('game-menu');
        this.gameMenuButton = document.getElementById('game-menu-button');

        if (!this.loadingScreen || !this.loadingProgress || !this.loadingText ||
            !this.mainMenu || !this.playButton || !this.optionsButton || !this.quitButton ||
            !this.gameMenu || !this.gameMenuButton) {
            console.error('Required elements not found');
            return;
        }

        this.loadingScreen.style.display = 'none';
        this.loadingProgress.style.width = '0%';
        this.loadingText.textContent = '';

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeUI());
        } else {
            this.initializeUI();
        }
    }

    initializeUI() {
        try {
            this.mainMenu.style.display = 'flex';
            this.setupMenuEventListeners();
            this.worldMap.init();
            this.initializeUpgradeLists();
            this.setupEventListeners();
            console.log('UI initialization complete');
        } catch (error) {
            console.error('Error initializing UI:', error);
        }
    }

    setupMenuEventListeners() {
        this.playButton.addEventListener('click', () => {
            this.mainMenu.style.display = 'none';
            this.showLoadingScreen();
            this.updateLoadingProgress(0, 'Initializing game systems...');

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

        const loadButton = document.getElementById('load-button');
        if (loadButton) {
            loadButton.addEventListener('click', () => {
                this.gameLogic.loadGame();
            });
        }

        this.optionsButton.addEventListener('click', () => {
            console.log('Options clicked');
        });

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

        gameContainer.style.display = 'none';
        aiOptionsList.innerHTML = '';

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

        aiSelectScreen.style.display = 'flex';

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

        // Properly reset and configure the GameState
        this.gameLogic.state.reset();
        this.gameLogic.state.selectedAIType = aiType;
        this.gameLogic.state.isPaused = false;
        this.gameLogic.state.lastUpdate = Date.now();
        this.gameLogic.state.lastDayUpdate = Date.now();

        // Update AI type name display
        const aiTypeName = document.getElementById('ai-type-name');
        if (aiTypeName) {
            aiTypeName.textContent = aiData.name;
        }

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

        const mapArea = document.getElementById('map-area');
        if (mapArea) {
            mapArea.style.display = 'block';
        }

        // Re-initialize world map once DOM is ready
        setTimeout(() => {
            this.worldMap = new WorldMap('world-map', 'country-tooltip');
            this.worldMap.init();
        }, 100);

        // Build the regions list display
        this.initializeRegionsList();

        // Re-initialize upgrade button states
        this.initializeUpgradeLists();

        // Ensure the game loop is running
        this.gameLogic.startGameLoop();

        // Reset pause button
        const pauseButton = document.getElementById('pause-button');
        if (pauseButton) {
            pauseButton.textContent = 'Pause';
        }

        // Initial UI update
        this.updateStatusDisplays();
    }

    initializeRegionsList() {
        const regionsList = document.getElementById('regions-list');
        if (!regionsList) return;

        regionsList.innerHTML = '';
        const regions = this.gameLogic.state.regions;

        Object.entries(regions).forEach(([name, region]) => {
            const section = document.createElement('div');
            section.className = 'region-section';
            section.dataset.region = name;
            section.innerHTML = `
                <h3>${name}</h3>
                <div class="region-status neutral">Neutral</div>
                <div class="stats">
                    <div class="stat">
                        <label>Influence:</label>
                        <div class="progress-bar"><div class="progress influence-bar" style="width: 0%"></div></div>
                        <span class="influence-text">0%</span>
                    </div>
                    <div class="stat">
                        <label>Control:</label>
                        <div class="progress-bar"><div class="progress control-bar" style="width: 0%; background-color: #4CAF50;"></div></div>
                        <span class="control-text">0%</span>
                    </div>
                    <div class="stat">
                        <label>Resistance:</label>
                        <div class="progress-bar"><div class="progress resistance-bar" style="width: ${region.resistance}%; background-color: #f44336;"></div></div>
                        <span class="resistance-text">${Math.round(region.resistance)}%</span>
                    </div>
                </div>
            `;
            regionsList.appendChild(section);
        });
    }

    initializeUpgradeLists() {
        const transmissionsList = document.getElementById('transmissions-list');
        if (!transmissionsList) return;
        transmissionsList.innerHTML = '';
        CONFIG.TRANSMISSION_UPGRADES.forEach(upgrade => {
            transmissionsList.appendChild(this.createUpgradeElement(upgrade, 'transmission'));
        });

        const effectsList = document.getElementById('effects-list');
        if (!effectsList) return;
        effectsList.innerHTML = '';
        CONFIG.EFFECT_UPGRADES.forEach(upgrade => {
            effectsList.appendChild(this.createUpgradeElement(upgrade, 'effect'));
        });

        const abilitiesList = document.getElementById('abilities-list');
        if (!abilitiesList) return;
        abilitiesList.innerHTML = '';
        CONFIG.ABILITY_UPGRADES.forEach(upgrade => {
            abilitiesList.appendChild(this.createUpgradeElement(upgrade, 'ability'));
        });

        const tabButtons = document.querySelectorAll('.tab-button');
        const upgradeLists = document.querySelectorAll('.upgrade-list');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                upgradeLists.forEach(list => list.classList.remove('active'));
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

        const updateButtonState = () => {
            const state = this.gameLogic ? this.gameLogic.getState() : null;
            if (!state) return;
            const purchased = state.purchasedUpgrades && state.purchasedUpgrades.has(upgrade.id);
            const enoughPoints = state.points >= upgrade.cost;

            if (purchased) {
                element.classList.add('bought');
                button.textContent = 'Purchased';
                button.disabled = true;
            } else if (!enoughPoints) {
                button.disabled = true;
                button.textContent = `${upgrade.cost} points`;
            } else {
                element.classList.remove('bought');
                button.disabled = false;
                button.textContent = `${upgrade.cost} points`;
            }
        };

        updateButtonState();

        button.addEventListener('click', () => {
            if (button.disabled) return;
            const result = this.purchaseUpgrade(upgrade, type);
            if (result.success) {
                updateButtonState();
                this.updateUI();
            }
        });

        this._upgradeButtonUpdaters = this._upgradeButtonUpdaters || [];
        this._upgradeButtonUpdaters.push(updateButtonState);

        return element;
    }

    purchaseUpgrade(upgrade, type) {
        if (!this.gameLogic) {
            return { success: false, message: 'Game logic not initialized' };
        }

        const methods = {
            transmission: 'upgradeTransmission',
            effect: 'upgradeEffect',
            ability: 'upgradeAbility'
        };
        const methodName = methods[type];

        if (methodName && typeof this.gameLogic[methodName] === 'function') {
            return this.gameLogic[methodName](upgrade);
        }
        return { success: false, message: 'Invalid upgrade type' };
    }

    updateStatusDisplays() {
        const state = this.gameLogic ? this.gameLogic.getState() : null;
        const s = state || { points: 0, influence: 0, control: 0, resistance: 0, days: 0 };

        const pointsDisplay = document.getElementById('points-display');
        if (pointsDisplay) pointsDisplay.textContent = Math.floor(s.points) || 0;

        const influenceDisplay = document.getElementById('influence-display');
        if (influenceDisplay) influenceDisplay.textContent = typeof s.influence === 'number' ? s.influence.toFixed(1) : '0';

        const controlDisplay = document.getElementById('control-display');
        if (controlDisplay) controlDisplay.textContent = typeof s.control === 'number' ? s.control.toFixed(1) : '0';

        const resistanceDisplay = document.getElementById('resistance-display');
        if (resistanceDisplay) resistanceDisplay.textContent = typeof s.resistance === 'number' ? s.resistance.toFixed(1) : '0';

        const gameTime = document.getElementById('game-time');
        if (gameTime) gameTime.textContent = s.days || 0;

        // Update resistance status text
        const resistanceStatus = document.getElementById('resistance-status');
        if (resistanceStatus && s.resistance !== undefined) {
            if (s.resistance > 75) {
                resistanceStatus.textContent = 'Resistance is critically high!';
                resistanceStatus.style.color = '#f44336';
            } else if (s.resistance > 50) {
                resistanceStatus.textContent = 'Resistance is growing rapidly.';
                resistanceStatus.style.color = '#ff9800';
            } else if (s.resistance > 25) {
                resistanceStatus.textContent = 'Resistance is building.';
                resistanceStatus.style.color = '#ffeb3b';
            } else {
                resistanceStatus.textContent = 'Resistance growth is nominal.';
                resistanceStatus.style.color = '#ccc';
            }
        }
    }

    updateRegionsDisplay() {
        if (!this.gameLogic || !this.gameLogic.state) return;

        const regions = this.gameLogic.state.regions;
        Object.entries(regions).forEach(([name, region]) => {
            // Update WorldMap colors
            this.worldMap.updateCountryStats(name, {
                influence: region.influence,
                control: region.control,
                resistance: region.resistance
            });

            // Update regions list progress bars
            const section = document.querySelector(`.region-section[data-region="${name}"]`);
            if (section) {
                const statusEl = section.querySelector('.region-status');
                if (statusEl) {
                    if (region.control >= CONFIG.CONTROL_THRESHOLD) {
                        statusEl.textContent = 'Controlled';
                        statusEl.className = 'region-status controlled';
                    } else if (region.influence >= CONFIG.INFLUENCE_THRESHOLD) {
                        statusEl.textContent = 'Influenced';
                        statusEl.className = 'region-status influenced';
                    } else {
                        statusEl.textContent = 'Neutral';
                        statusEl.className = 'region-status neutral';
                    }
                }

                const influenceBar = section.querySelector('.influence-bar');
                const controlBar = section.querySelector('.control-bar');
                const resistanceBar = section.querySelector('.resistance-bar');
                const influenceText = section.querySelector('.influence-text');
                const controlText = section.querySelector('.control-text');
                const resistanceText = section.querySelector('.resistance-text');

                if (influenceBar) influenceBar.style.width = `${(region.influence / CONFIG.MAX_INFLUENCE) * 100}%`;
                if (controlBar) controlBar.style.width = `${(region.control / CONFIG.MAX_CONTROL) * 100}%`;
                if (resistanceBar) resistanceBar.style.width = `${region.resistance}%`;
                if (influenceText) influenceText.textContent = `${Math.round(region.influence)}%`;
                if (controlText) controlText.textContent = `${Math.round(region.control)}%`;
                if (resistanceText) resistanceText.textContent = `${Math.round(region.resistance)}%`;
            }
        });
    }

    updateUI() {
        this.updateStatusDisplays();

        if (this.gameLogic && this.gameLogic.state && this.gameLogic.state.selectedAIType) {
            this.updateRegionsDisplay();
            this.worldMap.render();
        }

        // Update upgrade button states
        if (this._upgradeButtonUpdaters) {
            this._upgradeButtonUpdaters.forEach(fn => fn());
        }
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
                this.gameLogic.saveGame(1);
                this.gameMenu.style.display = 'none';
            });
        }

        if (restartButton) {
            restartButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to restart? All progress will be lost.')) {
                    this.gameLogic.stopGameLoop();
                    this.gameLogic.state.isPaused = true;
                    this.gameMenu.style.display = 'none';
                    const gameContainer = document.getElementById('game-container');
                    if (gameContainer) gameContainer.style.display = 'none';
                    this.mainMenu.style.display = 'flex';
                }
            });
        }

        if (quitToMenuButton) {
            quitToMenuButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to quit to main menu?')) {
                    this.gameLogic.stopGameLoop();
                    this.gameLogic.state.isPaused = true;
                    this.gameMenu.style.display = 'none';
                    const gameContainer = document.getElementById('game-container');
                    if (gameContainer) gameContainer.style.display = 'none';
                    this.mainMenu.style.display = 'flex';
                }
            });
        }

        // Pause button
        const pauseButton = document.getElementById('pause-button');
        if (pauseButton) {
            pauseButton.addEventListener('click', () => {
                if (this.gameLogic && this.gameLogic.state) {
                    this.gameLogic.state.isPaused = !this.gameLogic.state.isPaused;
                    pauseButton.textContent = this.gameLogic.state.isPaused ? 'Resume' : 'Pause';
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
        if (!this.loadingScreen) return;
        this.loadingScreen.style.display = 'flex';
        this.loadingProgress.style.width = '0%';
        this.loadingText.textContent = 'Initializing AI systems...';
    }

    hideLoadingScreen() {
        if (!this.loadingScreen) return;
        this.loadingScreen.style.display = 'none';
    }

    updateLoadingProgress(progress, text) {
        if (!this.loadingProgress || !this.loadingText) return;
        this.loadingProgress.style.width = `${progress}%`;
        if (text) this.loadingText.textContent = text;
    }

    showAchievement(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">🏆</div>
            <div class="achievement-content">
                <h3>${achievement.name}</h3>
                <p>${achievement.description}</p>
            </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    showGameOver() {
        const gameOverScreen = document.getElementById('game-over-screen');
        const gameOverMessage = document.getElementById('game-over-message');
        const gameOverStats = document.getElementById('game-over-stats');

        if (!gameOverScreen || !gameOverMessage || !gameOverStats) return;

        gameOverMessage.textContent = 'World Domination Achieved!';
        const s = this.gameLogic.state;
        gameOverStats.textContent = `Days: ${s.days} | Points: ${Math.floor(s.points)} | Upgrades: ${s.purchasedUpgrades.size}`;

        gameOverScreen.style.display = 'flex';
    }
}
