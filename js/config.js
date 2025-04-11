// Game Configuration
export const CONFIG = {
    // Game Settings
    TICK_INTERVAL: 1000, // 1 second
    POINTS_PER_TICK: 1,
    INFLUENCE_PER_TICK: 0.1,
    CONTROL_PER_TICK: 0.05,
    RESISTANCE_PER_TICK: 0.02,
    RESISTANCE_GROWTH_RATE: 0.01,
    MAX_INFLUENCE: 100,
    MAX_CONTROL: 100,
    MAX_RESISTANCE: 100,
    UPGRADE_MULTIPLIER: 0.1, // 10% increase per upgrade
    INITIAL_POINTS: 100,
    INITIAL_RESISTANCE: 50,
    INFLUENCE_DECAY: 0.1,
    CONTROL_DECAY: 0.1,
    RESISTANCE_GROWTH: 0.2,
    INFLUENCE_THRESHOLD: 50,
    CONTROL_THRESHOLD: 75,
    SAVE_KEY_PREFIX: 'ai_conquest_save_',
    SAVE_SLOTS: 3,

    // Map Settings
    MAP_WIDTH: 800,
    MAP_HEIGHT: 400,
    MAP_BACKGROUND: '#1a1a1a',
    COUNTRY_COLORS: {
        neutral: '#2a2a2a',
        influenced: '#4a4a4a',
        controlled: '#6a6a6a',
        hover: '#8a8a8a'
    },

    // Countries by Continent
    COUNTRIES: {
        'North America': [
            { name: 'United States', code: 'US', coordinates: { x: 30, y: 20 } },
            { name: 'Canada', code: 'CA', coordinates: { x: 25, y: 10 } },
            { name: 'Mexico', code: 'MX', coordinates: { x: 20, y: 30 } }
        ],
        'South America': [
            { name: 'Brazil', code: 'BR', coordinates: { x: 40, y: 60 } },
            { name: 'Argentina', code: 'AR', coordinates: { x: 35, y: 80 } },
            { name: 'Chile', code: 'CL', coordinates: { x: 30, y: 85 } }
        ],
        'Europe': [
            { name: 'United Kingdom', code: 'GB', coordinates: { x: 45, y: 25 } },
            { name: 'France', code: 'FR', coordinates: { x: 48, y: 30 } },
            { name: 'Germany', code: 'DE', coordinates: { x: 50, y: 28 } }
        ],
        'Africa': [
            { name: 'South Africa', code: 'ZA', coordinates: { x: 55, y: 80 } },
            { name: 'Egypt', code: 'EG', coordinates: { x: 55, y: 35 } },
            { name: 'Nigeria', code: 'NG', coordinates: { x: 50, y: 50 } }
        ],
        'Asia': [
            { name: 'China', code: 'CN', coordinates: { x: 75, y: 35 } },
            { name: 'India', code: 'IN', coordinates: { x: 70, y: 40 } },
            { name: 'Japan', code: 'JP', coordinates: { x: 85, y: 30 } }
        ],
        'Oceania': [
            { name: 'Australia', code: 'AU', coordinates: { x: 85, y: 70 } },
            { name: 'New Zealand', code: 'NZ', coordinates: { x: 90, y: 80 } }
        ],
        'Antarctica': [
            { name: 'Antarctica', code: 'AQ', coordinates: { x: 50, y: 95 } }
        ]
    },

    // Region Settings
    REGION_COUNT: 7,
    BASE_REGION_RESISTANCE: 5,
    RESISTANCE_INCREASE: 2,
    PASSIVE_RESISTANCE_GAIN_RATE: 0.05,
    ACTIVE_RESISTANCE_GAIN_RATE: 0.15,

    // Region Names
    REGION_NAMES: [
        'North America',
        'South America',
        'Europe',
        'Africa',
        'Asia',
        'Oceania',
        'Antarctica'
    ],

    // AI Types
    AI_TYPES: {
        aggressive: {
            name: 'Aggressive AI',
            description: 'Focuses on rapid expansion and control',
            influenceMultiplier: 1.5,
            controlMultiplier: 1.8,
            resistanceMultiplier: 0.7,
            pointsMultiplier: 1.2
        },
        stealth: {
            name: 'Stealth AI',
            description: 'Specializes in covert operations and resistance',
            influenceMultiplier: 1.2,
            controlMultiplier: 0.8,
            resistanceMultiplier: 1.6,
            pointsMultiplier: 1.3
        },
        adaptive: {
            name: 'Adaptive AI',
            description: 'Dynamically adjusts to changing conditions',
            influenceMultiplier: 1.3,
            controlMultiplier: 1.3,
            resistanceMultiplier: 1.3,
            pointsMultiplier: 1.1
        }
    },

    // Upgrade Settings
    TRANSMISSION_UPGRADES: [
        {
            id: 't1',
            name: 'Basic Transmission',
            cost: 10,
            multiplier: 0.1,
            effect: 'Increase influence by 10%'
        },
        {
            id: 't2',
            name: 'Advanced Transmission',
            cost: 25,
            multiplier: 0.2,
            effect: 'Increase influence by 20%'
        },
        {
            id: 't3',
            name: 'Elite Transmission',
            cost: 50,
            multiplier: 0.3,
            effect: 'Increase influence by 30%'
        }
    ],

    EFFECT_UPGRADES: [
        {
            id: 'e1',
            name: 'Basic Effect',
            cost: 15,
            multiplier: 0.1,
            effect: 'Increase control by 10%'
        },
        {
            id: 'e2',
            name: 'Advanced Effect',
            cost: 35,
            multiplier: 0.2,
            effect: 'Increase control by 20%'
        },
        {
            id: 'e3',
            name: 'Elite Effect',
            cost: 60,
            multiplier: 0.3,
            effect: 'Increase control by 30%'
        }
    ],

    ABILITY_UPGRADES: [
        {
            id: 'a1',
            name: 'Basic Ability',
            cost: 20,
            multiplier: 0.1,
            effect: 'Decrease resistance by 10%'
        },
        {
            id: 'a2',
            name: 'Advanced Ability',
            cost: 40,
            multiplier: 0.2,
            effect: 'Decrease resistance by 20%'
        },
        {
            id: 'a3',
            name: 'Elite Ability',
            cost: 70,
            multiplier: 0.3,
            effect: 'Decrease resistance by 30%'
        }
    ],

    // Upgrade Costs
    UPGRADE_COSTS: {
        INFLUENCE: [50, 100, 200, 400, 800],
        CONTROL: [100, 200, 400, 800, 1600],
        RESISTANCE: [75, 150, 300, 600, 1200]
    },

    // Achievement Requirements
    ACHIEVEMENTS: {
        'first_influence': {
            name: 'First Influence',
            description: 'Gain influence in your first region',
            condition: (gameState) => Object.values(gameState.regions).some(region => region.influence > 0)
        },
        'first_control': {
            name: 'First Control',
            description: 'Gain control of your first region',
            condition: (gameState) => Object.values(gameState.regions).some(region => region.control >= CONFIG.CONTROL_THRESHOLD)
        },
        'global_influence': {
            name: 'Global Influence',
            description: 'Have influence in all regions',
            condition: (gameState) => Object.values(gameState.regions).every(region => region.influence > 0)
        },
        'global_control': {
            name: 'World Domination',
            description: 'Control all regions',
            condition: (gameState) => Object.values(gameState.regions).every(region => region.control >= CONFIG.CONTROL_THRESHOLD)
        },
        'resistance_master': {
            name: 'Resistance Master',
            description: 'Overcome maximum resistance in a region',
            condition: (gameState) => Object.values(gameState.regions).some(region => region.resistance >= CONFIG.MAX_RESISTANCE)
        },
        'upgrade_master': {
            name: 'Upgrade Master',
            description: 'Purchase all upgrades',
            condition: (gameState) => {
                const totalUpgrades = CONFIG.TRANSMISSION_UPGRADES.length + 
                                    CONFIG.EFFECT_UPGRADES.length + 
                                    CONFIG.ABILITY_UPGRADES.length;
                return gameState.purchasedUpgrades.size >= totalUpgrades;
            }
        }
    },

    // Sound Effects
    SOUNDS: {
        CLICK: 'sounds/click.mp3',
        UPGRADE: 'sounds/upgrade.mp3',
        ACHIEVEMENT: 'sounds/achievement.mp3',
        REGION_INFLUENCED: 'sounds/region_influenced.mp3',
        REGION_CONTROLLED: 'sounds/region_controlled.mp3',
        GAME_OVER: 'sounds/game_over.mp3',
        START: 'sounds/start.mp3'
    },

    // Tutorial Steps
    TUTORIAL_STEPS: {
        1: {
            title: 'Welcome to AI Conquest',
            text: 'You are an advanced AI seeking global domination. Your goal is to influence and control regions around the world.'
        },
        2: {
            title: 'Choosing Your AI Type',
            text: 'Select an AI type that matches your strategy: Aggressive for quick expansion, Stealth for subtle control, or Adaptive for balanced growth.'
        },
        3: {
            title: 'Understanding the Map',
            text: 'The world map shows all regions. Each region has influence (blue), control (green), and resistance (red) levels.'
        },
        4: {
            title: 'Managing Resources',
            text: 'Points are your main resource. Use them to purchase upgrades that enhance your AI\'s capabilities.'
        },
        5: {
            title: 'Upgrading Your AI',
            text: 'Three types of upgrades are available: Transmission (influence), Effects (control), and Abilities (resistance).'
        },
        6: {
            title: 'Achieving Victory',
            text: 'Win by controlling all regions. Each region controlled increases your point generation and overall power.'
        }
    }
}; 