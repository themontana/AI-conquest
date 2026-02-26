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
            this.state = new GameState();
            await this.loadSounds();
            this.startGameLoop();
            console.log('Game initialization complete');
        } catch (error) {
            console.error('Error during game initialization:', error);
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
            this.sounds[soundKey].play().catch(() => {});
        }
    }

    startGameLoop() {
        if (this.gameLoop) return;

        this.gameLoop = setInterval(() => {
            if (!this.state.isPaused) {
                this.state.update();

                const newAchievements = this.state.checkAchievements();
                if (newAchievements && newAchievements.length > 0) {
                    newAchievements.forEach(achievement => {
                        if (this.ui) {
                            this.ui.showAchievement(achievement);
                        }
                        this.showMessage(`Achievement unlocked: ${achievement.name}`);
                    });
                }

                if (this.state.gameOver) {
                    this.stopGameLoop();
                    if (this.ui) {
                        this.ui.showGameOver();
                    }
                }

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

    showMessage(message) {
        if (this.ui && this.ui.elements && this.ui.elements.messageLog) {
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            messageElement.textContent = message;
            this.ui.elements.messageLog.appendChild(messageElement);
            this.ui.elements.messageLog.scrollTop = this.ui.elements.messageLog.scrollHeight;
            setTimeout(() => {
                messageElement.remove();
            }, 3000);
        } else {
            const messageLog = document.getElementById('message-log');
            if (messageLog) {
                const p = document.createElement('p');
                p.textContent = message;
                messageLog.appendChild(p);
                messageLog.scrollTop = messageLog.scrollHeight;
                setTimeout(() => p.remove(), 5000);
            }
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

    getRegionStatus(regionName) {
        const region = this.state.regions[regionName];
        if (!region) return null;

        return {
            ...region,
            isInfluenced: region.influence >= CONFIG.INFLUENCE_THRESHOLD,
            isControlled: region.control >= CONFIG.CONTROL_THRESHOLD,
            influencePercent: (region.influence / CONFIG.MAX_INFLUENCE) * 100,
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
            this.state.save(slot || 1);
            this.showMessage(`Game saved to slot ${slot || 1}`);
            return true;
        } catch (error) {
            console.error('Error saving game:', error);
            this.showMessage('Error saving game');
            return false;
        }
    }

    loadGame(slot) {
        try {
            if (this.state.load(slot || 1)) {
                this.showMessage(`Game loaded from slot ${slot || 1}`);
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

    getTutorialStep(step) {
        return CONFIG.TUTORIAL_STEPS[step];
    }

    getTutorialStepCount() {
        return Object.keys(CONFIG.TUTORIAL_STEPS).length;
    }

    getState() {
        return this.state;
    }
}

export default GameLogic;
