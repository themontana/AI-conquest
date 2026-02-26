export class UIManager {
    constructor() {
        this.elements = new Map();
        this.initializeElements();
    }

    initializeElements() {
        // Cache commonly used DOM elements
        const elements = {
            resources: document.getElementById('resources'),
            events: document.getElementById('events'),
            countryInfo: document.getElementById('country-info'),
            actions: document.getElementById('actions')
        };

        Object.entries(elements).forEach(([key, element]) => {
            if (element) {
                this.elements.set(key, element);
            }
        });
    }

    updateResources(resources) {
        const resourcesElement = this.elements.get('resources');
        if (resourcesElement) {
            resourcesElement.innerHTML = `
                <div>Money: $${resources.money}</div>
                <div>Influence: ${resources.influence}</div>
                <div>Research: ${resources.research}</div>
            `;
        }
    }

    updateCountryInfo(country) {
        const countryInfoElement = this.elements.get('countryInfo');
        if (countryInfoElement && country) {
            countryInfoElement.innerHTML = `
                <h2>${country.name}</h2>
                <div>Influence: ${country.influence}%</div>
                <div>Control: ${country.control}%</div>
                <div>Resistance: ${country.resistance}%</div>
            `;
        }
    }

    addEvent(event) {
        const eventsElement = this.elements.get('events');
        if (eventsElement) {
            const eventElement = document.createElement('div');
            eventElement.className = 'event';
            eventElement.textContent = event.message;
            eventsElement.prepend(eventElement);
            
            // Remove old events if too many
            while (eventsElement.children.length > 10) {
                eventsElement.removeChild(eventsElement.lastChild);
            }
        }
    }

    updateActions(actions) {
        const actionsElement = this.elements.get('actions');
        if (actionsElement) {
            actionsElement.innerHTML = actions.map(action => `
                <button onclick="${action.onclick}">
                    ${action.name} (Cost: ${action.cost})
                </button>
            `).join('');
        }
    }
} 