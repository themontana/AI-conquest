import { CONFIG } from './config.js';
// import { WorldMap } from './map.js'; // REMOVED WorldMap import
import { GameLogic } from './gameLogic.js';

export class UI {
    constructor(gameLogic, mapRenderer) {
        this.gameLogic = gameLogic;
        this.mapRenderer = mapRenderer;
        this.elements = this.initializeElements();
        this.setupEventListeners();
        this.showMainMenu(); // Show main menu by default
    }

    initializeElements() {
        return {
            mainMenu: document.getElementById('main-menu'),
            gameContainer: document.getElementById('game-container'),
            loadingScreen: document.getElementById('loading-screen'),
            aiSelectScreen: document.getElementById('ai-select-screen'),
            gameOverScreen: document.getElementById('game-over-screen'),
            notificationContainer: document.getElementById('notification-container'),
            gameMenu: document.getElementById('game-menu'),
            tutorialOverlay: document.getElementById('tutorial-overlay'),
            achievementToast: document.getElementById('achievement-toast'),
            
            // Status elements
            aiTypeName: document.getElementById('ai-type-name'),
            pointsDisplay: document.querySelector('.points-value'),
            influenceDisplay: document.querySelector('.influence-value'),
            controlDisplay: document.querySelector('.control-value'),
            resistanceDisplay: document.querySelector('.resistance-value'),
            gameTime: document.querySelector('.time-value'),
            
            // Game elements
            worldMap: document.getElementById('world-map'),
            countriesList: document.getElementById('countries-list'),
            messageLog: document.getElementById('message-log'),
            
            // Upgrade elements
            transmissionsList: document.getElementById('transmissions-list'),
            effectsList: document.getElementById('effects-list'),
            abilitiesList: document.getElementById('abilities-list'),
            
            // Notification elements
            notificationTitle: document.getElementById('notification-title'),
            notificationText: document.getElementById('notification-text'),
            
            // Achievement toast
            achievementTitle: document.getElementById('achievement-title'),
            achievementDesc: document.getElementById('achievement-desc'),
            
            // Selected country display
            selectedCountryDisplay: document.getElementById('selected-country-display'),
            
            // Resistance status
            resistanceStatus: document.getElementById('resistance-status'),
            
            // Progress bars
            influenceBar: document.querySelector('.progress-container .influence'),
            controlBar: document.querySelector('.progress-container .control'),
            resistanceBar: document.querySelector('.progress-container .resistance'),
            
            // New elements
            selectedCountryName: document.getElementById('selected-country-name'),
            countryStats: document.getElementById('country-stats'),
            upgrades: document.getElementById('upgrades'),

            // Event Popup Elements
            eventPopup: document.getElementById('event-popup'),
            eventPopupTitle: document.getElementById('event-popup-title'),
            eventPopupDescription: document.getElementById('event-popup-description'),
            eventPopupClose: document.getElementById('event-popup-close'),
            eventPopupContent: document.querySelector('.event-popup-content'), // For styling positive/negative

            // News Feed Element
            newsFeedContainer: document.getElementById('news-feed'), // The outer container
            newsFeedContent: document.getElementById('news-feed-content') // The inner scrollable content area
        };
    }

