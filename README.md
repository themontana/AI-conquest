# AI Conquest

## Overview

AI Conquest is a web-based strategy game where the player takes on the role of an Artificial Intelligence aiming for global domination. The player manages resources, influences countries, counters resistance, and upgrades their capabilities to achieve control over the world.

## Game Goal

The primary objective is to achieve world domination by spreading influence and control across all countries on the world map while managing global resistance.

## Gameplay Elements

*   **World Map:** Interact with countries on a global map.
*   **Stats:** Track global and country-specific statistics like Influence, Control, Resistance, Population, and GDP.
*   **Upgrades:** Enhance the AI's capabilities through Transmission, Effects, and Abilities. Upgrades cost points (typically 1-5 points) and provide various bonuses or unlock new mechanics.
*   **AI Core Selection:** Choose a specific type of AI at the start, likely influencing gameplay mechanics.
*   **Progression:** Manage time, earn points, and potentially unlock achievements. Points are earned primarily by increasing Influence and Control within countries past 10% milestones (e.g., reaching 10%, 20%, 30% Influence or Control in a country grants points).
*   **Random Events:** Periodically, random events will occur, presented as popups. These events, defined in `js/config.js`, can be beneficial or detrimental, impacting global stats, country stats, or player points. Event logic is handled in `js/gameLogic.js` and displayed via `js/ui.js`. Events are designed to fit the game's theme and progression, adding unpredictability.

## Upgrades System

The upgrade system allows the AI to enhance its capabilities over time. Upgrades are purchased per country using points when a country is selected.

*   **Categories:** Upgrades are divided into three main categories, likely found in `js/config.js`:
    *   **Transmission:** Focuses on spreading influence (e.g., 'Deep Web Nodes', 'Social Media Presence').
    *   **Effects:** Provides passive bonuses or alters game mechanics (e.g., 'Propaganda Machine', 'Mass Surveillance').
    *   **Abilities:** Unlocks active capabilities or provides significant advantages (e.g., 'Rapid Response Team', 'Counter-Intelligence').
*   **Costs:** Each upgrade has a point cost, defined in `js/config.js`.
*   **Prerequisites:** Some upgrades require other upgrades to be purchased first in the *same country*. These dependencies are also defined in the configuration.
*   **Effects:** Upgrades provide various benefits, such as increasing influence/control gain rate, reducing resistance, bypassing resistance, or providing instant bonuses to stats. The specific effects are applied by the `upgradeTransmission`, `upgradeEffect`, and `upgradeAbility` functions in `js/gameLogic.js`.
*   **UI:** The UI (`js/ui.js`) displays available upgrades for the selected country in separate tabs. It handles prerequisites and affordability checks, enabling/disabling purchase buttons accordingly. Purchased upgrades are moved to the bottom of their respective lists.

## Project Structure

*   `index.html`: The main entry point for the game's frontend.
*   `style.css`: Contains the styling for the game interface.
*   `js/`: Directory containing the core JavaScript game logic (e.g., `main.js`).
*   `img/`: Contains image assets for the game.
*   `sounds/`: Contains sound assets for the game.
*   `flags/`: Likely contains flag images for different countries.
*   `server.js`: A simple Node.js server to host the game locally.
*   `package.json` / `package-lock.json`: Node.js project configuration and dependencies (primarily for the server).

## Running the Game

1.  Ensure Node.js is installed.
2.  Run `npm install` in the project root directory to install dependencies (for the server).
3.  Run `node server.js`.
4.  Open a web browser and navigate to the URL provided (e.g., `http://localhost:8000`).

## Developer Note

**Important:** Before making significant changes, especially to core logic in files like `js/main.js`, `js/gameLogic.js`, `js/ui.js`, or `js/config.js`, please ensure you have analyzed the potential impact across the entire codebase. Interactions between different modules (e.g., state changes triggering UI updates, config values affecting logic) can be complex. A thorough understanding is crucial to avoid unintended side effects.

*(This README will be updated as the project evolves. Recent changes include adding more upgrades, adjusting costs, changing the point generation mechanism, and implementing a random event system.)* 