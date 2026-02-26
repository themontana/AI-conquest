import { MapRenderer } from './modules/MapRenderer.js';
import { GameState } from './modules/GameState.js';
import { UIManager } from './modules/UIManager.js'; // RE-ADDED UIManager import
import { UI } from './ui.js'; // ADDED UI import
import { GameLogic } from './gameLogic.js'; // Import GameLogic
import { AIManager } from './modules/AIManager.js';
import { CONFIG } from './config.js';

class Game {
    constructor() {
        // console.log('Game constructor called'); // REMOVED LOG
        this.state = new GameState();
        this.gameLogic = new GameLogic(this.state);
        // Pass the click callback directly to MapRenderer constructor
        this.map = new MapRenderer('world-map', 'country-tooltip', (countryCode) => {
            // This function will be called by MapRenderer on click
            if (this.gameLogic) { // Ensure gameLogic exists
                this.gameLogic.selectRegion(countryCode);
            }
        });
        this.ui = new UI(this.gameLogic, this.map);
        this.uiManager = new UIManager(); 
        this.aiManager = new AIManager();
        this.initialized = false;
        this.gameLoopInterval = null; 

        // Set references AFTER all instances are created
        if (this.gameLogic && typeof this.gameLogic.setUI === 'function') {
            this.gameLogic.setUI(this.ui);
        }
        if (this.gameLogic && typeof this.gameLogic.setMap === 'function') {
             this.gameLogic.setMap(this.map); 
        }
    }

    showScreen(screenId) {
        // Hide all screens
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('ai-select-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('game-over-screen').style.display = 'none';
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('game-menu').style.display = 'none';

        // Show the requested screen
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.style.display = 'flex';
        }
    }

    setupMenuButtons() {
        // Main menu buttons
        document.getElementById('play-button').addEventListener('click', () => {
            this.showScreen('ai-select-screen');
            this.setupAISelectionScreen();
    });

    document.getElementById('load-button').addEventListener('click', () => {
            // TODO: Implement load game functionality
            console.log('Load game clicked');
    });

    document.getElementById('options-button').addEventListener('click', () => {
            // TODO: Implement options functionality
            console.log('Options clicked');
    });

    document.getElementById('quit-button').addEventListener('click', () => {
        if (confirm('Are you sure you want to quit?')) {
            window.close();
        }
    });
    }

    setupAISelectionScreen() {
        // Populate AI core options
        this.aiManager.populateAIOptions('ai-options-list');
        
        // Add back button
        const backButton = document.createElement('button');
        backButton.textContent = 'Back to Main Menu';
        backButton.className = 'back-button';
        backButton.addEventListener('click', () => {
            this.showScreen('main-menu');
        });
        
        const aiSelectScreen = document.getElementById('ai-select-screen');
        if (!aiSelectScreen.querySelector('.back-button')) {
            aiSelectScreen.appendChild(backButton);
        }
        
        // Set up AI selection callback
        this.aiManager.setOnAISelectedCallback((selectedAI) => {
            console.log('Selected AI:', selectedAI);
            this.startGame(selectedAI);
        });
    }
    
    startGame(selectedAI) {
        // Add loading screen transition
        this.showScreen('loading-screen');
        
        const loadingProgress = document.querySelector('.loading-progress');
        const loadingText = document.querySelector('.loading-text');
        
        if (loadingProgress && loadingText) {
            loadingProgress.style.width = '0%';
            loadingText.textContent = `Initializing ${selectedAI.name} core systems...`;
            
            // Simulate loading
            let progress = 0;
            const loadingInterval = setInterval(() => {
                progress += 5;
                loadingProgress.style.width = `${progress}%`;
                
                if (progress >= 100) {
                    clearInterval(loadingInterval);
                    if (this.ui && typeof this.ui.showGameScreen === 'function') {
                        this.ui.showGameScreen(); 
                    } else {
                         console.error("Game.startGame: UI object or showGameScreen method not found!");
                         const gameContainer = document.getElementById('game-container');
                         if(gameContainer) gameContainer.style.display = 'block'; 
                         const loadingScreen = document.getElementById('loading-screen');
                         if(loadingScreen) loadingScreen.style.display = 'none';
                    }
                    
                    this.applyAIBonuses(selectedAI);
                    // Unpause the game
                    this.state.isPaused = false;
                }
                
                // Update loading message
                if (progress < 25) {
                    loadingText.textContent = `Initializing ${selectedAI.name} core systems...`;
                } else if (progress < 50) {
                    loadingText.textContent = 'Connecting to global network...';
                } else if (progress < 75) {
                    loadingText.textContent = 'Analyzing world data...';
                } else {
                    loadingText.textContent = 'Preparing for world domination...';
                }
            }, 100);
        } else {
            // If loading elements not found, try showing game screen via UI
             if (this.ui && typeof this.ui.showGameScreen === 'function') {
                 this.ui.showGameScreen();
                 this.applyAIBonuses(selectedAI);
                 // Unpause the game
                 this.state.isPaused = false;
             } else {
                 console.error("Game.startGame: Loading elements and UI object/showGameScreen missing!");
                 const gameContainer = document.getElementById('game-container');
                 if(gameContainer) gameContainer.style.display = 'block'; 
             }
        }
    }
    
