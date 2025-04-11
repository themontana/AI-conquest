import { CONFIG } from './config.js';

// Game State Management
export class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.points = CONFIG.STARTING_POINTS;
        this.influence = CONFIG.STARTING_INFLUENCE; // Base potential for display
        this.control = CONFIG.STARTING_CONTROL;     // Base potential for display
        this.resistance = CONFIG.STARTING_RESISTANCE; // Base potential for display
        this.selectedAIType = null;
        this.regions = this.initializeRegions();
        this.achievements = new Set();
        this.purchasedUpgrades = new Set(); // Initialize purchased upgrades set
        this.gameOver = false;
        this.lastUpdate = Date.now();
        this.days = 0;
        this.lastDayUpdate = Date.now();
        this.gameSpeed = 1;
        
        // Initialize upgrade arrays
        this.transmissionUpgrades = [];
        this.effectUpgrades = [];
        this.abilityUpgrades = [];

        // Initialize upgrade multipliers
        this.transmissionMultiplier = 1;
        this.effectMultiplier = 1;
        this.abilityMultiplier = 1; // Added for consistency, might be used later

        // Apply AI type multipliers to base potential *if selected*
        // Note: Global influence/control/resistance will be calculated based on regions in update()
        // We might not need to apply multipliers here anymore, but let's keep for initial display consistency
        if (this.selectedAIType) {
            const aiType = CONFIG.AI_TYPES[this.selectedAIType];
            // These lines might become redundant if global stats are purely derived from regions.
            // Keeping for now.
            // this.influence *= aiType.influenceMultiplier; // Initial display value adjustment
            // this.control *= aiType.controlMultiplier;     // Initial display value adjustment
            // this.resistance *= aiType.resistanceMultiplier; // Initial display value adjustment
        }
    }

    initializeRegions() {
        return Array.from({ length: CONFIG.REGION_COUNT }, (_, i) => ({
            id: i,
            name: `Region ${i + 1}`,
            influence: 0,
            control: 0,
            resistance: CONFIG.BASE_REGION_RESISTANCE + (i * CONFIG.RESISTANCE_INCREASE),
            description: `Region ${i + 1} - Resistance: ${CONFIG.BASE_REGION_RESISTANCE + (i * CONFIG.RESISTANCE_INCREASE)}`,
            selected: false
        }));
    }

    update() {
        if (this.isPaused) return;

        const now = Date.now();
        const gameSpeed = Math.max(0.1, this.gameSpeed || 1); // Ensure game speed is never 0
        const deltaTime = (now - this.lastUpdate) / (CONFIG.GAME_SPEED * gameSpeed);
        this.lastUpdate = now;

        // Update each region
        Object.values(this.regions).forEach(region => {
            // Apply resistance growth
            region.resistance = Math.min(
                CONFIG.MAX_RESISTANCE,
                region.resistance + (CONFIG.RESISTANCE_GROWTH * deltaTime)
            );
            
            // Apply influence decay
            region.influence = Math.max(
                0,
                region.influence - (CONFIG.INFLUENCE_DECAY * deltaTime)
            );
            
            // Apply control decay
            region.control = Math.max(
                0,
                region.control - (CONFIG.CONTROL_DECAY * deltaTime)
            );
        });

        // Update days - now runs 4x faster than game tick
        const dayDelta = (now - this.lastDayUpdate) / (CONFIG.GAME_SPEED * 6 * gameSpeed);
        if (dayDelta >= 1) {
            this.days += Math.floor(dayDelta);
            this.lastDayUpdate = now;
            
            // Generate points based on progression
            this.generatePoints();
            
            // Check for random events
            this.checkRandomEvents();
        }

        if (this.gameOver) return;

        // --- Global Stat Calculation ---
        let totalRawInfluence = 0;
        let totalRawControl = 0;
        let totalResistance = 0;
        const regionCount = Object.keys(this.regions).length;
        const maxPossiblePoints = CONFIG.CONTROL_THRESHOLD * regionCount;

        // Calculate totals from regions
        Object.values(this.regions).forEach(region => {
            totalRawInfluence += region.influence;
            totalRawControl += region.control;
            totalResistance += region.resistance;
        });

        // Update global influence/control as percentage of total possible world points
        this.influence = maxPossiblePoints > 0 ? (totalRawInfluence / maxPossiblePoints) * 100 : 0;
        this.control = maxPossiblePoints > 0 ? (totalRawControl / maxPossiblePoints) * 100 : 0;

        // Update global resistance as average raw resistance across all regions
        this.resistance = regionCount > 0 ? totalResistance / regionCount : 0;

        // Check for game over condition
        this.checkGameOver();
    }

    calculateInfluenceGain(region, deltaTime) {
        const basePotential = CONFIG.STARTING_INFLUENCE * this.transmissionMultiplier;
        const baseGain = (basePotential * deltaTime) / 6;
        // Stronger Resistance Pushback: Square the factor (0 resistance = 1, 100 resistance = 0)
        const resistanceFactor = Math.pow(1 - (region.resistance / 100), 2); 
        const aiMultiplier = this.selectedAIType ? CONFIG.AI_TYPES[this.selectedAIType].influenceMultiplier : 1;
        return Math.max(0, baseGain * resistanceFactor * aiMultiplier);
    }

    calculateControlGain(region, deltaTime) {
        const BASE_CONTROL_POTENTIAL = 2.5; 
        const basePotential = BASE_CONTROL_POTENTIAL * this.effectMultiplier;
        const baseGain = (basePotential * deltaTime) / 6;
        const influenceFactor = 1; 
        // Stronger Resistance Pushback: Square the factor
        const resistanceFactor = Math.pow(1 - (region.resistance / 100), 2);
        const aiMultiplier = this.selectedAIType ? CONFIG.AI_TYPES[this.selectedAIType].controlMultiplier : 1;
        return Math.max(0, baseGain * influenceFactor * resistanceFactor * aiMultiplier);
    }

    checkGameOver() {
        // Game over if all regions are controlled
        const allRegionsControlled = Object.values(this.regions).every(region => 
            region.control >= CONFIG.CONTROL_THRESHOLD
        );
        
        if (allRegionsControlled) {
            this.gameOver = true;
            return true;
        }
        return false;
    }

    upgrade(stat) {
        const costs = CONFIG.UPGRADE_COSTS[stat];
        if (!costs) return false;
        
        const currentLevel = this[stat.toLowerCase()];
        if (currentLevel >= costs.length) return false;
        if (this.points < costs[currentLevel]) return false;

        this.points -= costs[currentLevel];
        this[stat.toLowerCase()] = currentLevel + 1;

        // Update multipliers based on upgrade type
        switch (stat.toLowerCase()) {
            case 'influence':
                this.transmissionMultiplier += CONFIG.UPGRADE_MULTIPLIER;
                break;
            case 'control':
                this.effectMultiplier += CONFIG.UPGRADE_MULTIPLIER;
                break;
            case 'resistance':
                this.abilityMultiplier += CONFIG.UPGRADE_MULTIPLIER;
                break;
        }

        // Add to purchased upgrades set
        this.purchasedUpgrades.add(`${stat.toLowerCase()}_${currentLevel + 1}`);

        return true;
    }

    checkAchievements() {
        // Only check achievements if game has started (after AI selection)
        if (!this.selectedAIType) return [];

        const newAchievements = [];
        Object.entries(CONFIG.ACHIEVEMENTS).forEach(([id, achievement]) => {
            if (!this.achievements.has(id) && achievement.condition(this)) {
                this.achievements.add(id);
                newAchievements.push({
                    id,
                    name: achievement.name,
                    description: achievement.description
                });
            }
        });
        return newAchievements;
    }

    // Save/Load functionality
    save(slot) {
        const saveData = {
            points: this.points,
            influence: this.influence,
            control: this.control,
            resistance: this.resistance,
            selectedAIType: this.selectedAIType,
            regions: this.regions,
            achievements: Array.from(this.achievements),
            purchasedUpgrades: Array.from(this.purchasedUpgrades),
            transmissionUpgrades: this.transmissionUpgrades,
            effectUpgrades: this.effectUpgrades,
            abilityUpgrades: this.abilityUpgrades,
            transmissionMultiplier: this.transmissionMultiplier,
            effectMultiplier: this.effectMultiplier,
            abilityMultiplier: this.abilityMultiplier,
            days: this.days,
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
            this.regions = data.regions;
            this.achievements = new Set(data.achievements || []);
            this.purchasedUpgrades = new Set(data.purchasedUpgrades || []);
            this.transmissionUpgrades = data.transmissionUpgrades || [];
            this.effectUpgrades = data.effectUpgrades || [];
            this.abilityUpgrades = data.abilityUpgrades || [];
            this.transmissionMultiplier = data.transmissionMultiplier || 1;
            this.effectMultiplier = data.effectMultiplier || 1;
            this.abilityMultiplier = data.abilityMultiplier || 1;
            this.days = data.days || 0;
            this.gameSpeed = data.gameSpeed || 1;

            this.lastUpdate = Date.now();
            this.lastDayUpdate = Date.now();
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
                regionsControlled: data.regions.filter(r => r.control >= CONFIG.CONTROL_THRESHOLD).length
            };
        } catch (error) {
            return null;
        }
    }

    generatePoints() {
        // Base points per day
        let points = 1;
        
        // Points from influenced regions
        const influencedRegions = this.regions.filter(r => r.influence > 0).length;
        points += influencedRegions * 0.5;
        
        // Points from controlled regions
        const controlledRegions = this.regions.filter(r => r.control >= CONFIG.CONTROL_THRESHOLD).length;
        points += controlledRegions * 2;
        
        // Points from upgrades
        const totalUpgrades = this.transmissionUpgrades.length + 
                            this.effectUpgrades.length + 
                            this.abilityUpgrades.length;
        points += totalUpgrades * 0.25;
        
        // Points from AI type multiplier
        const aiMultiplier = this.selectedAIType ? 
            CONFIG.AI_TYPES[this.selectedAIType].pointsMultiplier || 1 : 1;
        
        // Add points to total
        this.points += Math.floor(points * aiMultiplier);
    }

    checkRandomEvents() {
        // Reduce chance to 1% per day (adjust as needed for game balance)
        if (Math.random() < 0.01) { 
            const event = this.getRandomEvent();
            if (event) {
                const affectedRegion = this.applyEvent(event);
                // Return event details along with the region affected (if any)
                return { ...event, affectedRegionName: affectedRegion ? affectedRegion.name : null }; 
            }
        }
        return null;
    }

    getRandomEvent() {
        const events = [
            {
                type: 'resistance_increase',
                name: 'Resistance Movement',
                description: 'A well-organized resistance movement has significantly bolstered defenses in a region.',
                effect: (region) => {
                    // Increase resistance by a larger amount, maybe scaling with current resistance?
                    const gain = 25 + region.resistance * 0.1; // Example: Base 25 + 10% of current
                    region.resistance = Math.min(region.resistance + gain, 100);
                }
            },
            {
                type: 'influence_decrease',
                name: 'Counter-Propaganda',
                description: 'Counter-propaganda efforts have significantly reduced your influence in a region.',
                effect: (region) => {
                    region.influence = Math.max(region.influence - 10, 0);
                }
            },
            {
                type: 'bonus_points',
                name: 'Strategic Opportunity',
                description: 'A major strategic opportunity has presented itself, granting significant bonus points.',
                effect: () => {
                    this.points += 100;
                }
            }
        ];

        // Only add rebellion event if there are controlled regions
        const hasControlledRegions = this.regions.some(r => r.control >= CONFIG.CONTROL_THRESHOLD);
        if (hasControlledRegions) {
            events.push({
                type: 'control_decrease',
                name: 'Rebellion',
                description: 'A major rebellion has broken out in a controlled region.',
                effect: (region) => {
                    if (region.control >= CONFIG.CONTROL_THRESHOLD) {
                        region.control = Math.max(region.control - 20, 0);
                    }
                }
            });
        }

        return events[Math.floor(Math.random() * events.length)];
    }

    applyEvent(event) {
        if (event.type === 'bonus_points') {
            event.effect();
            return null; // No specific region affected
        } else {
            // Select a random suitable region
            let suitableRegions = this.regions;
            if (event.type === 'control_decrease') {
                suitableRegions = this.regions.filter(r => r.control >= CONFIG.CONTROL_THRESHOLD);
            } else if (event.type === 'influence_decrease') {
                suitableRegions = this.regions.filter(r => r.influence > 0);
            } // resistance_increase can affect any region
            
            if (suitableRegions.length === 0) return null; // No suitable region found
            
            const regionIndex = Math.floor(Math.random() * suitableRegions.length);
            const region = suitableRegions[regionIndex];
            event.effect(region);
            return region; // Return the affected region
        }
    }

    // Add a helper to recalculate global stats after load or reset
    recalculateGlobalStats() {
        let totalInfluence = 0;
        let totalControl = 0;
        let totalResistance = 0;
        let influencedRegionCount = 0;
        let controlledRegionCount = 0;

        if (!this.regions || this.regions.length === 0) {
             this.influence = CONFIG.STARTING_INFLUENCE * (this.selectedAIType ? CONFIG.AI_TYPES[this.selectedAIType].influenceMultiplier : 1);
             this.control = CONFIG.STARTING_CONTROL * (this.selectedAIType ? CONFIG.AI_TYPES[this.selectedAIType].controlMultiplier : 1);
             this.resistance = CONFIG.STARTING_RESISTANCE * (this.selectedAIType ? CONFIG.AI_TYPES[this.selectedAIType].resistanceMultiplier : 1);
             return;
        }


        this.regions.forEach(region => {
            if (region.influence > 0) {
                totalInfluence += region.influence;
                influencedRegionCount++;
            }
            if (region.control > 0) {
                totalControl += region.control;
                controlledRegionCount++;
            }
            totalResistance += region.resistance;
        });

        if (influencedRegionCount > 0) {
            this.influence = totalInfluence / influencedRegionCount;
        } else {
             this.influence = CONFIG.STARTING_INFLUENCE * (this.selectedAIType ? CONFIG.AI_TYPES[this.selectedAIType].influenceMultiplier : 1);
        }

        if (controlledRegionCount > 0) {
            this.control = totalControl / controlledRegionCount;
        } else {
            this.control = CONFIG.STARTING_CONTROL * (this.selectedAIType ? CONFIG.AI_TYPES[this.selectedAIType].controlMultiplier : 1);
        }

        this.resistance = totalResistance / this.regions.length;
    }
} 