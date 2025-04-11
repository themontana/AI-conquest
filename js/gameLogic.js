import { CONFIG } from './config.js';
import { GameState } from './state.js';
import { UI } from './ui.js';

export class GameLogic {
    constructor() {
        this.state = new GameState();
        this.ui = null;
        this.gameLoop = null;
        this.countries = {};
        this.sounds = {};
        this.soundEnabled = true;
    }

    setUI(ui) {
        this.ui = ui;
    }

    async initializeGame() {
        try {
            // Initialize game state
            this.state = new GameState(); // Reset state completely
            this.state.points = CONFIG.INITIAL_POINTS;
            this.state.days = 0;
            this.state.regions = {};
            this.state.purchasedUpgrades = new Set();
            this.state.isPaused = true;
            this.state.gameOver = false; // Explicitly set gameOver to false
            
            // Load sounds
            await this.loadSounds();
            
            if (this.ui) {
                this.ui.updateLoadingProgress(20, 'Loading game state...');
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Initialize regions
            CONFIG.REGION_NAMES.forEach(region => {
                this.state.regions[region] = {
                    influence: 0,
                    control: 0,
                    resistance: CONFIG.INITIAL_RESISTANCE,
                    lastUpdate: Date.now()
                };
            });
            
            if (this.ui) {
                this.ui.updateLoadingProgress(40, 'Setting up regions...');
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Initialize countries
            this.initializeCountries();
            
            if (this.ui) {
                this.ui.updateLoadingProgress(60, 'Setting up interface...');
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            if (this.ui) {
                this.ui.updateLoadingProgress(80, 'Starting game...');
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Start game loop but keep it paused
            this.startGameLoop();
            
            if (this.ui) {
                this.ui.updateLoadingProgress(100, 'Game ready!');
                setTimeout(() => {
                    this.ui.hideLoadingScreen();
                    this.ui.showAISelectionScreen();
                }, 1000);
            }
            
            console.log('Game initialization complete');
        } catch (error) {
            console.error('Error during game initialization:', error);
            if (this.ui) {
                this.ui.updateLoadingProgress(0, 'Error initializing game. Please refresh.');
            }
            throw error;
        }
    }

    async loadSounds() {
        try {
            for (const [key, path] of Object.entries(CONFIG.SOUNDS)) {
                const audio = new Audio(path);
                audio.preload = 'auto';
                this.sounds[key] = audio;
            }
        } catch (error) {
            console.error('Error loading sounds:', error);
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }

    playSound(soundKey) {
        if (this.soundEnabled && this.sounds[soundKey]) {
            this.sounds[soundKey].currentTime = 0;
            this.sounds[soundKey].play().catch(error => {
                console.error('Error playing sound:', error);
            });
        }
    }

    initializeCountries() {
        this.countries = {}; // Reset countries object
        for (const [continent, countries] of Object.entries(CONFIG.COUNTRIES)) {
            countries.forEach(country => {
                this.countries[country.code] = {
                    ...country,
                    influence: 0,
                    control: 0,
                    resistance: CONFIG.INITIAL_RESISTANCE,
                    status: 'neutral',
                    continent: continent
                };
            });
        }
    }

    getCountryStats(countryCode) {
        return this.state.countries[countryCode] || null;
    }

    updateCountryStats(countryCode, stats) {
        if (this.state.countries[countryCode]) {
            Object.assign(this.state.countries[countryCode], stats);
            
            // Update country status based on stats
            const country = this.state.countries[countryCode];
            if (country.control >= CONFIG.CONTROL_THRESHOLD) {
                country.status = 'controlled';
            } else if (country.influence >= CONFIG.INFLUENCE_THRESHOLD) {
                country.status = 'influenced';
            } else {
                country.status = 'neutral';
            }
        }
    }

    calculateContinentStats(continent) {
        const countries = Object.values(this.state.countries)
            .filter(country => country.continent === continent);
        
        return {
            influence: countries.reduce((sum, c) => sum + c.influence, 0) / countries.length,
            control: countries.reduce((sum, c) => sum + c.control, 0) / countries.length,
            resistance: countries.reduce((sum, c) => sum + c.resistance, 0) / countries.length
        };
    }

    tick() {
        if (this.state.isPaused) return;

        // Update points
        this.state.points += CONFIG.POINTS_PER_TICK * this.state.gameSpeed;

        // Update each country
        Object.values(this.state.countries).forEach(country => {
            // Increase influence based on global influence
            country.influence = Math.min(
                CONFIG.MAX_INFLUENCE,
                country.influence + (CONFIG.INFLUENCE_PER_TICK * this.state.influence)
            );

            // Increase control if influenced
            if (country.influence >= CONFIG.INFLUENCE_THRESHOLD) {
                country.control = Math.min(
                    CONFIG.MAX_CONTROL,
                    country.control + (CONFIG.CONTROL_PER_TICK * this.state.control)
                );
            }

            // Increase resistance
            country.resistance = Math.min(
                CONFIG.MAX_RESISTANCE,
                country.resistance + (CONFIG.RESISTANCE_PER_TICK * (1 + CONFIG.RESISTANCE_GROWTH_RATE * this.state.day))
            );
        });

        // Increment day
        this.state.day++;
    }

    selectAIType(type) {
        if (!CONFIG.AI_TYPES[type]) return false;
        this.state.selectedAIType = type;
        return true;
    }

    startGame() {
        if (!this.state.selectedAIType) return false;
        
        // Reset game state
        this.state.reset();
        this.state.isPaused = false;
        
        // Play start sound
        this.playSound('start');
        
        // Show initial message
        this.showMessage('Game started! Select a region to begin your conquest.');
        
        return true;
    }

    startGameLoop() {
        if (this.gameLoop) return;
        
        this.gameLoop = setInterval(() => {
            if (!this.state.isPaused) {
                this.state.update();
                
                // Check for new achievements
                const newAchievements = this.state.checkAchievements();
                if (newAchievements && newAchievements.length > 0) {
                    newAchievements.forEach(achievement => {
                        if (this.ui) {
                            this.ui.showAchievement(achievement);
                        }
                    });
                }

                // Check for game over
                if (this.state.gameOver) {
                    this.stopGameLoop();
                    if (this.ui) {
                        this.ui.showGameOver();
                    }
                }

                // Update UI
                if (this.ui) {
                    this.ui.updateUI();
                }
            }
        }, CONFIG.TICK_INTERVAL);
    }

    stopGameLoop() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }

    upgrade(stat) {
        if (this.state.upgrade(stat)) {
            // Stub out sound method
            return true;
        }
        return false;
    }

    showMessage(message) {
        if (this.ui && this.ui.elements.messageLog) {
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            messageElement.textContent = message;
            this.ui.elements.messageLog.appendChild(messageElement);
            
            // Scroll to bottom
            this.ui.elements.messageLog.scrollTop = this.ui.elements.messageLog.scrollHeight;
            
            // Remove message after 3 seconds
            setTimeout(() => {
                messageElement.remove();
            }, 3000);
        } else {
            console.log('Message:', message);
        }
    }

    upgradeTransmission(upgrade) {
        if (this.state.points < upgrade.cost) {
            return { success: false, message: 'Not enough points' };
        }
        
        if (this.state.purchasedUpgrades.has(upgrade.id)) {
            return { success: false, message: 'Upgrade already purchased' };
        }
        
        this.state.points -= upgrade.cost;
        this.state.purchasedUpgrades.add(upgrade.id);
        this.state.transmissionMultiplier += upgrade.multiplier;
        
        this.playSound('upgrade');
        this.showMessage(`Upgraded ${upgrade.name}: ${upgrade.effect}`);
        
        return { success: true, message: `Upgraded ${upgrade.name}` };
    }

    upgradeEffect(upgrade) {
        if (this.state.points < upgrade.cost) {
            return { success: false, message: 'Not enough points' };
        }
        
        if (this.state.purchasedUpgrades.has(upgrade.id)) {
            return { success: false, message: 'Upgrade already purchased' };
        }
        
        this.state.points -= upgrade.cost;
        this.state.purchasedUpgrades.add(upgrade.id);
        this.state.effectMultiplier += upgrade.multiplier;
        
        this.playSound('upgrade');
        this.showMessage(`Upgraded ${upgrade.name}: ${upgrade.effect}`);
        
        return { success: true, message: `Upgraded ${upgrade.name}` };
    }

    upgradeAbility(upgrade) {
        if (this.state.points < upgrade.cost) {
            return { success: false, message: 'Not enough points' };
        }
        
        if (this.state.purchasedUpgrades.has(upgrade.id)) {
            return { success: false, message: 'Upgrade already purchased' };
        }
        
        this.state.points -= upgrade.cost;
        this.state.purchasedUpgrades.add(upgrade.id);
        this.state.abilityMultiplier += upgrade.multiplier;
        
        this.playSound('upgrade');
        this.showMessage(`Upgraded ${upgrade.name}: ${upgrade.effect}`);
        
        return { success: true, message: `Upgraded ${upgrade.name}` };
    }

    getRegionStatus(regionId) {
        const region = this.state.regions[regionId];
        if (!region) return null;

        return {
            ...region,
            isInfluenced: region.influence >= CONFIG.INFLUENCE_THRESHOLD,
            isControlled: region.control >= CONFIG.CONTROL_THRESHOLD,
            influencePercent: (region.influence / CONFIG.CONTROL_THRESHOLD) * 100,
            controlPercent: (region.control / CONFIG.CONTROL_THRESHOLD) * 100
        };
    }

    getGameStatus() {
        return {
            points: this.state.points,
            days: this.state.days,
            influence: this.state.influence,
            control: this.state.control,
            resistance: this.state.resistance,
            regions: this.state.regions,
            purchasedUpgrades: Array.from(this.state.purchasedUpgrades),
            gameOver: this.state.gameOver
        };
    }

    saveGame(slot) {
        try {
            this.state.save(slot);
            this.showMessage(`Game saved to slot ${slot}`);
            return true;
        } catch (error) {
            console.error('Error saving game:', error);
            this.showMessage('Error saving game');
            return false;
        }
    }

    loadGame(slot) {
        try {
            if (this.state.load(slot)) {
                this.showMessage(`Game loaded from slot ${slot}`);
                return true;
            }
            this.showMessage('No save game found');
            return false;
        } catch (error) {
            console.error('Error loading game:', error);
            this.showMessage('Error loading game');
            return false;
        }
    }

    deleteSave(slot) {
        try {
            this.state.deleteSave(slot);
            this.showMessage(`Save game ${slot} deleted`);
            return true;
        } catch (error) {
            console.error('Error deleting save:', error);
            this.showMessage('Error deleting save');
            return false;
        }
    }

    getSaveInfo(slot) {
        return this.state.getSaveInfo(slot);
    }

    getTutorialStep(step) {
        return CONFIG.TUTORIAL_STEPS[step];
    }

    getTutorialStepCount() {
        return Object.keys(CONFIG.TUTORIAL_STEPS).length;
    }

    influenceRegion(regionId) {
        const region = this.state.regions[regionId];
        if (!region) return false;

        // Calculate influence gain based on current influence and AI type
        const baseGain = this.state.influence;
        const resistanceFactor = 1 - (region.resistance / 100);
        const aiMultiplier = this.state.selectedAIType ? CONFIG.AI_TYPES[this.state.selectedAIType].influenceMultiplier : 1;
        const influenceGain = baseGain * resistanceFactor * aiMultiplier;

        // Apply influence gain
        region.influence = Math.min(region.influence + influenceGain, CONFIG.CONTROL_THRESHOLD);

        // If influence is high enough, start gaining control
        if (region.influence >= CONFIG.INFLUENCE_THRESHOLD) {
            const controlGain = this.state.control * resistanceFactor * aiMultiplier;
            region.control = Math.min(region.control + controlGain, CONFIG.CONTROL_THRESHOLD);
        }

        return true;
    }

    update() {
        // Update game state
        this.state.update();
        
        // Check for new achievements
        const newAchievements = this.state.checkAchievements();
        if (newAchievements && newAchievements.length > 0) {
            newAchievements.forEach(achievement => {
                // Stub out sound method
                console.log(`Achievement unlocked: ${achievement.name}`);
            });
        }

        // Check for game over
        if (this.state.gameOver) {
            this.stopGameLoop();
            // Stub out sound method
        }
    }

    selectRegion(regionId) {
        const region = this.state.regions[regionId];
        if (!region) return false;

        // Deselect all other regions
        this.state.regions.forEach(r => r.selected = false);
        
        // Select the clicked region
        region.selected = true;
        return true;
    }

    updateWorld() {
        this.state.days++;
        
        // Update each region
        Object.entries(this.state.regions).forEach(([region, stats]) => {
            // Apply resistance growth
            stats.resistance = Math.min(
                CONFIG.MAX_RESISTANCE,
                stats.resistance + CONFIG.RESISTANCE_GROWTH
            );
            
            // Apply influence decay
            stats.influence = Math.max(
                0,
                stats.influence - CONFIG.INFLUENCE_DECAY
            );
            
            // Apply control decay
            stats.control = Math.max(
                0,
                stats.control - CONFIG.CONTROL_DECAY
            );
        });
    }

    getState() {
        return this.state;
    }
}

export default GameLogic; 