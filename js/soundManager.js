export class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.5;
        this.loadSounds();
    }

    loadSounds() {
        const soundFiles = {
            CLICK: 'sounds/click.mp3',
            UPGRADE: 'sounds/upgrade.mp3',
            ACHIEVEMENT: 'sounds/achievement.mp3',
            REGION_INFLUENCED: 'sounds/influence.mp3',
            REGION_CONTROLLED: 'sounds/control.mp3',
            GAME_OVER: 'sounds/gameover.mp3',
            START: 'sounds/start.mp3'
        };

        // Create a fallback audio context for generating sounds when files are missing
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported, sounds will be disabled');
            this.enabled = false;
            return;
        }

        Object.entries(soundFiles).forEach(([key, path]) => {
            // Try to load the sound file
            const audio = new Audio();
            audio.volume = this.volume;
            
            audio.onerror = () => {
                console.warn(`Sound file ${path} not found, using fallback sound`);
                // Don't store the failed Audio object
                this.sounds[key] = null;
            };
            
            audio.src = path;
            this.sounds[key] = audio;
        });
    }

    createFallbackSound(type) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Different sound characteristics for different types
        switch(type) {
            case 'CLICK':
                oscillator.frequency.value = 440; // A4 note
                gainNode.gain.value = 0.1;
                oscillator.type = 'sine';
                return { oscillator, gainNode, duration: 0.1 };
            case 'UPGRADE':
                oscillator.frequency.value = 880; // A5 note
                gainNode.gain.value = 0.1;
                oscillator.type = 'sine';
                return { oscillator, gainNode, duration: 0.2 };
            case 'ACHIEVEMENT':
                oscillator.frequency.value = 660; // E5 note
                gainNode.gain.value = 0.1;
                oscillator.type = 'triangle';
                return { oscillator, gainNode, duration: 0.3 };
            case 'REGION_INFLUENCED':
                oscillator.frequency.value = 550; // C#5 note
                gainNode.gain.value = 0.1;
                oscillator.type = 'sine';
                return { oscillator, gainNode, duration: 0.15 };
            case 'REGION_CONTROLLED':
                oscillator.frequency.value = 770; // G5 note
                gainNode.gain.value = 0.1;
                oscillator.type = 'square';
                return { oscillator, gainNode, duration: 0.2 };
            case 'GAME_OVER':
                oscillator.frequency.value = 220; // A3 note
                gainNode.gain.value = 0.1;
                oscillator.type = 'sawtooth';
                return { oscillator, gainNode, duration: 0.5 };
            case 'START':
                oscillator.frequency.value = 880; // A5 note
                gainNode.gain.value = 0.1;
                oscillator.type = 'triangle';
                return { oscillator, gainNode, duration: 0.3 };
            default:
                oscillator.frequency.value = 440;
                gainNode.gain.value = 0.1;
                oscillator.type = 'sine';
                return { oscillator, gainNode, duration: 0.1 };
        }
    }

    playSound(soundKey) {
        if (!this.enabled) return;

        const sound = this.sounds[soundKey];
        if (sound && sound.play) {
            // If we have the audio file, play it
            const clone = sound.cloneNode();
            clone.volume = this.volume;
            clone.play().catch(error => {
                console.warn(`Failed to play sound ${soundKey}, using fallback:`, error);
                this.playFallbackSound(soundKey);
            });
        } else {
            // If no audio file, use fallback sound
            this.playFallbackSound(soundKey);
        }
    }

    playFallbackSound(type) {
        if (!this.audioContext) return;

        const sound = this.createFallbackSound(type);
        if (!sound) return;

        const { oscillator, gainNode, duration } = sound;
        const now = this.audioContext.currentTime;

        // Fade out to prevent clicks
        gainNode.gain.setValueAtTime(this.volume * 0.1, now);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(sound => {
            if (sound && sound.volume !== undefined) {
                sound.volume = this.volume;
            }
        });
    }

    toggleSound() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// Create a singleton instance
const soundManager = new SoundManager();
export default soundManager; 