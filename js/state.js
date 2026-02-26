import { CONFIG } from './config.js';

// Game State Management
export class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        // Core game state
        this.selectedAIType = null;
        this.points = CONFIG.INITIAL_POINTS;
        console.log('[GameState] Initializing points:', this.points);
        this.day = 0;
        this.isPaused = true;
        this.gameOver = false;
        this.gameSpeed = 1;
        this.gameStarted = false;
        this.selectedCountry = null;

        // AI type multipliers
        this.influenceMultiplier = 1;
        this.controlMultiplier = 1;
        this.resistanceMultiplier = 1;
        this.pointsMultiplier = 1;

        // Game progress
        this.purchasedUpgrades = {};
        this.countries = {};
        this.achievements = new Set();
        this.messages = [];

        // Global stats
        this.influence = 0;
        this.control = 0;
        this.resistance = CONFIG.INITIAL_RESISTANCE;

        // Save data
        this.lastSaveTime = null;
        this.autoSaveEnabled = true;

        // Initialize countries and their upgrades
        this.initializeCountries();
    }

    initializeCountries() {
        Object.entries(CONFIG.COUNTRIES).forEach(([code, data]) => {
            this.countries[code] = {
                influence: 0,
                control: 0,
                resistance: data.startingResistance || CONFIG.INITIAL_RESISTANCE,
                lastUpdate: Date.now()
            };
            // Initialize purchasedUpgrades as a Set for each country
            if (!this.purchasedUpgrades[code]) {
                this.purchasedUpgrades[code] = new Set();
            }
        });
    }

    update() {
        if (this.isPaused) return;

        // Update each country's resistance
        Object.entries(this.countries).forEach(([code, country]) => {
            this.updateCountry(code, country);
        });

        // Update global stats
        this.updateGlobalStats();
        
        // Check win/lose conditions
        this.checkGameOver();
        
        this.day++;
    }

    updateGlobalStats() {
        const countries = Object.values(this.countries);
        this.influence = countries.reduce((sum, c) => sum + c.influence, 0) / countries.length;
        this.control = countries.reduce((sum, c) => sum + c.control, 0) / countries.length;
        this.resistance = countries.reduce((sum, c) => sum + c.resistance, 0) / countries.length;
    }

    updateCountry(code, country) {
        const countryData = CONFIG.COUNTRIES[code];
        if (!countryData) return;

        // Calculate modifiers based on country properties
        const techModifier = countryData.techLevel / 100;
        const populationModifier = Math.log10(countryData.population) / 10;
        const gdpModifier = Math.log10(countryData.gdp) / 14;

        // Update resistance
        const resistanceGain = CONFIG.RESISTANCE_PER_TICK * 
            (1 + CONFIG.RESISTANCE_GROWTH_RATE * this.day) *
            this.resistanceMultiplier *
            populationModifier *
            gdpModifier;
        
        country.resistance = Math.min(
            CONFIG.MAX_RESISTANCE,
            country.resistance + resistanceGain
        );

        country.lastUpdate = Date.now();
    }

    checkGameOver() {
        const countries = Object.values(this.countries);
        
        // Win condition: all countries controlled
        const allControlled = countries.every(c => c.control >= CONFIG.CONTROL_THRESHOLD);
        
        // Lose condition: all countries max resistance
        const allResistance = countries.every(c => c.resistance >= CONFIG.MAX_RESISTANCE);
        
        if (allControlled) {
            this.gameOver = true;
            this.isPaused = true;
            this.addMessage('Victory! You have achieved global dominance!');
        } else if (allResistance) {
            this.gameOver = true;
            this.isPaused = true;
            this.addMessage('Game Over! Global resistance has become too strong!');
        }
    }

    checkAchievements() {
        const newAchievements = [];
        
        Object.entries(CONFIG.ACHIEVEMENTS).forEach(([id, achievement]) => {
            if (!this.achievements.has(id) && achievement.condition(this)) {
                this.achievements.add(id);
                newAchievements.push(achievement);
            }
        });
        
        return newAchievements;
    }

    addMessage(text) {
        this.messages.unshift({
            text,
            timestamp: Date.now()
        });
        
        // Keep only last 50 messages
        if (this.messages.length > 50) {
            this.messages.pop();
        }
    }

    // Save/Load functionality
    save(slot) {
        const saveData = {
            points: this.points,
            influence: this.influence,
            control: this.control,
            resistance: this.resistance,
            selectedAIType: this.selectedAIType,
            countries: this.countries,
            achievements: Array.from(this.achievements),
            purchasedUpgrades: this.purchasedUpgrades,
            messages: this.messages,
            day: this.day,
            gameSpeed: this.gameSpeed,
            timestamp: Date.now()
        };
        localStorage.setItem(`${CONFIG.SAVE_KEY_PREFIX}${slot}`, JSON.stringify(saveData));
    }

    load(slot) {
        const saveData = localStorage.getItem(`${CONFIG.SAVE_KEY_PREFIX}${slot}`);
        if (!saveData) return false;

        try {
            const data = JSON.parse(saveData);
            this.points = data.points;
            this.influence = data.influence;
            this.control = data.control;
            this.resistance = data.resistance;
            this.selectedAIType = data.selectedAIType;
            this.countries = data.countries;
            this.achievements = new Set(data.achievements || []);
            this.purchasedUpgrades = data.purchasedUpgrades || {};
            this.messages = data.messages || [];
            this.day = data.day || 0;
            this.gameSpeed = data.gameSpeed || 1;

            this.gameOver = this.checkGameOver();
            return true;
        } catch (error) {
            console.error('Error loading save:', error);
            this.reset();
            return false;
        }
    }

    deleteSave(slot) {
        localStorage.removeItem(`${CONFIG.SAVE_KEY_PREFIX}${slot}`);
    }

    getSaveInfo(slot) {
        const saveData = localStorage.getItem(`${CONFIG.SAVE_KEY_PREFIX}${slot}`);
        if (!saveData) return null;

        try {
            const data = JSON.parse(saveData);
            return {
                points: data.points,
                timestamp: data.timestamp,
                countriesControlled: Object.values(data.countries).filter(c => c.control >= CONFIG.CONTROL_THRESHOLD).length
            };
        } catch (error) {
            return null;
        }
    }
}