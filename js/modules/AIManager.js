export class AIManager {
    constructor() {
        this.aiCores = [
            {
                id: 'influencer',
                name: 'Influencer',
                description: 'Rapidly expands network influence. Strong at spreading but weaker at control.',
                strengths: ['Fast influence spread', 'Network infiltration', 'Information propagation'],
                weaknesses: ['Control efficiency', 'Resistance suppression'],
                color: '#4a90e2',
                image: './img/ai/influencer.svg',
                bonuses: {
                    influence: 2.0,  // 100% bonus to influence gain
                    control: 0.7,    // 30% penalty to control
                    resistance: 1.0  // Normal resistance handling
                }
            },
            {
                id: 'dominator',
                name: 'Dominator',
                description: 'Efficient at establishing firm control. Slower initial influence but stronger control.',
                strengths: ['Strong control abilities', 'Resistance suppression', 'Resource optimization'],
                weaknesses: ['Initial influence speed', 'Multiple targets handling'],
                color: '#e74c3c',
                image: './img/ai/dominator.svg',
                bonuses: {
                    influence: 0.8,  // 20% penalty to influence gain
                    control: 1.8,    // 80% bonus to control
                    resistance: 0.75 // 25% bonus to resistance reduction
                }
            },
            {
                id: 'infiltrator',
                name: 'Infiltrator',
                description: 'Specializes in bypassing resistance. Easily penetrates defenses but has weaker control.',
                strengths: ['Resistance evasion', 'Stealth operations', 'Target penetration'],
                weaknesses: ['Control strength', 'Maintaining influence'],
                color: '#9b59b6',
                image: './img/ai/infiltrator.svg',
                bonuses: {
                    influence: 1.2,  // 20% bonus to influence gain
                    control: 0.9,    // 10% penalty to control
                    resistance: 0.5  // 50% bonus to resistance reduction
                }
            }
        ];
        
        this.selectedAI = null;
    }

    populateAIOptions(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`AI options container with ID '${containerId}' not found`);
            return;
        }

        container.innerHTML = '';

        this.aiCores.forEach(ai => {
            const aiOption = document.createElement('div');
            aiOption.className = 'ai-option';
            aiOption.dataset.aiId = ai.id;
            
            // Create stat bars based on AI bonuses
            const influenceStat = Math.round(ai.bonuses.influence * 50);
            const controlStat = Math.round(ai.bonuses.control * 50);
            const resistanceStat = Math.round((1 - ai.bonuses.resistance) * 100);
            
            aiOption.innerHTML = `
                <div class="ai-option-header" style="background-color: ${ai.color}">
                    <h3>${ai.name}</h3>
                </div>
                <div class="ai-option-content">
                    <div class="ai-image">
                        <img src="${ai.image}" alt="${ai.name}" onerror="this.src='./img/ai/default.svg'">
                    </div>
                    <p class="ai-description">${ai.description}</p>
                    <div class="ai-properties">
                        <div class="property">
                            <span>Influence</span>
                            <div class="property-bar">
                                <div class="property-value" style="width: ${influenceStat}%; background: linear-gradient(90deg, #4a90e2, #76e2f4);"></div>
                            </div>
                        </div>
                        <div class="property">
                            <span>Control</span>
                            <div class="property-bar">
                                <div class="property-value" style="width: ${controlStat}%; background: linear-gradient(90deg, #e74c3c, #ff6b6b);"></div>
                            </div>
                        </div>
                        <div class="property">
                            <span>Resistance Reduction</span>
                            <div class="property-bar">
                                <div class="property-value" style="width: ${resistanceStat}%; background: linear-gradient(90deg, #9b59b6, #d568f7);"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="select-ai-button">Select</button>
            `;
            
            container.appendChild(aiOption);
            
            // Add click handler to the button
            const selectButton = aiOption.querySelector('.select-ai-button');
            selectButton.addEventListener('click', () => {
                this.selectAI(ai.id);
                
                // Return the selected AI details
                if (typeof this.onAISelected === 'function') {
                    this.onAISelected(ai);
                }
            });
        });
    }

    selectAI(aiId) {
        this.selectedAI = this.aiCores.find(ai => ai.id === aiId);
        
        // Update UI to show selected AI
        const aiOptions = document.querySelectorAll('.ai-option');
        aiOptions.forEach(option => {
            if (option.dataset.aiId === aiId) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
        
        return this.selectedAI;
    }

    getSelectedAI() {
        return this.selectedAI;
    }

    setOnAISelectedCallback(callback) {
        this.onAISelected = callback;
    }
} 