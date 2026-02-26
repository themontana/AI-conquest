import { CONFIG } from './config.js';

constructor(gameState) {
    this.state = gameState;
    this.selectedCountry = null;
    this.influenceProgress = {};
    this.controlProgress = {};
    this.eventListeners = {};
    this.init();
}

init() {
    // Initialize progress trackers for each country
    Object.keys(CONFIG.COUNTRIES).forEach(code => {
        this.influenceProgress[code] = 0;
        this.controlProgress[code] = 0;
    });
}

selectCountry(country) {
    this.selectedCountry = country;
    this.emit('countrySelected', country);
}

applyUpgrade(upgrade) {
    if (!this.selectedCountry || this.state.points < upgrade.cost) return false;
    
    this.state.points -= upgrade.cost;
    
    // Apply upgrade to selected country
    this.applyUpgradeToCountry(this.selectedCountry, upgrade);
    
    // 30% chance for upgrade to spread to each neighbor
    const neighbors = this.getNeighboringCountries(this.selectedCountry);
    neighbors.forEach(neighbor => {
        if (Math.random() < 0.3) { // 30% chance
            this.applyUpgradeToCountry(neighbor, {
                ...upgrade,
                multiplier: upgrade.multiplier * 0.5 // 50% effectiveness for neighbors
            });
        }
    });
    
    return true;
}

applyUpgradeToCountry(country, upgrade) {
    const stats = this.countries[country.code];
    
    switch(upgrade.type) {
        case 'influence':
            stats.influence = Math.min(100, stats.influence + (upgrade.multiplier * 100));
            break;
        case 'control':
            stats.control = Math.min(100, stats.control + (upgrade.multiplier * 100));
            break;
        case 'resistance':
            stats.resistance = Math.max(0, stats.resistance - (upgrade.multiplier * 100));
            break;
    }

    this.checkProgressMilestones(country.code, stats);
    this.emit('countryUpdate', { code: country.code, ...stats });
}

getNeighboringCountries(country) {
    // Simple distance-based neighbor detection
    const MAX_DISTANCE = 20; // degrees
    const neighbors = [];
    
    Object.entries(CONFIG.COUNTRIES).forEach(([code, other]) => {
        if (code === country.code) return;
        
        const distance = this.calculateDistance(
            country.coordinates.lat,
            country.coordinates.lng,
            other.coordinates.lat,
            other.coordinates.lng
        );
        
        if (distance <= MAX_DISTANCE) {
            neighbors.push({ code, ...other });
        }
    });
    
    return neighbors;
}

calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    
    return d / 111; // Convert to degrees (roughly)
}

deg2rad(deg) {
    return deg * (Math.PI/180);
}

checkProgressMilestones(countryCode, stats) {
    // Check influence progress
    const influenceLevel = Math.floor(stats.influence / CONFIG.POINTS_THRESHOLD);
    if (influenceLevel > this.influenceProgress[countryCode]) {
        this.state.points += (influenceLevel - this.influenceProgress[countryCode]);
        this.influenceProgress[countryCode] = influenceLevel;
    }

    // Check control progress
    const controlLevel = Math.floor(stats.control / CONFIG.POINTS_THRESHOLD);
    if (controlLevel > this.controlProgress[countryCode]) {
        this.state.points += (controlLevel - this.controlProgress[countryCode]);
        this.controlProgress[countryCode] = controlLevel;
    }

    this.emit('pointsUpdate', this.state.points);
}

updateUpgradeUI() {
    if (!this.selectedCountry) return;

    const availableUpgrades = this.getAvailableUpgrades(this.selectedCountry.code);
    
    // Update transmission upgrades
    const transmissionContainer = document.getElementById('transmission-upgrades');
    transmissionContainer.innerHTML = '';
    availableUpgrades.transmissions.forEach(upgrade => {
        const button = document.createElement('button');
        button.className = 'upgrade-button';
        button.innerHTML = `
            <div class="upgrade-name">${upgrade.name}</div>
            <div class="upgrade-cost">${upgrade.cost} points</div>
            <div class="upgrade-effect">${upgrade.effect}</div>
        `;
        button.onclick = () => this.upgradeTransmission(upgrade.id);
        transmissionContainer.appendChild(button);
    });

    // Update effect upgrades
    const effectContainer = document.getElementById('effect-upgrades');
    effectContainer.innerHTML = '';
    availableUpgrades.effects.forEach(upgrade => {
        const button = document.createElement('button');
        button.className = 'upgrade-button';
        button.innerHTML = `
            <div class="upgrade-name">${upgrade.name}</div>
            <div class="upgrade-cost">${upgrade.cost} points</div>
            <div class="upgrade-effect">${upgrade.effect}</div>
        `;
        button.onclick = () => this.upgradeEffect(upgrade.id);
        effectContainer.appendChild(button);
    });

    // Update ability upgrades
    const abilityContainer = document.getElementById('ability-upgrades');
    abilityContainer.innerHTML = '';
    availableUpgrades.abilities.forEach(upgrade => {
        const button = document.createElement('button');
        button.className = 'upgrade-button';
        button.innerHTML = `
            <div class="upgrade-name">${upgrade.name}</div>
            <div class="upgrade-cost">${upgrade.cost} points</div>
            <div class="upgrade-effect">${upgrade.effect}</div>
        `;
        button.onclick = () => this.upgradeAbility(upgrade.id);
        abilityContainer.appendChild(button);
    });
}

updateCountryUI() {
    if (!this.selectedCountry) return;

    const country = this.countries[this.selectedCountry.code];
    if (!country) return;

    // Update country stats
    document.getElementById('country-name').textContent = this.selectedCountry.name;
    document.getElementById('country-influence').textContent = `${country.influence.toFixed(1)}%`;
    document.getElementById('country-control').textContent = `${country.control.toFixed(1)}%`;
    document.getElementById('country-resistance').textContent = `${country.resistance.toFixed(1)}%`;

    // Update upgrade UI
    this.updateUpgradeUI();
} 