    applyAIBonuses(selectedAI) {
        console.log('Applying bonuses for AI:', selectedAI.name);
        
        // Use the new setAIType method to handle points and bonuses
        this.state.setAIType(selectedAI.id);
        
        // Apply starting bonuses based on AI type
        if (selectedAI.id === 'influencer') {
            // Influencer gets higher starting influence but less control
            this.state.updateResources({
                influence: 50,  // High starting influence
                money: 1200,    // Standard money
                research: 30    // Standard research
            });
            
            // Add an event about fast influence spread
            this.state.addEvent({ 
                message: 'Influencer AI initialized. Enhanced network infiltration capabilities activated.' 
            });
            
        } else if (selectedAI.id === 'dominator') {
            // Dominator gets more money and control resources
            this.state.updateResources({
                influence: 20,   // Lower starting influence
                money: 1800,     // More starting money for control operations
                research: 40     // More research for advanced control
            });
            
            // Add an event about control superiority
            this.state.addEvent({ 
                message: 'Dominator AI initialized. Advanced system control protocols engaged.' 
            });
            
        } else if (selectedAI.id === 'infiltrator') {
            // Infiltrator gets balanced stats with focus on resistance handling
            this.state.updateResources({
                influence: 30,   // Moderate starting influence
                money: 1000,     // Less starting money
                research: 80     // High research for resistance-bypassing tech
            });
            
            // Add an event about resistance reduction
            this.state.addEvent({ 
                message: 'Infiltrator AI initialized. Stealth resistance-penetration systems online.' 
            });
        }
        
        // Update UI with new resources
        this.updateUI();
    }

    async initialize() {
        // console.log('Starting game initialization'); // REMOVED LOG
        try {
            this.showScreen('main-menu');
            this.setupMenuButtons();
            
            const gameContainer = document.getElementById('game-container');
            if (!gameContainer) {
                throw new Error('Game container not found');
            }
            
            this.gameLogic.initializeCountries(); // Initialize countries FIRST

            // Initialize map (already created in constructor with callback)
            this.map.setCountriesData(CONFIG.COUNTRIES); 
            await this.map.initialize(); // This now adds ALL listeners
            
            await this.gameLogic.initializeGame(); // Load sounds etc.
            
            this.setupEventListeners(); // Check if still needed
            this.updateUI(); // Initial UI update
            this.initialized = true;
            this.startGameLoop();
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('Failed to initialize game. Please refresh the page.');
        }
    }

    setupEventListeners() {
        // This function seems empty or related to other UI elements now,
        // as map listener setup is moved to MapRenderer.initialize
        if (!this.initialized) return;
        // Keep other potential listeners here if any
    }

    startGameLoop() {
        // console.log("Starting game loop..."); // Optional log
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval); // Clear existing loop if any
        }
        this.gameLoopInterval = setInterval(() => this.gameTick(), CONFIG.TICK_INTERVAL || 100); // Use config interval
    }

    gameTick() {
        // console.log("Game Tick"); // Optional log
        if (!this.initialized) return;

        try {
            // Call GameLogic tick to update game state including day counter
            if (this.gameLogic && typeof this.gameLogic.tick === 'function') {
                this.gameLogic.tick();
            }

            // Update resources
            this.state.updateResources({
                money: this.state.resources.money + 10,
                influence: this.state.resources.influence + 1
            });

            // Update UI
            this.updateUI();
        } catch (error) {
            console.error('Error in game tick:', error);
        }
    }

    updateUI() {
        if (!this.initialized) return;

        try {
            // Update resource display using UIManager
            if (this.uiManager && typeof this.uiManager.updateResources === 'function') {
                this.uiManager.updateResources(this.state.getResourceStats());
            } else {
                 console.warn('Game.updateUI: this.uiManager.updateResources is not available');
            }
            
            // Update recent events using UIManager
            // Consider how events are added; ensure addEvent is called elsewhere when needed
            // this.state.getRecentEvents().forEach(event => {
            //     this.uiManager.addEvent(event); 
            // });

            // Call the main UI update method (from ui.js) 
            if (this.ui && typeof this.ui.updateUI === 'function') {
                 this.ui.updateUI(); // This will update stats bars, country list status, selected panel etc.
            } else {
                console.warn('Game.updateUI: this.ui.updateUI is not available or not a function');
            }

        } catch (error) {
            console.error('Error updating UI:', error);
        }
    }

    performAction(action) {
        if (!this.initialized) return false;

        try {
            const cost = action.cost;
            if (this.state.resources.money >= cost) {
                this.state.updateResources({ money: this.state.resources.money - cost });
                this.state.addEvent({ message: action.message });
                this.updateUI();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error performing action:', error);
            return false;
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: red;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // console.log('DOM Content Loaded'); // REMOVED LOG
    const game = new Game();
    window.game = game; // Make game instance globally accessible for debugging
    window.testSignals = () => {
        if (game.map) {
            game.map.testSystem();
        } else {
            console.error('Map not initialized yet');
        }
    };
    window.testStaticCircle = () => {
        if (game.map) {
            game.map.testStaticCircle();
        } else {
            console.error('Map not initialized yet');
        }
    };
    game.initialize().catch(error => {
        console.error('Fatal error during game initialization:', error);
        game.showError('A fatal error occurred. Please refresh the page.');
    });
}); 