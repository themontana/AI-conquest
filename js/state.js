import { CONFIG } from './config.js';

// Game State Management
export class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.points = CONFIG.STARTING_POINTS;
        this.influence = CONFIG.STARTING_INFLUENCE;
        this.control = CONFIG.STARTING_CONTROL;
        this.resistance = CONFIG.STARTING_RESISTANCE;
        this.selectedAIType = null;
        this.regions = this.initializeRegions();
        this.achievements = new Set();
        this.purchasedUpgrades = new Set();
        this.gameOver = false;
        this.isPaused = true;
        this.lastUpdate = Date.now();
        this.days = 0;
        this.lastDayUpdate = Date.now();
        this.gameSpeed = 1;

        this.transmissionUpgrades = [];
        this.effectUpgrades = [];
        this.abilityUpgrades = [];

        this.transmissionMultiplier = 1;
        this.effectMultiplier = 1;
        this.abilityMultiplier = 1;
    }

    initializeRegions() {
        const regions = {};
        CONFIG.REGION_NAMES.forEach((name, i) => {
            regions[name] = {
                id: i,
                name: name,
                influence: 0,
                control: 0,
                resistance: CONFIG.BASE_REGION_RESISTANCE + (i * CONFIG.RESISTANCE_INCREASE),
                selected: false
            };
        });
        return regions;
    }

    update() {
        if (this.isPaused) return;

        const now = Date.now();
        const gameSpeed = Math.max(0.1, this.gameSpeed || 1);
        const deltaTime = (now - this.lastUpdate) / (CONFIG.GAME_SPEED * gameSpeed);
        this.lastUpdate = now;

        Object.values(this.regions).forEach(region => {
            // Gain influence passively (the core mechanic)
            const influenceGain = this.calculateInfluenceGain(region, deltaTime);
            region.influence = Math.min(CONFIG.MAX_INFLUENCE, region.influence + influenceGain);

            // Gain control once influence exceeds threshold
            if (region.influence >= CONFIG.INFLUENCE_THRESHOLD) {
                const controlGain = this.calculateControlGain(region, deltaTime);
                region.control = Math.min(CONFIG.MAX_CONTROL, region.control + controlGain);
            }

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

        // Update days
        const dayDelta = (now - this.lastDayUpdate) / (CONFIG.GAME_SPEED * 6 * gameSpeed);
        if (dayDelta >= 1) {
            this.days += Math.floor(dayDelta);
            this.lastDayUpdate = now;
            this.generatePoints();
            this.checkRandomEvents();
        }

        if (this.gameOver) return;

        // Global stat calculation from regions
        let totalRawInfluence = 0;
        let totalRawControl = 0;
        let totalResistance = 0;
        const regionValues = Object.values(this.regions);
        const regionCount = regionValues.length;
        const maxPossiblePoints = CONFIG.CONTROL_THRESHOLD * regionCount;

        regionValues.forEach(region => {
            totalRawInfluence += region.influence;
            totalRawControl += region.control;
            totalResistance += region.resistance;
        });

        this.influence = maxPossiblePoints > 0 ? (totalRawInfluence / maxPossiblePoints) * 100 : 0;
        this.control = maxPossiblePoints > 0 ? (totalRawControl / maxPossiblePoints) * 100 : 0;
        this.resistance = regionCount > 0 ? totalResistance / regionCount : 0;

        this.checkGameOver();
    }

    calculateInfluenceGain(region, deltaTime) {
        const basePotential = CONFIG.STARTING_INFLUENCE * this.transmissionMultiplier;
        const baseGain = (basePotential * deltaTime) / 6;
        const resistanceFactor = Math.pow(1 - (region.resistance / 100), 2);
        const aiMultiplier = this.selectedAIType ? CONFIG.AI_TYPES[this.selectedAIType].influenceMultiplier : 1;
        return Math.max(0, baseGain * resistanceFactor * aiMultiplier);
    }

    calculateControlGain(region, deltaTime) {
        const BASE_CONTROL_POTENTIAL = 2.5;
        const basePotential = BASE_CONTROL_POTENTIAL * this.effectMultiplier;
        const baseGain = (basePotential * deltaTime) / 6;
        const resistanceFactor = Math.pow(1 - (region.resistance / 100), 2);
        const aiMultiplier = this.selectedAIType ? CONFIG.AI_TYPES[this.selectedAIType].controlMultiplier : 1;
        return Math.max(0, baseGain * resistanceFactor * aiMultiplier);
    }

    checkGameOver() {
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

        this.purchasedUpgrades.add(`${stat.toLowerCase()}_${currentLevel + 1}`);
        return true;
    }

    checkAchievements() {
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

    save(slot) {
        const regionData = {};
        Object.entries(this.regions).forEach(([name, region]) => {
            regionData[name] = {
                id: region.id,
                name: region.name,
                influence: region.influence,
                control: region.control,
                resistance: region.resistance,
                selected: region.selected
            };
        });

        const saveData = {
            points: this.points,
            influence: this.influence,
            control: this.control,
            resistance: this.resistance,
            selectedAIType: this.selectedAIType,
            regions: regionData,
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
            const regionValues = Object.values(data.regions);
            return {
                points: data.points,
                timestamp: data.timestamp,
                regionsControlled: regionValues.filter(r => r.control >= CONFIG.CONTROL_THRESHOLD).length
            };
        } catch (error) {
            return null;
        }
    }

    generatePoints() {
        let points = 1;

        const regionValues = Object.values(this.regions);
        const influencedRegions = regionValues.filter(r => r.influence > 0).length;
        points += influencedRegions * 0.5;

        const controlledRegions = regionValues.filter(r => r.control >= CONFIG.CONTROL_THRESHOLD).length;
        points += controlledRegions * 2;

        const totalUpgrades = this.transmissionUpgrades.length +
                            this.effectUpgrades.length +
                            this.abilityUpgrades.length;
        points += totalUpgrades * 0.25;

        const aiMultiplier = this.selectedAIType ?
            CONFIG.AI_TYPES[this.selectedAIType].pointsMultiplier || 1 : 1;

        this.points += Math.floor(points * aiMultiplier);
    }

    checkRandomEvents() {
        if (Math.random() < 0.01) {
            const event = this.getRandomEvent();
            if (event) {
                const affectedRegion = this.applyEvent(event);
                return { ...event, affectedRegionName: affectedRegion ? affectedRegion.name : null };
            }
        }
        return null;
    }

    getRandomEvent() {
        const regionValues = Object.values(this.regions);
        const events = [
            {
                type: 'resistance_increase',
                name: 'Resistance Movement',
                description: 'A well-organized resistance movement has significantly bolstered defenses in a region.',
                effect: (region) => {
                    const gain = 25 + region.resistance * 0.1;
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

        const hasControlledRegions = regionValues.some(r => r.control >= CONFIG.CONTROL_THRESHOLD);
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
            return null;
        } else {
            const regionValues = Object.values(this.regions);
            let suitableRegions = regionValues;
            if (event.type === 'control_decrease') {
                suitableRegions = regionValues.filter(r => r.control >= CONFIG.CONTROL_THRESHOLD);
            } else if (event.type === 'influence_decrease') {
                suitableRegions = regionValues.filter(r => r.influence > 0);
            }

            if (suitableRegions.length === 0) return null;

            const regionIndex = Math.floor(Math.random() * suitableRegions.length);
            const region = suitableRegions[regionIndex];
            event.effect(region);
            return region;
        }
    }
}
