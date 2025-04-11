import { GameLogic } from './gameLogic.js';
import { UI } from './ui.js';
import { CONFIG } from './config.js';

console.log('main.js loaded');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize game logic
    const gameLogic = new GameLogic();
    
    // Initialize UI
    const ui = new UI(gameLogic);
    gameLogic.setUI(ui);
    
    // Initialize game
    gameLogic.initializeGame().catch(error => {
        console.error('Failed to initialize game:', error);
        alert('Failed to initialize game. Please refresh the page.');
    });
    
    // Add window resize handler
    window.addEventListener('resize', () => {
        if (ui.worldMap) {
            ui.worldMap.init();
        }
    });
}); 