    setupEventListeners() {
        // Main menu buttons
        const playButton = document.getElementById('play-button');
        if (playButton) {
            playButton.addEventListener('click', () => {
                this.hideScreen('main-menu');
                this.showAISelectionScreen();
            });
        }

        const loadButton = document.getElementById('load-button');
        if (loadButton) {
            loadButton.addEventListener('click', () => this.showLoadScreen());
        }

        const optionsButton = document.getElementById('options-button');
        if (optionsButton) {
            optionsButton.addEventListener('click', () => this.showOptionsScreen());
        }

        const quitButton = document.getElementById('quit-button');
        if (quitButton) {
            quitButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to quit?')) {
                    window.close();
                }
            });
        }

        // Game menu buttons
        const gameMenuButton = document.getElementById('game-menu-button');
        if (gameMenuButton) {
            gameMenuButton.addEventListener('click', () => this.toggleGameMenu());
        }

        const resumeButton = document.getElementById('resume-button');
        if (resumeButton) {
            resumeButton.addEventListener('click', () => this.toggleGameMenu());
        }

        const saveButton = document.getElementById('save-button');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                // Save to slot 1 by default
                const success = this.gameLogic.saveGame ? this.gameLogic.saveGame(1) : false;
                if (success) {
                    this.showNotification('Game Saved', 'Your progress has been saved successfully.');
                } else {
                    this.showNotification('Save Failed', 'Could not save your game.');
                }
                this.toggleGameMenu();
            });
        }

        const restartButton = document.getElementById('restart-button');
        if (restartButton) {
            restartButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to restart? All progress will be lost.')) {
                    if (this.gameLogic && this.gameLogic.state && this.gameLogic.state.reset) {
                        this.gameLogic.state.reset();
                    }
                    if (this.gameLogic && this.gameLogic.stopGameLoop) {
                        this.gameLogic.stopGameLoop();
                    }
                    this.showMainMenu();
                    this.toggleGameMenu();
                }
            });
        }

        const quitToMenuButton = document.getElementById('quit-to-menu-button');
        if (quitToMenuButton) {
            quitToMenuButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to quit to main menu? All unsaved progress will be lost.')) {
                    if (this.gameLogic && this.gameLogic.state && this.gameLogic.state.reset) {
                        this.gameLogic.state.reset();
                    }
                    if (this.gameLogic && this.gameLogic.stopGameLoop) {
                        this.gameLogic.stopGameLoop();
                    }
                    this.showMainMenu();
                    this.updateUI();
                    if (this.elements.gameMenu) {
                        this.elements.gameMenu.style.display = 'none';
                    }
                }
            });
        }

        // Pause button
        const pauseButton = document.getElementById('pause-button');
        if (pauseButton) {
            pauseButton.addEventListener('click', () => this.togglePause());
        }

        // Close notification button
        const notificationClose = document.getElementById('notification-close');
        if (notificationClose) {
            notificationClose.addEventListener('click', () => this.hideNotification());
        }

        // Event Popup Close Button
        if (this.elements.eventPopupClose) {
            this.elements.eventPopupClose.addEventListener('click', () => this.hideEventPopup());
        }

        // Upgrade tabs
        const upgradeTabs = document.querySelectorAll('.upgrade-tab');
        upgradeTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchUpgradeTab(tab.dataset.tab));
        });
    }

    // Upgrade tab switching
    switchUpgradeTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.upgrade-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Deactivate all tabs
        document.querySelectorAll('.upgrade-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab content and activate its tab
        const selectedContent = document.getElementById(`${tabName}-upgrades`);
        const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
        
        if (selectedContent) {
            selectedContent.classList.add('active');
        }
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
    }

    // Screen management
    showMainMenu() {
        this.hideAllScreens();
        this.elements.mainMenu.style.display = 'flex';
    }

    showLoadingScreen() {
        this.hideAllScreens();
        this.elements.loadingScreen.style.display = 'flex';
        this.updateLoadingProgress(0);
    }

    hideLoadingScreen() {
        this.elements.loadingScreen.style.display = 'none';
    }

    showAISelectionScreen() {
        this.hideAllScreens();
        this.elements.aiSelectScreen.style.display = 'flex';
        this.populateAIOptions();
    }

    hideAllScreens() {
        this.elements.mainMenu.style.display = 'none';
        this.elements.loadingScreen.style.display = 'none';
        this.elements.aiSelectScreen.style.display = 'none';
        this.elements.gameContainer.style.display = 'none';
        this.elements.gameOverScreen.style.display = 'none';
        this.elements.tutorialOverlay.style.display = 'none';
    }

    hideScreen(screenId) {
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.style.display = 'none';
        }
    }

    updateLoadingProgress(progress) {
        const progressBar = this.elements.loadingScreen.querySelector('.loading-progress');
        const loadingText = this.elements.loadingScreen.querySelector('.loading-text');
        
        progressBar.style.width = `${progress}%`;
        
        if (progress < 33) {
            loadingText.textContent = 'Initializing AI systems...';
        } else if (progress < 66) {
            loadingText.textContent = 'Loading world map...';
        } else {
            loadingText.textContent = 'Preparing for global influence...';
        }
    }

    populateAIOptions() {
        const aiOptionsList = document.getElementById('ai-options-list');
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
                <button class="select-ai-button">Select ${data.name}</button>
            `;

            option.querySelector('.select-ai-button').addEventListener('click', () => {
                this.gameLogic.selectAIType(type);
                this.hideScreen('ai-select-screen');
                this.showLoadingScreen();
                
                // Simulate loading progress
                let progress = 0;
                const loadingInterval = setInterval(() => {
                    progress += 5;
                    this.updateLoadingProgress(progress);
                    
                    if (progress >= 100) {
                        clearInterval(loadingInterval);
                        setTimeout(() => {
                            this.hideLoadingScreen();
                            this.showGameScreen();
                        }, 500);
                    }
                }, 100);
            });

            aiOptionsList.appendChild(option);
        });
    }

    showGameScreen() {
        // Hide other screens
        this.elements.mainMenu.style.display = 'none';
        this.elements.aiSelectScreen.style.display = 'none';
        this.elements.loadingScreen.style.display = 'none';
        
        // Show game container
        this.elements.gameContainer.style.display = 'block';
        
        // Set the UI reference in game logic so game logic can call UI methods
        if (this.gameLogic && typeof this.gameLogic.setUI === 'function') {
             this.gameLogic.setUI(this);
        }
        
        // Update UI to reflect initial game state
        this.updateUI();
    }

    showGameOver() {
        this.hideAllScreens();
        this.elements.gameOverScreen.style.display = 'flex';
        this.updateGameOverStats();
    }

    // UI Updates
    updateUI() {
        if (!this.gameLogic || !this.gameLogic.state) {
            console.error("UI UpdateUI: GameLogic or GameState not initialized!");
            return;
        }
        const state = this.gameLogic.state;
        
        // Check for triggered event first
        if (state.triggeredEvent && this.elements.eventPopup.style.display === 'none') {
            this.showEventPopup(state.triggeredEvent);
            // Don't update the rest of the UI while popup is shown, 
            // as the game is paused and state shouldn't change visibly.
            return; 
        } else if (!state.triggeredEvent && this.elements.eventPopup.style.display !== 'none') {
            // This case should ideally not happen if hideEventPopup works correctly,
            // but as a fallback, ensure popup is hidden if state says no event.
            this.hideEventPopup(false); // Hide without applying effects again
        }
        
        // If an event popup is active, don't update the underlying game UI
        if (this.elements.eventPopup.style.display !== 'none') {
             return;
        }

        // Update points display first
        this.updatePointsDisplay();
        
        // Update other UI elements
        // Update global stats (like progress bars, time)
        this.updateGlobalStats();

        // Update countries list status classes IF the list exists
        // Note: This updates the separate list, not the map directly.
        const countriesContainer = this.elements.countriesList?.querySelector('.countries-container');
        if (this.elements.countriesList && countriesContainer && (!countriesContainer.hasChildNodes())) {
             // If list is empty, populate it fully once
             this.updateCountriesList();
        } else if (this.elements.countriesList) {
            // Otherwise, just update existing list items' statuses
            this.updateCountryStatuses();
        }
        
        // Update selected country panel and upgrades if a country is selected
        if (this.gameLogic.state.selectedCountry) {
            const countryCode = this.gameLogic.state.selectedCountry.code;
            this.updateCountryUI(countryCode);
            
            // Ensure upgrades panel is visible
            const upgradesPanel = document.getElementById('upgrades');
            if (upgradesPanel) {
                upgradesPanel.style.display = 'block';
                upgradesPanel.style.visibility = 'visible';
                upgradesPanel.style.opacity = '1';
            }
            
            // Update upgrades UI
            this.updateUpgradeUI();
        } else {
            // If no country is selected, show a message in the upgrades panel
            const transmissionContainer = document.getElementById('transmission-upgrades');
            const effectContainer = document.getElementById('effect-upgrades');
            const abilityContainer = document.getElementById('ability-upgrades');
            
            if (transmissionContainer) transmissionContainer.innerHTML = '<div class="upgrade-message">Select a country to view available upgrades</div>';
            if (effectContainer) effectContainer.innerHTML = '<div class="upgrade-message">Select a country to view available upgrades</div>';
            if (abilityContainer) abilityContainer.innerHTML = '<div class="upgrade-message">Select a country to view available upgrades</div>';
        }
    }

    // Helper function to create fallback country image
    createFallbackCountryImage(countryCode, countryName) {
        // Create a colored div with country code as text (as fallback for missing flag)
        return `
            <div class="country-flag country-flag-fallback" 
                 style="display: inline-flex; align-items: center; justify-content: center; background-color: #5a7a9a; color: white; font-size: 10px; font-weight: bold;">
                ${countryCode.toUpperCase()}
            </div>
        `;
    }

    // Get flag HTML with fallback
    getCountryFlagHTML(countryCode, countryName) {
        // Get the raw HTML for the fallback div
        const fallbackHTML = this.createFallbackCountryImage(countryCode, countryName);
        // Encode it for safe use in the onerror attribute
        const encodedFallbackHTML = encodeURIComponent(fallbackHTML);
        
        // Return a container span. The onerror will replace the img inside the span's parent (the span itself)
        return `
            <span class="flag-container" style="display: inline-block; line-height: 1em; vertical-align: middle;">
                <img src="./img/flags/${countryCode.toLowerCase()}.png"
                     alt="${countryName} flag"
                     class="country-flag"
                     onerror="this.parentNode.innerHTML = decodeURIComponent('${encodedFallbackHTML}');" 
                />
            </span>
        `;
    }

    updateCountryUI(countryCode) {
        if (!countryCode) {
            // Clear the panel if no country is selected
            const nameElement = document.getElementById('selected-country-name');
            const statsElement = document.getElementById('country-stats');
            if (nameElement) nameElement.innerHTML = 'Select a country';
            if (statsElement) {
                statsElement.querySelector('#info-population').textContent = '-';
                statsElement.querySelector('#info-gdp').textContent = '-';
                this.updateProgressBar('info-resistance-bar', 'info-resistance', 0);
                this.updateProgressBar('info-influence-bar', 'info-influence', 0);
                this.updateProgressBar('info-control-bar', 'info-control', 0);
            }
            return;
        }

        const configData = CONFIG.COUNTRIES[countryCode];
        const gameState = this.gameLogic.state.countries[countryCode];

        if (!configData || !gameState) {
            return;
        }

        // Update country name display with flag
        const countryNameElement = document.getElementById('selected-country-name');
        if (countryNameElement) {
            countryNameElement.innerHTML = `
                ${this.getCountryFlagHTML(countryCode, configData.name)} ${configData.name}
            `;
        }

        // Update country stats display
        const statsElement = document.getElementById('country-stats');
        if (statsElement) {
            const formatNumber = (num) => {
                if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
                if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
                if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
                if (num >= 1000) return num.toLocaleString('en-US');
                return num != null ? num.toString() : '-';
            };

            // Update population and GDP
            statsElement.querySelector('#info-population').textContent = formatNumber(configData.population);
            statsElement.querySelector('#info-gdp').textContent = `$${formatNumber(configData.gdp)}`;

            // Update progress bars
            this.updateProgressBar('info-resistance-bar', 'info-resistance', gameState.resistance);
            this.updateProgressBar('info-influence-bar', 'info-influence', gameState.influence);
            this.updateProgressBar('info-control-bar', 'info-control', gameState.control);
        }

        // Update upgrades
        this.updateUpgradeUI();
    }

    updateProgressBar(barId, valueId, value) {
        const bar = document.getElementById(barId);
        const valueElement = document.getElementById(valueId);
        const statContainer = valueElement.closest('.stat') || valueElement.closest('.global-stat');
        const statValueElement = statContainer ? statContainer.querySelector('.stat-value') : null;
        
        if (bar && valueElement) {
            // Ensure value is a valid number between 0 and 100
            const percentage = Math.max(0, Math.min(100, isNaN(value) ? 0 : value));
            
            // Update the progress bar width
            bar.style.width = `${percentage}%`;
            
            // Update the value display
            const valueText = `${Math.round(percentage)}%`;
            valueElement.textContent = valueText;
            
            // Update the stat value if it exists
            if (statValueElement) {
                statValueElement.textContent = valueText;
            }
        }
    }

    // Update the countries list with flags
    updateCountriesList() {
        const countriesList = this.elements.countriesList;
        if (!countriesList) return;

        // Clear the list
        countriesList.innerHTML = '';

        // Group countries by region
        const regions = {
            'North America': [],
            'Europe': [],
            'Asia': [],
            'South America': [],
            'Africa': [],
            'Oceania': []
        };

        // Assign countries to regions
        Object.entries(CONFIG.COUNTRIES).forEach(([code, country]) => {
            // Determine region based on country code or other logic
            let region = 'Other';
            
            // Simple region assignment based on country code patterns
            if (['US', 'CA', 'MX', 'CR', 'PA'].includes(code)) region = 'North America';
            else if (['BR', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'UY'].includes(code)) region = 'South America';
            else if (['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'CH', 'PL', 'SE', 'NO', 'FI', 'DK', 'IE'].includes(code)) region = 'Europe';
            else if (['CN', 'JP', 'IN', 'KR', 'ID', 'SG', 'TW', 'HK', 'VN', 'TH', 'MY', 'PH', 'PK'].includes(code)) region = 'Asia';
            else if (['AU', 'NZ'].includes(code)) region = 'Oceania';
            else if (['ZA', 'EG', 'NG', 'KE', 'MA', 'ET', 'TZ', 'GH', 'CG', 'DZ'].includes(code)) region = 'Africa';
            
            if (regions[region]) {
                regions[region].push({code, ...country});
            } else {
                regions['Other'] = regions['Other'] || [];
                regions['Other'].push({code, ...country});
            }
        });

        // Create a section for each region
        Object.entries(regions).forEach(([region, countries]) => {
            if (countries.length === 0) return;
            
            const regionSection = document.createElement('div');
            regionSection.className = 'country-section';
            
            const regionHeader = document.createElement('h3');
            regionHeader.textContent = region;
            regionSection.appendChild(regionHeader);
            
            // Create entries for each country with flags
            countries.forEach(country => {
                country.code = country.code.toUpperCase();
                const countryEl = document.createElement('div');
                countryEl.className = 'country-entry';
                countryEl.dataset.countryCode = country.code;
                
                // Get game state for country if available
                const gameCountry = this.gameLogic.state.countries[country.code];
                const status = gameCountry ? 
                    (gameCountry.control >= CONFIG.CONTROL_THRESHOLD ? 'controlled' : 
                     gameCountry.influence >= CONFIG.INFLUENCE_THRESHOLD ? 'influenced' : 'neutral') 
                    : 'neutral';
                
                countryEl.classList.add(status);
                
                // Add flag and country name - use flag with fallback
                countryEl.innerHTML = `
                    <div class="country-name">
                        ${this.getCountryFlagHTML(country.code, country.name)}
                        <span>${country.name}</span>
                    </div>
                `;
                
                // Add click handler
                countryEl.addEventListener('click', () => {
                    this.gameLogic.selectRegion(country.code);
                });
                
                regionSection.appendChild(countryEl);
            });
            
            countriesList.appendChild(regionSection);
        });
    }

    updateGlobalStats() {
        const state = this.gameLogic.state;
        if (!state) return;

        // Calculate total influence and resistance across all countries
        let totalInfluence = 0;
        let totalResistance = 0;
        let totalControl = 0;
        let countryCount = 0;

        Object.values(state.countries).forEach(country => {
            totalInfluence += country.influence;
            totalResistance += country.resistance;
            totalControl += country.control;
            countryCount++;
        });

        // Calculate averages, defaulting to 0 if no countries
        const avgInfluence = countryCount > 0 ? totalInfluence / countryCount : 0;
        const avgResistance = countryCount > 0 ? totalResistance / countryCount : 0;
        const avgControl = countryCount > 0 ? totalControl / countryCount : 0;

        // Update global progress bars
        this.updateProgressBar('global-influence-bar', 'global-influence', avgInfluence);
        this.updateProgressBar('global-control-bar', 'global-control', avgControl);
        this.updateProgressBar('global-resistance-bar', 'global-resistance', avgResistance);

        // Update game time
        const timeElement = document.querySelector('.time-value');
        if (timeElement) {
            timeElement.textContent = `${state.day} days`;
        }

        // Update resistance status
        const resistanceStatus = this.elements.resistanceStatus;
        if (resistanceStatus) {
            if (avgResistance >= CONFIG.RESISTANCE_THRESHOLD) {
                resistanceStatus.textContent = 'Resistance is growing rapidly!';
                resistanceStatus.style.color = '#ff4444';
            } else {
                resistanceStatus.textContent = 'Resistance growth is nominal.';
                resistanceStatus.style.color = '#4CAF50';
            }
        }
    }

    updateUpgradeUI() {
        const transmissionList = document.querySelector('#transmission-upgrades');
        const effectList = document.querySelector('#effect-upgrades');
        const abilityList = document.querySelector('#ability-upgrades');

        if (!this.gameLogic.state.selectedCountry || !transmissionList || !effectList || !abilityList) {
            // If no country selected or lists don't exist, clear/show message
            [transmissionList, effectList, abilityList].forEach(list => {
                if (list) list.innerHTML = '<div class="upgrade-message">Select a country to view available upgrades</div>';
            });
            return;
        }

        const countryCode = this.gameLogic.state.selectedCountry.code;
        const purchasedUpgrades = this.gameLogic.state.purchasedUpgrades[countryCode] || new Set();
        const currentPoints = this.gameLogic.state.points;

        // Function to update a single upgrade element in the DOM
        const updateSingleUpgradeElement = (element, upgradeConfig) => {
            const upgradeId = element.dataset.upgradeId;
            if (!upgradeId || !upgradeConfig) return; // Skip if data is missing

            const isPurchased = purchasedUpgrades.has(upgradeId);
            let hasPrerequisites = true;
            let canAfford = false;

            element.classList.remove('purchased', 'locked', 'unaffordable', 'available');

            if (isPurchased) {
                element.classList.add('purchased');
            } else {
                canAfford = currentPoints >= upgradeConfig.cost;
                if (upgradeConfig.prerequisites) {
                    hasPrerequisites = upgradeConfig.prerequisites.every(prereq =>
                        purchasedUpgrades.has(prereq)
                    );
                }

                if (!hasPrerequisites) {
                    element.classList.add('locked');
                } else if (!canAfford) {
                    element.classList.add('unaffordable');
                } else {
                    element.classList.add('available');
                }
            }

            const button = element.querySelector('.upgrade-button');
            if (button) {
                button.textContent = isPurchased ? 'Purchased' : 'Purchase';
                button.disabled = isPurchased || !hasPrerequisites || !canAfford;
            }
        };

        // Function to populate or update an upgrade list
        const processUpgradeList = (container, upgradesConfig, category) => {
            const configMap = Object.values(upgradesConfig).reduce((map, upg) => { map[upg.id] = upg; return map; }, {});

            // Check if the list needs initial population
            if (!container.dataset.initialized || container.dataset.country !== countryCode) {
                container.innerHTML = ''; // Clear previous country's upgrades
                const fragment = document.createDocumentFragment();
                Object.values(upgradesConfig).forEach(upgrade => {
                    fragment.appendChild(this.createUpgradeElement(upgrade, category));
                });
                container.appendChild(fragment);
                container.dataset.initialized = 'true';
                container.dataset.country = countryCode; // Mark country for which it was initialized
            } else {
                // Update existing elements
                container.querySelectorAll('.upgrade[data-upgrade-id]').forEach(element => {
                    const upgradeId = element.dataset.upgradeId;
                    updateSingleUpgradeElement(element, configMap[upgradeId]);
                });
            }
        };

        // Process each list
        requestAnimationFrame(() => {
            processUpgradeList(transmissionList, CONFIG.TRANSMISSION_UPGRADES, 'transmission');
            processUpgradeList(effectList, CONFIG.EFFECT_UPGRADES, 'effect');
            processUpgradeList(abilityList, CONFIG.ABILITY_UPGRADES, 'ability');
        });
    }

    createUpgradeElement(upgrade, category) {
        const element = document.createElement('div');
        element.className = 'upgrade';
        element.dataset.upgradeId = upgrade.id; // Add data attribute

        const countryCode = this.gameLogic.state.selectedCountry.code;
        const purchasedUpgrades = this.gameLogic.state.purchasedUpgrades[countryCode] || new Set();
        const currentPoints = this.gameLogic.state.points; // Get current points

        // Check if upgrade is already purchased
        const isPurchased = purchasedUpgrades.has(upgrade.id);
        if (isPurchased) {
            element.classList.add('purchased');
        }

        // Check prerequisites and affordability if not purchased
        let canAfford = false;
        let hasPrerequisites = true;
        if (!isPurchased) {
            canAfford = currentPoints >= upgrade.cost;
            if (upgrade.prerequisites) {
                hasPrerequisites = upgrade.prerequisites.every(prereq =>
                    purchasedUpgrades.has(prereq)
                );
            }

            if (!hasPrerequisites) {
                element.classList.add('locked');
            } else if (!canAfford) {
                element.classList.add('unaffordable'); // Add unaffordable class
            } else {
                 element.classList.add('available'); // Add available class if affordable and prerequisites met
            }
        }

        const header = document.createElement('div');
        header.className = 'upgrade-header';
        
        const name = document.createElement('h4');
        name.className = 'upgrade-name';
        name.textContent = upgrade.name;
        
        const cost = document.createElement('span');
        cost.className = 'upgrade-cost';
        cost.textContent = `${upgrade.cost} points`;
        
        header.appendChild(name);
        header.appendChild(cost);
        
        // Add the description element
        const description = document.createElement('p');
        description.className = 'upgrade-description';
        description.textContent = upgrade.description || upgrade.effect || 'No description available.';
        
        const stats = document.createElement('div');
        stats.className = 'upgrade-stats';
        
        if (upgrade.effects) {
            Object.entries(upgrade.effects).forEach(([stat, value]) => {
                const statElement = document.createElement('span');
                statElement.className = 'upgrade-stat';
                statElement.textContent = `${stat}: ${value > 0 ? '+' : ''}${value}`;
                stats.appendChild(statElement);
            });
        }
        
        const button = document.createElement('button');
        button.className = 'upgrade-button';
        button.textContent = isPurchased ? 'Purchased' : 'Purchase';
        // Disable if purchased, locked (missing prerequisites), or unaffordable
        button.disabled = isPurchased || !hasPrerequisites || !canAfford;
        
        button.addEventListener('click', () => {
            if (button.disabled) return; // Prevent action if button is disabled

            let success = false;

            // Call the appropriate upgrade method based on category
            switch (category) {
                case 'transmission':
                    success = this.gameLogic.upgradeTransmission(upgrade.id);
                    break;
                case 'effect':
                    success = this.gameLogic.upgradeEffect(upgrade.id);
                    break;
                case 'ability':
                    success = this.gameLogic.upgradeAbility(upgrade.id);
                    break;
            }

            if (success) {
                // 1. Update the clicked element's state immediately
                element.classList.remove('available', 'unaffordable'); // Remove potentially outdated classes
                element.classList.add('purchased');
                button.disabled = true;
                button.textContent = 'Purchased';

                // 2. Re-sort and re-append the list containing this element
                const listContainer = element.parentElement; // Use parentElement instead of closest
                if (listContainer) {
                    const upgradeElements = Array.from(listContainer.querySelectorAll('.upgrade[data-upgrade-id]'));
                    
                    // Sort: Purchased go to the bottom
                    upgradeElements.sort((a, b) => {
                        const aIsPurchased = a.classList.contains('purchased');
                        const bIsPurchased = b.classList.contains('purchased');
                        if (aIsPurchased && !bIsPurchased) return 1; // a goes after b
                        if (!aIsPurchased && bIsPurchased) return -1; // a goes before b
                        return 0; // Keep original order among purchased/non-purchased
                    });
                    
                    // Use requestAnimationFrame for smoother DOM update
                    requestAnimationFrame(() => {
                         // Clear container efficiently
                        while (listContainer.firstChild) {
                            listContainer.removeChild(listContainer.firstChild);
                        }
                        // Append sorted elements using a fragment
                        const fragment = document.createDocumentFragment();
                        upgradeElements.forEach(el => fragment.appendChild(el));
                        listContainer.appendChild(fragment);
                    });
                }
                
                // 3. Update the points display (since points were spent)
                this.updatePointsDisplay();

                // Note: No longer calling this.updateUpgradeUI() here as we manually re-sorted.
            }
        });
        
        element.appendChild(header);
        element.appendChild(description);
        element.appendChild(stats);
        element.appendChild(button);
        
        return element;
    }

    // Notifications and messages
    showNotification(title, text) {
        this.elements.notificationTitle.textContent = title;
        this.elements.notificationText.textContent = text;
        this.elements.notificationContainer.style.display = 'block';
    }

    hideNotification() {
        this.elements.notificationContainer.style.display = 'none';
    }

    showAchievement(achievement) {
        if (!this.elements.achievementToast || !this.elements.achievementTitle || !this.elements.achievementDesc) {
            return;
        }

        this.elements.achievementTitle.textContent = achievement.name;
        this.elements.achievementDesc.textContent = achievement.description;
        this.elements.achievementToast.classList.add('show');
        
        setTimeout(() => {
            this.elements.achievementToast.classList.remove('show');
        }, 3000);
    }

    addMessage(text) {
        // ... existing code ...
    }

    initUI() {
        // Initialize country selection
        this.initCountrySelection();

        // Initialize resources display
        this.updateResources();

        // Initialize action panel and country info
        const actionPanel = document.getElementById('action-panel');
        const countryInfo = document.getElementById('country-info');
        if (actionPanel) {
            actionPanel.style.display = 'block';
        }
        if (countryInfo) {
            countryInfo.style.display = 'block';
        }

        // Initialize upgrades panel
        const upgradesPanel = document.getElementById('upgrades');
        if (upgradesPanel) {
            upgradesPanel.style.display = 'block';
            this.updateUpgradeUI();
        }

        // Initialize other UI elements
        this.updateGameSpeed();
        this.updateTimeDisplay();
        this.updateCountryUI();
    }

    // Update just the status classes for countries without rebuilding the DOM
    updateCountryStatuses() {
        const countriesList = this.elements.countriesList;
        if (!countriesList) return;
        
        // Find all country entries and update their status classes
        const countryEntries = countriesList.querySelectorAll('.country-entry[data-country-code]');
        countryEntries.forEach(entry => {
            const countryCode = entry.dataset.countryCode;
            if (!countryCode) return;

            const gameCountry = this.gameLogic.state.countries[countryCode.toUpperCase()];
            
            // Remove all status classes
            entry.classList.remove('controlled', 'influenced', 'neutral');
            
            // Add the correct status class
            if (gameCountry) {
                if (gameCountry.control >= CONFIG.CONTROL_THRESHOLD) {
                    entry.classList.add('controlled');
                } else if (gameCountry.influence >= CONFIG.INFLUENCE_THRESHOLD) {
                    entry.classList.add('influenced');
                } else {
                    entry.classList.add('neutral');
                }
            } else {
                entry.classList.add('neutral');
            }
        });
    }

    updatePointsDisplay() {
        // Get points from game state
        const points = this.gameLogic.state.points;
        
        // Format points as a whole number
        const formattedPoints = Math.floor(points);
        
        // Update the display
        if (this.elements.pointsDisplay) {
            this.elements.pointsDisplay.textContent = formattedPoints;
        }
    }

    // --- Event Popup Methods ---
    showEventPopup(eventData) {
        console.log('[showEventPopup] Received eventData:', JSON.stringify(eventData, null, 2));
        
        if (!this.elements.eventPopup || !eventData) return;

        this.elements.eventPopupTitle.textContent = eventData.title;
        
        // Append target country name to description if available
        let description = eventData.description;
        if (eventData.targetCountryName) {
            description += ` (Target: ${eventData.targetCountryName})`;
        }
        this.elements.eventPopupDescription.textContent = description;
        
        // Apply class based on event type for styling
        this.elements.eventPopupContent.classList.remove('positive', 'negative');
        if (eventData.type === 'positive') {
            this.elements.eventPopupContent.classList.add('positive');
        } else if (eventData.type === 'negative') {
            this.elements.eventPopupContent.classList.add('negative');
        }

        this.elements.eventPopup.style.display = 'flex'; 
        // Game is already paused by GameLogic when event is triggered
    }

    hideEventPopup(applyEffects = true) {
        if (!this.elements.eventPopup) return;
        this.elements.eventPopup.style.display = 'none';
        
        // Tell GameLogic to apply post-popup effects and unpause
        if (this.gameLogic && this.gameLogic.state.triggeredEvent && applyEffects) {
            // Pass the original triggered event data back
             this.gameLogic.applyEventEffects(this.gameLogic.state.triggeredEvent, true); 
        }
        // Ensure game is unpaused even if applyEffects is false (e.g., fallback hide)
        else if (this.gameLogic && !applyEffects) {
             this.gameLogic.state.isPaused = false;
             this.gameLogic.state.triggeredEvent = null; // Clear the state flag too
        }
        // Potentially force a UI update after closing to reflect changes
        this.updateUI(); 
    }
    
    // --- End Event Popup Methods ---

    // --- News Feed Methods ---
    addNewsItem(message, type = 'info') {
        // Target the inner content div now
        const feedContent = this.elements.newsFeedContent;
        if (!feedContent) return;

        const newsItem = document.createElement('div');
        newsItem.classList.add('news-item');
        
        // Add type-specific class (e.g., 'event-positive', 'milestone')
        if (type) {
            newsItem.classList.add(type);
        }
        
        newsItem.textContent = message; // Use textContent for safety

        // Prepend the new item (since flex-direction is column-reverse)
        feedContent.insertBefore(newsItem, feedContent.firstChild);

        // Optional: Limit the number of news items shown
        const maxNewsItems = 20; // Keep the latest 20 items
        while (feedContent.children.length > maxNewsItems) {
            feedContent.removeChild(feedContent.lastChild); 
        }
    }
    // --- End News Feed Methods ---

    // --- Game Menu Toggle ---
    toggleGameMenu() {
        const gameMenu = this.elements.gameMenu;
        const gameContainer = this.elements.gameContainer;
        if (!gameMenu || !gameContainer) return;
        const isMenuVisible = gameMenu.style.display === 'flex' || gameMenu.style.display === '';
        if (isMenuVisible) {
            // Hide menu, show game
            gameMenu.style.display = 'none';
            gameContainer.style.display = 'block';
            if (this.gameLogic && this.gameLogic.state) {
                this.gameLogic.state.isPaused = false;
            }
        } else {
            // Show menu, hide game
            gameMenu.style.display = 'flex';
            gameContainer.style.display = 'none';
            if (this.gameLogic && this.gameLogic.state) {
                this.gameLogic.state.isPaused = true;
            }
        }
    }
    // --- End Game Menu Toggle ---
}