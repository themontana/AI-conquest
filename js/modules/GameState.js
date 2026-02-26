import { CONFIG } from '../config.js';

export class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.points = CONFIG.INITIAL_POINTS; // Points for upgrades
        this.selectedAIType = null;
        this.day = 0;
        this.isPaused = true;
        this.gameOver = false;
        this.gameSpeed = 1;
        this.gameStarted = false;
        this.selectedCountry = null;
        this.countries = {}; // Use plain object to match GameLogic
        this.purchasedUpgrades = {}; // Add this, seems managed by GameLogic but should be state

        // Initialize multipliers
        this.influenceMultiplier = 1.0;
        this.controlMultiplier = 1.0;
        this.resistanceMultiplier = 1.0;
        this.pointsMultiplier = 1.0; // Multiplier for points earned from milestones

        // Reintroduce resources object
        this.resources = {
            money: CONFIG.INITIAL_POINTS, // Default starting money, can be overridden by AI type
            influence: 0,                 // Global influence tracker?
            research: 0                   // Research points?
        };

        this.events = [];
    }

    setAIType(aiType) {
        this.selectedAIType = aiType;
        if (aiType && CONFIG.AI_TYPES[aiType]) {
            const aiData = CONFIG.AI_TYPES[aiType];
            const bonuses = aiData.bonuses || {};

            // Set individual multipliers (for tick calculations in GameLogic)
            this.influenceMultiplier = bonuses.influence || 1.0;
            this.controlMultiplier = bonuses.control || 1.0;
            this.resistanceMultiplier = bonuses.resistance || 1.0;
            this.pointsMultiplier = bonuses.points || 1.0; // Affects points earned from milestones

            // Reset points to base (AI starting bonus for points might be applied elsewhere or added here if needed)
            this.points = CONFIG.INITIAL_POINTS;
            // Reset resources to default before applying AI starting bonus (handled in main.js applyAIBonuses)
            this.resources = {
                 money: CONFIG.INITIAL_POINTS, 
                 influence: 0,
                 research: 0
             };
             // Note: Starting resource modifications (money, influence, research) seem to be handled 
             // explicitly in main.js's applyAIBonuses function via updateResources.
             // setAIType primarily focuses on setting the *multipliers* for GameLogic.

        } else {
            // console.error(`[GameState] Invalid AI Type passed to setAIType: ${aiType}`);
            // Reset multipliers to defaults
            this.influenceMultiplier = 1.0;
            this.controlMultiplier = 1.0;
            this.resistanceMultiplier = 1.0;
            this.pointsMultiplier = 1.0;
            // Reset resources to defaults
            this.resources = { money: CONFIG.INITIAL_POINTS, influence: 0, research: 0 };
        }
    }

    // Modified initializeCountries to match GameLogic's structure
    initializeCountries() {
        this.countries = {}; // Reset countries object
        Object.entries(CONFIG.COUNTRIES).forEach(([code, country]) => {
            this.countries[code] = {
                ...country,
                code, // Add the country code
                influence: 0,
                control: 0,
                // Starting resistance is handled by config per country or default
                resistance: country.startingResistance || CONFIG.INITIAL_RESISTANCE_DEFAULT,
                status: 'neutral',
                lastInfluenceThreshold: 0 // Track last threshold crossed for signal effects
            };
        });
    }


    // updateCountry no longer needs AI bonus logic here
    updateCountry(code, updates) {
        const country = this.countries[code];
        if (country) {
            Object.assign(country, updates);

            // Ensure values are within bounds
            country.influence = Math.max(0, Math.min(CONFIG.MAX_INFLUENCE, country.influence));
            country.control = Math.max(0, Math.min(CONFIG.MAX_CONTROL, country.control));
            country.resistance = Math.max(0, Math.min(CONFIG.MAX_RESISTANCE, country.resistance));

            return true;
        }
        return false;
    }

    // Check for influence threshold crossings and return events
    checkInfluenceThresholds() {
        const thresholdEvents = [];
        const thresholds = [25, 50, 75, 100];

        Object.entries(this.countries).forEach(([code, country]) => {
            const currentThreshold = Math.floor(country.influence / 25) * 25;
            const lastThreshold = country.lastInfluenceThreshold;

            if (currentThreshold > lastThreshold && currentThreshold > 0) {
                // Country crossed a new threshold
                country.lastInfluenceThreshold = currentThreshold;
                
                console.log(`[GameState] Threshold crossed: ${code} reached ${currentThreshold}% influence (was ${lastThreshold}%)`);
                
                thresholdEvents.push({
                    type: 'influence_threshold',
                    countryCode: code,
                    threshold: currentThreshold,
                    influence: country.influence
                });
            }
        });

        return thresholdEvents;
    }

    // Bring back updateResources
    updateResources(updates) {
        // Be careful merging - ensure only valid resource keys are updated
        for (const key in updates) {
            if (this.resources.hasOwnProperty(key)) {
                this.resources[key] = updates[key];
            }
        }
        // console.log('[GameState] Resources updated:', this.resources); // Optional log
    }

    addEvent(event) {
        this.events.push({
            ...event,
            timestamp: Date.now()
        });
    }

    getCountryStats(code) {
        return this.countries[code];
    }

    // Bring back getResourceStats
    getResourceStats() {
        return { ...this.resources }; // Return a copy
    }

    getRecentEvents(limit = 5) {
        return this.events.slice(-limit);
    }

    // Update save/load to include resources
    getSaveData() {
        const serializableUpgrades = {};
         for (const countryCode in this.purchasedUpgrades) {
            serializableUpgrades[countryCode] = Array.from(this.purchasedUpgrades[countryCode]);
         }

        return {
            points: this.points,
            selectedAIType: this.selectedAIType,
            day: this.day,
            isPaused: this.isPaused,
            gameOver: this.gameOver,
            gameSpeed: this.gameSpeed,
            gameStarted: this.gameStarted,
            selectedCountry: this.selectedCountry,
            countries: this.countries,
            purchasedUpgrades: serializableUpgrades,
            // Save multipliers
            influenceMultiplier: this.influenceMultiplier,
            controlMultiplier: this.controlMultiplier,
            resistanceMultiplier: this.resistanceMultiplier,
            pointsMultiplier: this.pointsMultiplier,
            resources: this.resources, // Save resources object
            events: this.events 
        };
    }

    loadSaveData(data) {
        try {
            this.points = data.points !== undefined ? data.points : CONFIG.INITIAL_POINTS;
            this.selectedAIType = data.selectedAIType || null;
            this.day = data.day || 0;
            this.isPaused = data.isPaused !== undefined ? data.isPaused : true;
            this.gameOver = data.gameOver || false;
            this.gameSpeed = data.gameSpeed || 1;
            this.gameStarted = data.gameStarted || false;
            this.selectedCountry = data.selectedCountry || null;
            this.countries = data.countries || {};
            
            // Load multipliers with defaults
            this.influenceMultiplier = data.influenceMultiplier !== undefined ? data.influenceMultiplier : 1.0;
            this.controlMultiplier = data.controlMultiplier !== undefined ? data.controlMultiplier : 1.0;
            this.resistanceMultiplier = data.resistanceMultiplier !== undefined ? data.resistanceMultiplier : 1.0;
            this.pointsMultiplier = data.pointsMultiplier !== undefined ? data.pointsMultiplier : 1.0;

            // Load resources with defaults
            this.resources = data.resources || { money: CONFIG.INITIAL_POINTS, influence: 0, research: 0 };
            // Ensure all default resource keys exist if loading partial data
            this.resources.money = this.resources.money !== undefined ? this.resources.money : CONFIG.INITIAL_POINTS;
            this.resources.influence = this.resources.influence !== undefined ? this.resources.influence : 0;
            this.resources.research = this.resources.research !== undefined ? this.resources.research : 0;

            // Load purchased upgrades
            this.purchasedUpgrades = {};
             if (data.purchasedUpgrades) {
                for (const countryCode in data.purchasedUpgrades) {
                    this.purchasedUpgrades[countryCode] = new Set(data.purchasedUpgrades[countryCode]);
                }
             }

            this.events = data.events || [];

            return true;
        } catch (error) {
            console.error('[GameState] Error loading save data:', error);
            this.reset(); // Reset to default state on error
            return false;
        }
    }
} 