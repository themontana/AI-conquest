import { CONFIG } from './config.js';
// import { GameState } from './state.js'; // GameState instance will be passed in
// import { UI } from './ui.js'; // UI instance will be passed in/set later
import soundManager from './soundManager.js';

export class GameLogic {
    constructor(gameState) { // Accept gameState in constructor
        this.state = gameState; // Store gameState instance
        this.ui = null; // UI will be set via setUI
        this.gameLoop = null;
        // this.countries = {}; // State holds countries
        // this.sounds = {}; // soundManager handles sounds
        this.soundEnabled = true;
        // this.influenceProgress = {}; // Should be part of country state or calculated
        // this.controlProgress = {}; // Should be part of country state or calculated
        this.map = null; // Map reference might be needed, can be set via setMap
        
        // Initialize purchasedUpgrades if it doesn't exist
        if (!this.state.purchasedUpgrades) {
            this.state.purchasedUpgrades = {};
        }
        // Initialize active events
        this.state.activeEvents = {}; // Stores active events and their remaining duration
        this.state.triggeredEvent = null; // Holds the event data to be shown by UI
        // this.init(); // Initialization might depend on UI/Map being set
    }

    // init() { ... } // Keep or move logic elsewhere if needed

    setUI(ui) {
        this.ui = ui;
    }

    setMap(map) { // Add setMap if GameLogic needs direct map access
        this.map = map;
    }

    async initializeGame() {
        try {
            // Initialize countries
            this.initializeCountries();
            
            // Load sounds
            await this.loadSounds();
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    async loadSounds() {
        try {
            // Using soundManager for sound handling
            soundManager.setVolume(0.5);
        } catch (error) {
            // Error loading sounds
        }
    }

    toggleSound() {
        return soundManager.toggleSound();
    }

    playSound(soundKey) {
        if (this.soundEnabled) {
            soundManager.playSound(soundKey.toUpperCase());
        }
    }

    initializeCountries() {
        this.state.countries = {}; // Reset countries object
        Object.entries(CONFIG.COUNTRIES).forEach(([code, country]) => {
            this.state.countries[code] = {
                ...country,
                code, // Add the country code
                influence: 0,
                control: 0,
                resistance: country.startingResistance || CONFIG.INITIAL_RESISTANCE,
                status: 'neutral'
            };
        });
        // Log keys right after initialization
        console.log('[gameLogic.js] Countries initialized. Keys:', Object.keys(this.state.countries)); 
    }

    getCountryStats(countryCode) {
        return this.state.countries[countryCode] || null;
    }

    updateCountryStats(countryCode, newStats) { // Receives an object with potential new stats
        if (this.state.countries[countryCode]) {
            const country = this.state.countries[countryCode];
            
            // --- Capture Old State for Milestone Check --- 
            const oldInfluence = country.influence;
            const oldControl = country.control;
            const oldResistance = country.resistance; 
            const oldInfluenceMilestone = Math.floor(oldInfluence / 10); // Capture 10% milestone
            const oldControlMilestone = Math.floor(oldControl / 10);   // Capture 10% milestone

            // --- Apply New Stats --- 
            if (newStats.influence !== undefined) {
                country.influence = Math.min(CONFIG.MAX_INFLUENCE, Math.max(0, newStats.influence));
            }
            if (newStats.control !== undefined) {
                country.control = Math.min(CONFIG.MAX_CONTROL, Math.max(0, newStats.control));
            }
             if (newStats.resistance !== undefined) {
                 country.resistance = Math.min(CONFIG.MAX_RESISTANCE, Math.max(0, newStats.resistance));
             }
            // Apply other stats if passed in newStats

            // --- Award points for 10% milestones crossed ---
            const newInfluenceMilestone = Math.floor(country.influence / 10);
            if (newInfluenceMilestone > oldInfluenceMilestone) {
                const pointsEarned = (newInfluenceMilestone - oldInfluenceMilestone);
                const actualPoints = Math.round(pointsEarned * (this.state.pointsMultiplier || 1.0));
                this.state.points += actualPoints;
                // Optional: console.log(`+${actualPoints} points from ${country.name || countryCode} influence milestones.`);
            }
            
            const newControlMilestone = Math.floor(country.control / 10);
            if (newControlMilestone > oldControlMilestone) {
                const pointsEarned = (newControlMilestone - oldControlMilestone);
                const actualPoints = Math.round(pointsEarned * (this.state.pointsMultiplier || 1.0));
                this.state.points += actualPoints;
                // Optional: console.log(`+${actualPoints} points from ${country.name || countryCode} control milestones.`);
            }
            // --- End point award logic for 10% milestones ---

            // --- News Feed Messages for 50% and 100% Thresholds ---
            const countryName = country.name || countryCode;
            const checkAndLogThreshold = (statName, oldValue, newValue, ui) => {
                // Check for passing 50%
                if (oldValue < 50 && newValue >= 50) {
                    if (ui) ui.addNewsItem(`${statName} in ${countryName} has passed 50%.`, 'milestone');
                }
                // Check for reaching 100%
                if (oldValue < 100 && newValue >= 100) {
                    if (ui) ui.addNewsItem(`${statName} in ${countryName} has reached 100%!`, 'milestone_major');
                }
                // Check for dropping below 50% (for resistance mainly)
                if (statName === "Resistance" && oldValue >= 50 && newValue < 50) {
                     if (ui) ui.addNewsItem(`Resistance in ${countryName} has dropped below 50%.`, 'milestone_positive');
                }
            };

            // Check thresholds based on the final updated values against the old captured values
            checkAndLogThreshold("Influence", oldInfluence, country.influence, this.ui);
            checkAndLogThreshold("Control", oldControl, country.control, this.ui);
            checkAndLogThreshold("Resistance", oldResistance, country.resistance, this.ui);
            // --- End News Feed Messages ---

            // --- Update country status (visuals, etc.) --- 
            let statusChanged = false;
            const oldStatus = country.status;
            if (country.control >= CONFIG.CONTROL_THRESHOLD) {
                country.status = 'controlled';
            } else if (country.influence >= CONFIG.INFLUENCE_THRESHOLD) {
                country.status = 'influenced';
            } else {
                country.status = 'neutral';
            }
            statusChanged = oldStatus !== country.status;

            // Update resistance status potentially
            const oldResistanceHigh = country.resistanceHigh;
            country.resistanceHigh = country.resistance >= 50; // Assuming 50% threshold
            statusChanged = statusChanged || (oldResistanceHigh !== country.resistanceHigh);

            // Notify map of the update IF status actually changed
            // Also notify UI to update the side panel IF it's the selected country
            if (statusChanged && this.map) {
                 this.map.updateMapStatuses(this.state.countries);
            }
            // Update side panel if this is the selected country
            if (this.state.selectedCountry && this.state.selectedCountry.code === countryCode && this.ui) {
                this.ui.updateCountryUI(countryCode);
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
        if (this.state.isPaused && !this.state.triggeredEvent) return; // Only pause for non-event reasons

        // --- Handle Active Event Durations ---
        this.updateActiveEvents();

        // --- Check for New Random Events ---
        // Only check if no event popup is currently active
        if (!this.state.triggeredEvent) {
            this.checkRandomEvents();
            // If an event was triggered, pause the game and skip the rest of the tick
            if (this.state.triggeredEvent) {
                this.state.isPaused = true; 
                if (this.ui) this.ui.updateUI(); // Update UI to show pause state potentially
                return; 
            }
        }
        
        // If paused for an event popup, don't proceed with game logic
        if (this.state.isPaused && this.state.triggeredEvent) return;


        // --- Calculate Global Modifiers --- 
        let globalResistanceFactor = 1.0;
        // Apply temporary modifiers from active events
        Object.values(this.state.activeEvents).forEach(eventInfo => {
            if (eventInfo.effects.globalResistanceModifier) {
                globalResistanceFactor *= eventInfo.effects.globalResistanceModifier;
            }
            // Add other global modifier checks here (e.g., influence, control)
        });


        // Update world state (increments day counter)
        this.updateWorld();

        // Update each country
        Object.entries(this.state.countries).forEach(([code, country]) => {
            const purchased = this.state.purchasedUpgrades[code] || new Set();
            let influenceGrowthRate = 0;
            let controlGrowthRate = CONFIG.CONTROL_PER_TICK;
            let resistanceGrowthRate = CONFIG.RESISTANCE_GROWTH_RATE * globalResistanceFactor; // Apply global factor
            let resistanceModifierFactor = 1.0; // Local modifier factor
            let isInfluenceHalted = false; // Flag for event effects

            // Check for country-specific event effects
            Object.values(this.state.activeEvents).forEach(eventInfo => {
                if (eventInfo.effects.countrySpecificEffect && eventInfo.targetCountry === code) {
                     if (eventInfo.effects.countrySpecificEffect.haltInfluence) {
                         isInfluenceHalted = true;
                     }
                     // Add other country-specific modifier checks here
                }
            });
            
            let potentialNewInfluence = country.influence;
            let potentialNewControl = country.control; // Start with current value for potential decay/growth
            let potentialNewResistance = country.resistance;

            // --- Calculate Potential Influence Change --- 
            if (purchased.has('startInfluencing') && !isInfluenceHalted) { // Check halt flag
                influenceGrowthRate = CONFIG.TRANSMISSION_UPGRADES.startInfluencing.influenceRate || 0.1;
                if (purchased.has('globalBroadcast')) {
                    influenceGrowthRate *= (CONFIG.TRANSMISSION_UPGRADES.globalBroadcast.influenceRateMultiplier || 1.0);
                }
                
                // Apply AI Type Multiplier to base influence rate
                influenceGrowthRate *= this.state.influenceMultiplier || 1.0;

                let resistanceBypass = 0;
                if (purchased.has('subliminalMessaging')) {
                    resistanceBypass = CONFIG.EFFECT_UPGRADES.subliminalMessaging.resistanceBypass || 0;
                }
                const effectiveResistance = Math.max(0, country.resistance / 100 - resistanceBypass);
                const resistanceModifier = 1 - effectiveResistance;
                const influenceGrowth = influenceGrowthRate * resistanceModifier;
                potentialNewInfluence += influenceGrowth;
            }
            // Apply Decay
            if (country.influence > 0 && !purchased.has('encryptedComms')) { 
                potentialNewInfluence -= CONFIG.INFLUENCE_DECAY;
            }

            // --- Calculate Potential Resistance Change --- 
            if (purchased.has('counterIntelligence')) {
                resistanceModifierFactor *= (CONFIG.ABILITY_UPGRADES.counterIntelligence.globalResistanceModifier || 1.0);
            }
            
            // Apply AI Type Multiplier to base resistance rate modifier
            // Lower multiplier = less resistance growth / more decay benefit
            const aiResistanceMultiplier = this.state.resistanceMultiplier || 1.0;
            resistanceModifierFactor *= aiResistanceMultiplier; 

            // Resistance grows based on base rate, modified by influence (less growth at high influence) and other factors.
            if (country.influence > 0) { 
                 // Calculate influence modifier (1 at 0% influence, 0 at 100% influence)
                 const influenceResistanceModifier = Math.max(0, 1 - (country.influence / 100));
                 const resistanceGrowth = resistanceGrowthRate * resistanceModifierFactor * influenceResistanceModifier;
                 potentialNewResistance += resistanceGrowth;
            }
            
            // Resistance decreases based on control level
            if (country.control > 0) {
                const resistanceDecay = CONFIG.RESISTANCE_DECAY_PER_CONTROL * (country.control / 100);
                // Apply AI resistance multiplier inversely to decay (lower multiplier = more decay)
                potentialNewResistance -= resistanceDecay / aiResistanceMultiplier; 
            }

             // --- Calculate Potential Control Change --- 
             // Placeholder for control growth logic (e.g., if influence is high)
             // if (country.influence >= CONFIG.INFLUENCE_THRESHOLD) { ... potentialNewControl += controlGrowthRate ... }
             // Apply control growth if influence threshold is met
             if (country.influence >= CONFIG.INFLUENCE_THRESHOLD) {
                 // Maybe apply resistance modifier here too? Lower resistance -> faster control gain?
                 const resistanceModifier = 1 - (country.resistance / 100); // Example modifier
                 
                 // Apply AI Type Multiplier to base control rate
                 const effectiveControlGrowthRate = controlGrowthRate * (this.state.controlMultiplier || 1.0);
                 
                 const controlGrowth = effectiveControlGrowthRate * resistanceModifier;
                 potentialNewControl += controlGrowth;
             }

             // Apply Decay
             if (country.control > 0 /* && !some_upgrade */) {
                 potentialNewControl -= CONFIG.CONTROL_DECAY;
             }

            // --- Call updateCountryStats with all potential changes --- 
            this.updateCountryStats(code, { 
                influence: potentialNewInfluence,
                control: potentialNewControl,
                resistance: potentialNewResistance
            });
        });

        // Check for influence threshold crossings and create signal effects
        const thresholdEvents = this.state.checkInfluenceThresholds();
        if (thresholdEvents.length > 0) {
            console.log(`[GameLogic] Found ${thresholdEvents.length} threshold events:`, thresholdEvents);
        }
        thresholdEvents.forEach(event => {
            if (this.map && this.state.selectedAIType) {
                console.log(`[GameLogic] Creating signal for ${event.countryCode} at ${event.threshold}%`);
                this.map.createSignalEffect(event.countryCode, this.state.selectedAIType, event.threshold);
            } else {
                console.warn(`[GameLogic] Cannot create signal: map=${!!this.map}, aiType=${this.state.selectedAIType}`);
            }
        });

        // Update signal effects (cleanup expired ones)
        if (this.map) {
            this.map.updateSignalEffects();
        }

        // Update map with all country states
        if (this.map) {
            this.map.updateMapStatuses(this.state.countries);
        }

        // Update UI
        if (this.ui) {
            // Update the main UI (Global stats, points etc.)
            this.ui.updateUI(); 
        }

        return this.state;
    }

    selectAIType(type) {
        // Validate type using config
        if (!CONFIG.AI_TYPES[type]) {
            console.error(`[GameLogic] Invalid AI Type selected: ${type}`);
            return false;
        }

        // Delegate setting AI type and its bonuses/multipliers to GameState
        this.state.setAIType(type);

        // GameState.setAIType now handles points and starting bonuses.
        // We still need GameState to handle country initialization properly.
        // Let's ensure countries are initialized by GameState before starting.
        this.state.initializeCountries(); // Ask GameState to set up the countries

        // Start the game (which starts the tick loop)
        this.startGame(); // startGame should probably also be moved to GameState or triggered via it.
        return true;
    }

    startGame() {
        // This logic might be better placed within GameState or triggered after setAIType
        if (!this.state.selectedAIType) {
            console.error("[GameLogic] Cannot start game without selecting an AI Type first.");
            return false;
        }

        this.state.isPaused = false;
        this.state.gameStarted = true;
        this.state.day = 1;

        // Clear any existing signal effects
        if (this.map) {
            this.map.clearAllSignals();
        }

        // Add initial message (Consider moving messaging logic elsewhere)
        // this.state.addMessage(`Game started with ${CONFIG.AI_TYPES[this.state.selectedAIType].name}! Select a region to begin your conquest.`);
        console.log(`[GameLogic] Starting game with AI: ${this.state.selectedAIType}`);

        // Start game loop
        this.startGameLoop();

        // Play start sound
        this.playSound('START');

        return true;
    }

    startGameLoop() {
        if (this.gameLoop) {
            return;
        }
        
        this.gameLoop = setInterval(() => {
            if (!this.state.isPaused) {
                this.tick();
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
            // Message not shown in UI
        }
    }

    upgradeTransmission(id) {
        if (!this.state.selectedCountry) {
            return false;
        }
        const countryCode = this.state.selectedCountry.code;
        const upgrade = CONFIG.TRANSMISSION_UPGRADES[id]; // Direct access by ID

        if (!upgrade || !this.isUpgradeAvailable(id)) {
            return false;
        }

        if (this.state.points >= upgrade.cost) {
            this.state.points -= upgrade.cost;
            // Ensure set exists before adding
            if (!this.state.purchasedUpgrades[countryCode]) {
                this.state.purchasedUpgrades[countryCode] = new Set();
            }
            this.state.purchasedUpgrades[countryCode].add(id);
            
            // Apply *instant* upgrade effects
            const country = this.state.countries[countryCode];
            let instantChanges = {};

            if (upgrade.influenceBonus) {
                 // Calculate new potential influence based on current + bonus
                 instantChanges.influence = country.influence + upgrade.influenceBonus;
            }
            if (upgrade.controlBonus) {
                 instantChanges.control = country.control + upgrade.controlBonus;
            }
             if (upgrade.resistanceReduction) { 
                 instantChanges.resistance = country.resistance - (upgrade.resistanceReduction * 100); 
             }
            
            // Update stats using the central function to trigger milestones
            if (Object.keys(instantChanges).length > 0) {
                this.updateCountryStats(countryCode, instantChanges);
                this.updateGlobalStats(); // Update global averages
            }
            
            if (this.ui) {
                this.ui.updateUI(); // General UI update (points, etc.)
                this.ui.updateUpgradeUI(); // Specifically refresh upgrade buttons
            }
            this.playSound('UPGRADE'); // Play sound
            return true;
        } else {
            this.playSound('ERROR'); // Play error sound
            return false;
        }
    }

    upgradeEffect(id) {
        if (!this.state.selectedCountry) return false;
        const countryCode = this.state.selectedCountry.code;
        const upgrade = CONFIG.EFFECT_UPGRADES[id];

        if (!upgrade || !this.isUpgradeAvailable(id)) return false;

        if (this.state.points >= upgrade.cost) {
            this.state.points -= upgrade.cost;
            if (!this.state.purchasedUpgrades[countryCode]) {
                this.state.purchasedUpgrades[countryCode] = new Set();
            }
            this.state.purchasedUpgrades[countryCode].add(id);
            
            // Apply *instant* upgrade effects
            const country = this.state.countries[countryCode];
            let instantChanges = {};

            if (upgrade.influenceBonus) {
                 instantChanges.influence = country.influence + upgrade.influenceBonus;
            }
            if (upgrade.controlBonus) {
                 instantChanges.control = country.control + upgrade.controlBonus;
            }
            if (upgrade.resistanceReduction) {
                 instantChanges.resistance = country.resistance - (upgrade.resistanceReduction * 100);
            }
            if (id === 'economicPressure' && upgrade.resistanceIncreaseSlight) {
                 // Need to handle potential conflicting changes to resistance
                 let currentResistance = instantChanges.resistance !== undefined ? instantChanges.resistance : country.resistance;
                 instantChanges.resistance = currentResistance + (upgrade.resistanceIncreaseSlight * 100);
            }
            
             // Update stats using the central function to trigger milestones
            if (Object.keys(instantChanges).length > 0) {
                this.updateCountryStats(countryCode, instantChanges);
                this.updateGlobalStats(); // Update global averages
            }
            
            if (this.ui) {
                 this.ui.updateUI(); // General UI update (points, etc.)
                 this.ui.updateUpgradeUI(); // Specifically refresh upgrade buttons
            }
            this.playSound('UPGRADE'); // Play sound
            return true;
        } else {
            this.playSound('ERROR');
            return false;
        }
    }

    upgradeAbility(id) {
        if (!this.state.selectedCountry) return false;
        const countryCode = this.state.selectedCountry.code;
        const upgrade = CONFIG.ABILITY_UPGRADES[id];

        if (!upgrade || !this.isUpgradeAvailable(id)) return false;

        if (this.state.points >= upgrade.cost) {
            this.state.points -= upgrade.cost;
            if (!this.state.purchasedUpgrades[countryCode]) {
                this.state.purchasedUpgrades[countryCode] = new Set();
            }
            this.state.purchasedUpgrades[countryCode].add(id);
            
            // Apply *instant* upgrade effects
            const country = this.state.countries[countryCode];
             let instantChanges = {};

            if (upgrade.controlBonus) {
                  instantChanges.control = country.control + upgrade.controlBonus;
            }
            if (upgrade.resistanceReduction) {
                  instantChanges.resistance = country.resistance - (upgrade.resistanceReduction * 100);
            }
             
            // Update stats using the central function to trigger milestones
            if (Object.keys(instantChanges).length > 0) {
                this.updateCountryStats(countryCode, instantChanges);
                this.updateGlobalStats(); // Update global averages
            }
            
            if (this.ui) {
                 this.ui.updateUI(); // General UI update (points, etc.)
                 this.ui.updateUpgradeUI(); // Specifically refresh upgrade buttons
            }
             this.playSound('UPGRADE'); // Play sound
             return true;
        } else {
             this.playSound('ERROR');
             return false;
        }
    }

    updateGlobalStats() {
        // Calculate global stats from all countries
        const stats = Object.values(this.state.countries).reduce((acc, country) => {
            acc.influence += country.influence;
            acc.control += country.control;
            acc.resistance += country.resistance;
            return acc;
        }, { influence: 0, control: 0, resistance: 0 });

        // Update global stats
        this.state.influence = stats.influence / Object.keys(this.state.countries).length;
        this.state.control = stats.control / Object.keys(this.state.countries).length;
        this.state.resistance = stats.resistance / Object.keys(this.state.countries).length;
    }

    getRegionStatus(regionId) {
        const country = this.state.countries[regionId];
        if (!country) return null;

        return {
            ...country,
            isInfluenced: country.influence >= CONFIG.INFLUENCE_THRESHOLD,
            isControlled: country.control >= CONFIG.CONTROL_THRESHOLD,
            influencePercent: (country.influence / CONFIG.CONTROL_THRESHOLD) * 100,
            controlPercent: (country.control / CONFIG.CONTROL_THRESHOLD) * 100
        };
    }

    getGameStatus() {
        return {
            points: this.state.points,
            day: this.state.day,
            influence: this.state.influence,
            control: this.state.control,
            resistance: this.state.resistance,
            countries: this.state.countries,
            purchasedUpgrades: Array.from(this.state.purchasedUpgrades),
            gameOver: this.state.gameOver
        };
    }

    saveGame(slot) {
        try {
            // Use GameState's save method
            const saveData = this.state.getSaveData(); 
            localStorage.setItem(`${CONFIG.SAVE_KEY_PREFIX}${slot}`, JSON.stringify(saveData));
            console.log(`[GameLogic] Game saved to slot ${slot}`);
            return true;
        } catch (error) {
            return false;
        }
    }

    loadGame(slot) {
        try {
            const saveDataString = localStorage.getItem(`${CONFIG.SAVE_KEY_PREFIX}${slot}`);
            if (!saveDataString) {
                 console.warn(`[GameLogic] No save data found for slot ${slot}`);
                 return false;
            }
            
            const saveData = JSON.parse(saveDataString);
            const success = this.state.loadSaveData(saveData);
            if (success) {
                // Clear any existing signal effects
                if (this.map) {
                    this.map.clearAllSignals();
                }
                
                // Need to potentially update UI and restart loop after load
                this.stopGameLoop(); // Stop existing loop if any
                if (this.state.gameStarted && !this.state.isPaused) {
                    this.startGameLoop(); // Restart loop if game was running
                }
                if (this.ui) {
                    this.ui.updateUI(); // Full UI refresh
                    if (this.state.selectedCountry) {
                        this.ui.updateCountryUI(this.state.selectedCountry.code);
                    }
                }
                 if (this.map) {
                     this.map.updateMapStatuses(this.state.countries);
                 }
            }
            return success;
        } catch (error) {
            console.error(`[GameLogic] Error loading game from slot ${slot}:`, error);
            return false;
        }
    }

    deleteSave(slot) {
        try {
            localStorage.removeItem(`${CONFIG.SAVE_KEY_PREFIX}${slot}`);
            return true;
        } catch (error) {
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

    influenceRegion(countryCode) {
        const country = this.state.countries[countryCode];
        if (!country) return false;

        // Only apply influence gain if we have points to spend
        if (this.state.points > 0) {
            // Calculate influence gain based on current influence and AI type
            const baseGain = CONFIG.UPGRADE_MULTIPLIER * 100; // 10% increase per point
            const resistanceFactor = 1 - (country.resistance / 100);
            const aiMultiplier = this.state.selectedAIType ? CONFIG.AI_TYPES[this.state.selectedAIType].influenceMultiplier : 1;
            const influenceGain = baseGain * resistanceFactor * aiMultiplier;

            // Apply influence gain
            country.influence = Math.min(CONFIG.MAX_INFLUENCE, country.influence + influenceGain);
            this.state.points--;

            // If influence is high enough, start gaining control
            if (country.influence >= CONFIG.INFLUENCE_THRESHOLD) {
                const controlGain = baseGain * resistanceFactor * aiMultiplier;
                country.control = Math.min(CONFIG.MAX_CONTROL, country.control + controlGain);
            }

            // Update country status
            this.updateCountryStats(countryCode, country);
            return true;
        }

        return false;
    }

    update() {
        // Update game state
        this.state.update();
        
        // Check for new achievements
        const newAchievements = this.state.checkAchievements();
        if (newAchievements && newAchievements.length > 0) {
            newAchievements.forEach(achievement => {
                // Achievement unlocked
            });
        }

        // Check for game over
        if (this.state.gameOver) {
            this.stopGameLoop();
            // Stub out sound method
        }
    }

    selectRegion(countryCode) {
        const country = this.state.countries[countryCode];
        if (!country) {
            return false;
        }

        // Initialize purchasedUpgrades for this country if it doesn't exist
        if (!this.state.purchasedUpgrades[countryCode]) {
            this.state.purchasedUpgrades[countryCode] = new Set();
        }

        // Check if already selected
        const alreadySelected = country.selected;

        // Deselect all other countries
        Object.values(this.state.countries).forEach(c => c.selected = false);
        
        // Select the clicked country
        country.selected = true;
        
        // Update the selected country in the game state
        const oldSelectedCode = this.state.selectedCountry?.code;
        this.state.selectedCountry = {
            code: countryCode,
            name: CONFIG.COUNTRIES[countryCode].name
        };
        
        // Update the UI Panel specifically for the selected country
        if (this.ui) {
            this.ui.updateCountryUI(countryCode);
            // Trigger map status update ONLY if selection actually changed
            if (oldSelectedCode !== countryCode) {
                if(this.map) {
                    this.map.updateMapStatuses(this.state.countries);
                }
            }
        }
        
        return true;
    }

    updateWorld() {
        this.state.day++;
    }

    getState() {
        return this.state;
    }

    isUpgradeAvailable(upgradeId) {
        if (!this.state.selectedCountry) {
            return false;
        }
        const countryCode = this.state.selectedCountry.code;
        
        // Find the upgrade in any category
        const upgrade = CONFIG.TRANSMISSION_UPGRADES[upgradeId] ||
                        CONFIG.EFFECT_UPGRADES[upgradeId] ||
                        CONFIG.ABILITY_UPGRADES[upgradeId];

        if (!upgrade) {
            console.warn(`Upgrade definition not found for ID: ${upgradeId}`);
            return false;
        }

        // Ensure purchasedUpgrades set exists for the country
        const purchased = this.state.purchasedUpgrades[countryCode] || new Set();

        // Check if already purchased
        if (purchased.has(upgradeId)) {
            return false;
        }

        // Check prerequisites
        if (upgrade.prerequisites && upgrade.prerequisites.length > 0) {
            const hasPrerequisites = upgrade.prerequisites.every(prereq => purchased.has(prereq));
            if (!hasPrerequisites) {
                return false;
            }
        }
        
        // Check cost (optional here, but good practice)
        // if (this.state.points < upgrade.cost) {
        //     return false; 
        // }

        return true;
    }

    getAvailableUpgrades(countryCode) {
        const country = this.state.countries[countryCode];
        if (!country) return { transmissions: [], effects: [], abilities: [] };

        const availableUpgrades = {
            transmissions: [],
            effects: [],
            abilities: []
        };

        // Check transmission upgrades
        Object.values(CONFIG.TRANSMISSION_UPGRADES).forEach(upgrade => {
            if (this.isUpgradeAvailable(upgrade.id)) {
                availableUpgrades.transmissions.push(upgrade);
            }
        });

        // Check effect upgrades
        Object.values(CONFIG.EFFECT_UPGRADES).forEach(upgrade => {
            if (this.isUpgradeAvailable(upgrade.id)) {
                availableUpgrades.effects.push(upgrade);
            }
        });

        // Check ability upgrades
        Object.values(CONFIG.ABILITY_UPGRADES).forEach(upgrade => {
            if (this.isUpgradeAvailable(upgrade.id)) {
                availableUpgrades.abilities.push(upgrade);
            }
        });

        return availableUpgrades;
    }

    selectCountry(countryCode) {
        const country = this.state.countries[countryCode];
        if (!country) return false;

        // Initialize purchasedUpgrades set if it doesn't exist for this country
        if (!this.state.purchasedUpgrades[countryCode]) {
            this.state.purchasedUpgrades[countryCode] = new Set();
        }

        this.state.selectedCountry = {
            code: countryCode,
            name: CONFIG.COUNTRIES[countryCode].name
        };

        if (this.ui) {
            this.ui.updateUI();
        }
        return true;
    }

    updateActiveEvents() {
        const now = Date.now(); // Or use game ticks if preferred
        for (const eventId in this.state.activeEvents) {
            const eventInfo = this.state.activeEvents[eventId];
            eventInfo.remainingDuration--;

            if (eventInfo.remainingDuration <= 0) {
                console.log(`Event "${eventInfo.title}" duration ended.`);
                delete this.state.activeEvents[eventId];
                // Potentially trigger a UI update if effects ending is significant
            }
        }
    }

    checkRandomEvents() {
        if (this.state.triggeredEvent) return; // Don't trigger another if one is pending UI

        const events = CONFIG.RANDOM_EVENTS;
        const currentDay = this.state.day;
        const globalInfluence = this.state.influence; // Assuming state tracks global average
        const globalControl = this.state.control;     // Assuming state tracks global average
        const globalResistance = this.state.resistance; // Assuming state tracks global average

        for (const eventId in events) {
            const event = events[eventId];
            let conditionsMet = true;

            // Check Triggers
            if (event.trigger) {
                if (event.trigger.minDay && currentDay < event.trigger.minDay) conditionsMet = false;
                if (event.trigger.maxDay && currentDay > event.trigger.maxDay) conditionsMet = false;
                if (event.trigger.minGlobalInfluence && globalInfluence < event.trigger.minGlobalInfluence) conditionsMet = false;
                if (event.trigger.maxGlobalInfluence && globalInfluence > event.trigger.maxGlobalInfluence) conditionsMet = false;
                if (event.trigger.minGlobalControl && globalControl < event.trigger.minGlobalControl) conditionsMet = false;
                if (event.trigger.maxGlobalControl && globalControl > event.trigger.maxGlobalControl) conditionsMet = false;
                if (event.trigger.minGlobalResistance && globalResistance < event.trigger.minGlobalResistance) conditionsMet = false;
                if (event.trigger.maxGlobalResistance && globalResistance > event.trigger.maxGlobalResistance) conditionsMet = false;
                // Add more complex trigger checks if needed (e.g., specific country status)
            }

            // Roll Probability if conditions met
            if (conditionsMet) {
                if (Math.random() < event.probability) {
                    console.log(`Triggering Event: ${event.title}`);
                    this.triggerEvent(event);
                    // Stop checking once an event triggers for this tick
                    return; 
                }
            }
        }
    }
    
    triggerEvent(eventData) {
        // Find target country NOW if applicable, so UI can display it
        let targetCountryCode = null;
        let targetCountryName = null;
        if (eventData.effects && eventData.effects.countrySpecificEffect) {
            targetCountryCode = this.findTargetCountry(eventData.effects.countrySpecificEffect.target);
            if (targetCountryCode && this.state.countries[targetCountryCode]) {
                targetCountryName = this.state.countries[targetCountryCode].name;
            }
        }
        
        // ----> Add Log Here <----
        console.log(`[triggerEvent] Determined Target: Code=${targetCountryCode}, Name=${targetCountryName}`);
        
        // Add News Item for the event triggering
        let newsMessage = `Event: ${eventData.title}`;
        if (targetCountryName) {
            newsMessage += ` (Affecting ${targetCountryName})`;
        }
        if(this.ui) this.ui.addNewsItem(newsMessage, `event-${eventData.type || 'neutral'}`);

        // Set the event data for the UI to pick up, including target info
        this.state.triggeredEvent = {
             ...eventData,
             targetCountryCode: targetCountryCode, // Store code even if effect is immediate
             targetCountryName: targetCountryName // Store name for UI
        };
        
        // Apply immediate effects that don't require UI dismissal
        // Pass the determined target country code if applicable
        this.applyEventEffects(this.state.triggeredEvent, false); 

        // Play a sound?
        this.playSound('NOTIFICATION'); // Or a specific event sound?
        
        // Pause is handled in tick() when triggeredEvent is set
    }

    // Called by UI when popup is closed, or directly by triggerEvent for immediate effects
    applyEventEffects(eventData, isAfterPopupClose) {
         console.log(`Applying effects for event: ${eventData.title} (After Popup: ${isAfterPopupClose})`);
         const effects = eventData.effects;

         // Handle effects applied AFTER popup close (or all effects if no duration)
         if (isAfterPopupClose || !effects.duration) {
            if (effects.pointsChange) {
                this.state.points = Math.max(0, this.state.points + effects.pointsChange);
                console.log(`Points changed by ${effects.pointsChange}. New total: ${this.state.points}`);
            }
            if (effects.countrySpecificEffect) {
                // Pass the pre-calculated target country code
                this.applyCountrySpecificEventEffect(eventData.id, effects.countrySpecificEffect, eventData.targetCountryCode);
            }
            // Add other immediate effect applications here
         }

         // Handle effects with duration (applied immediately, tracked in activeEvents)
         if (effects.duration && effects.duration > 0 && !isAfterPopupClose) {
             this.state.activeEvents[eventData.id] = {
                 ...eventData, // Copy event data (includes targetCode/Name already)
                 remainingDuration: effects.duration,
                 targetCountry: eventData.targetCountryCode // Use the already determined target code
             };
             console.log(`Event "${eventData.title}" activated with duration ${effects.duration}.`);
         }

        // If this was called after closing the popup, clear the triggered event and unpause
        if (isAfterPopupClose) {
             this.state.triggeredEvent = null;
             this.state.isPaused = false;
             console.log("Popup closed, event processed, resuming game.");
        }
        
        // Update UI after effects are applied
        if (this.ui) {
            this.ui.updateUI();
            if(this.state.selectedCountry) {
                 this.ui.updateCountryUI(this.state.selectedCountry.code); // Update panel if needed
            }
        }
        if (this.map) {
             this.map.updateMapStatuses(this.state.countries); // Update map visuals
        }
    }

    findTargetCountry(targetType) {
        let eligibleCountries = [];
        const allCountries = Object.entries(this.state.countries);

        switch (targetType) {
            case 'random_influenced_or_neutral':
                eligibleCountries = allCountries.filter(([code, c]) => {
                    const hasInitialTap = this.state.purchasedUpgrades[code]?.has('startInfluencing');
                    return (c.status === 'influenced' || c.status === 'neutral') && hasInitialTap;
                }).map(([code, c]) => code);
                break;
            case 'random_controlled_or_influenced':
                 eligibleCountries = allCountries.filter(([code, c]) => {
                     const hasInitialTap = this.state.purchasedUpgrades[code]?.has('startInfluencing');
                     return (c.status === 'controlled' || c.status === 'influenced') && hasInitialTap;
                 }).map(([code, c]) => code);
                 break;
            // Add more targeting types: highest_pop, lowest_resistance, specific_continent etc.
            default: // Default to any random country *that has the initial tap*
                eligibleCountries = allCountries.filter(([code, c]) => {
                     return this.state.purchasedUpgrades[code]?.has('startInfluencing');
                }).map(([code, c]) => code);
                break;
        }

        if (eligibleCountries.length > 0) {
            const randomIndex = Math.floor(Math.random() * eligibleCountries.length);
            return eligibleCountries[randomIndex];
        }
        return null; // No eligible country found
    }

    // Modified to accept targetCountryCode
    applyCountrySpecificEventEffect(eventId, effectDetails, targetCountryCode) {
        // const targetCountryCode = this.findTargetCountry(effectDetails.target);
        if (!targetCountryCode) {
            // This warning might still be relevant if findTargetCountry returned null initially
            console.warn(`Event ${eventId}: Could not find or was not provided a suitable target country for type "${effectDetails.target}".`);
            return;
        }

        const country = this.state.countries[targetCountryCode];
        console.log(`Applying country-specific effect from event ${eventId} to ${country.name} (${targetCountryCode})`);

        let instantChanges = {};
        if (effectDetails.influenceBonus) {
            instantChanges.influence = country.influence + effectDetails.influenceBonus;
        }
        if (effectDetails.controlBonus) {
             instantChanges.control = country.control + effectDetails.controlBonus;
        }
        if (effectDetails.resistanceChange) {
            instantChanges.resistance = country.resistance + effectDetails.resistanceChange;
        }
        // Note: Duration effects like 'haltInfluence' are handled by checking state.activeEvents in the tick loop

        if (Object.keys(instantChanges).length > 0) {
             console.log(`Instant changes for ${country.name}:`, instantChanges);
             this.updateCountryStats(targetCountryCode, instantChanges); // Use central update function
        }
    }
}

export default GameLogic; 