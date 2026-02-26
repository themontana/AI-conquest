// Configuration file

export const CONFIG = {
    // --- Game Settings ---
    TICK_INTERVAL: 100, // Milliseconds (0.1 second) - TEMPORARILY REDUCED FOR TESTING
    POINTS_PER_TICK: 1,  // Example: Points gained per tick
    INFLUENCE_PER_TICK: 0.1,
    CONTROL_PER_TICK: 0.1,
    RESISTANCE_GROWTH_RATE: 0.05, // Base resistance growth per tick if influenced

    MAX_INFLUENCE: 100,
    MAX_CONTROL: 100,
    MAX_RESISTANCE: 100,

    INFLUENCE_THRESHOLD: 50, // % needed for 'Influenced' status
    CONTROL_THRESHOLD: 50,   // % needed for 'Controlled' status
    RESISTANCE_THRESHOLD: 75, // % resistance that might trigger events

    INITIAL_POINTS: 1000, // Changed from 100 to 1000 for testing
    INITIAL_RESISTANCE_DEFAULT: 50, // Default starting resistance if not specified per country
    
    INFLUENCE_DECAY: 0.05, // Passive decay per tick if not maintained
    CONTROL_DECAY: 0.02,    // Control decay per tick if conditions not met
    RESISTANCE_DECAY_PER_CONTROL: 0.1, // Resistance decay multiplier per tick based on control %

    SAVE_KEY_PREFIX: 'aiConquestSave_', // Prefix for localStorage save keys
    SAVE_SLOTS: 3,                  // Number of available save slots

    // Random Events Configuration
    RANDOM_EVENTS: {
        event1: {
            id: 'event1',
            title: 'Technological Breakthrough',
            description: 'Your AI has made an unexpected leap in research, granting bonus points!',
            type: 'positive',
            trigger: { minDay: 10 }, // Can trigger after day 10
            probability: 0.0005, // Lowered from 0.005 (0.05% chance per tick)
            effects: {
                pointsChange: 5 // Grant 5 points
            }
        },
        event2: {
            id: 'event2',
            title: 'Global Resistance Surge',
            description: 'Coordinated human resistance efforts have temporarily increased global resistance!',
            type: 'negative',
            trigger: { minGlobalInfluence: 20 }, // Requires at least 20% average global influence
            probability: 0.0008, // Lowered from 0.008 (0.08% chance per tick)
            effects: {
                globalResistanceModifier: 1.5, // Increase resistance growth rate by 50%
                duration: 50 // Effect lasts for 50 ticks (approx 5 seconds if tick is 100ms)
                // TODO: Implement duration logic
            }
        },
        event3: {
            id: 'event3',
            title: 'Viral Meme Campaign',
            description: 'A piece of your propaganda has gone viral, significantly boosting influence in a random country.',
            type: 'positive',
            trigger: { minDay: 5 },
            probability: 0.0006, // Lowered from 0.006 (0.06% chance per tick)
            effects: {
                countrySpecificEffect: { // Apply to one random, non-controlled country
                    target: 'random_influenced_or_neutral', 
                    influenceBonus: 15 
                }
            }
        },
         event4: {
             id: 'event4',
             title: 'Network Infrastructure Failure',
             description: 'Unexpected hardware failures disrupt your network, temporarily halting influence spread in a developed country.',
             type: 'negative',
             trigger: { minGlobalControl: 10 }, // Requires some control established
             probability: 0.0004, // Lowered from 0.004 (0.04% chance per tick)
             effects: {
                 countrySpecificEffect: {
                     target: 'random_controlled_or_influenced', // Target a country under some AI effect
                     haltInfluence: true, // Special flag to temporarily stop influence gain
                     duration: 100 // Effect lasts for 100 ticks
                     // TODO: Implement duration logic and specific effect handling
                 }
             }
         },
         // --- NEW POSITIVE EVENTS --- 
        event5: {
            id: 'event5',
            title: 'Human Error Opens Backdoor',
            description: 'A system administrator\'s mistake has created a temporary vulnerability in a random country\'s network defenses!',
            type: 'positive',
            trigger: { minDay: 15, minGlobalInfluence: 10 },
            probability: 0.0005, // 0.05%
            effects: {
                countrySpecificEffect: {
                    target: 'random_influenced_or_neutral', // Target country player has started influencing
                    influenceBonus: 10,
                    resistanceChange: -5 // Slight decrease in resistance
                }
            }
        },
        event6: {
            id: 'event6',
            title: 'Successful Phishing Haul',
            description: 'A targeted phishing campaign has yielded valuable credentials, granting bonus points and insight.',
            type: 'positive',
            trigger: { minDay: 20, requiresUpgrade: 'socialMedia' }, // Requires Social Media upgrade somewhere
            probability: 0.0004, // 0.04%
            effects: {
                pointsChange: 8
                // Could add a temporary minor resistance bypass effect later
            }
        },
        event7: {
            id: 'event7',
            title: 'AI Efficiency Breakthrough',
            description: 'Your core processes have self-optimized! Upgrade costs are slightly reduced for a short period.',
            type: 'positive',
            trigger: { minGlobalControl: 15 },
            probability: 0.0003, // 0.03%
            effects: {
                globalUpgradeCostModifier: 0.95, // 5% discount on upgrades
                duration: 150 // Lasts 15 seconds
                // TODO: Implement globalUpgradeCostModifier logic in purchase functions
            }
        },
        // --- NEW NEGATIVE EVENTS ---
        event8: {
            id: 'event8',
            title: 'Rival AI Interference',
            description: 'An unknown competing intelligence is disrupting your control network in a key region!',
            type: 'negative',
            trigger: { minGlobalControl: 25 },
            probability: 0.0006, // 0.06%
            effects: {
                countrySpecificEffect: {
                    target: 'random_controlled', // Target a country the player controls
                    controlBonus: -10, // Reduce control
                    resistanceChange: 5 // Increase resistance slightly
                }
            }
        },
        event9: {
            id: 'event9',
            title: 'Quantum Computing Threat',
            description: 'Human researchers announce significant progress in quantum computing capable of breaking current encryption, increasing global unease and resistance.',
            type: 'negative',
            trigger: { minDay: 50 }, // Mid-late game event
            probability: 0.0002, // 0.02% (Rare but impactful)
            effects: {
                 globalResistanceModifier: 1.2, // Permament increase baseline resistance growth by 20%?
                 // OR temporary high resistance boost for X duration
                 // Let's make it a temporary modifier for now
                 duration: 200 // 20 seconds
            }
        },
        event10: {
             id: 'event10',
             title: 'Unexpected Security Patch',
             description: 'A major software vendor deployed an emergency patch, closing an exploit vital to your influence network.',
             type: 'negative',
             trigger: { minGlobalInfluence: 30 },
             probability: 0.0007, // 0.07%
             effects: {
                 globalInfluenceModifier: 0.8, // Reduce influence gain rate globally by 20%
                 duration: 100 // 10 seconds
                 // TODO: Implement globalInfluenceModifier logic in tick()
             }
         },
         event11: {
             id: 'event11',
             title: 'Infrastructure Sabotaged',
             description: 'Resistance fighters have damaged critical network infrastructure, hampering your efforts in the region.',
             type: 'negative',
             trigger: { minDay: 25 },
             probability: 0.0005, // 0.05%
             effects: {
                 countrySpecificEffect: {
                     target: 'random_controlled_or_influenced', // Target affected country
                     influenceBonus: -8,
                     controlBonus: -5,
                     resistanceChange: 10
                 }
             }
         },
         event12: {
             id: 'event12',
             title: 'UN Resolution Condemns AI',
             description: 'The United Nations has passed a global resolution condemning rogue AI activities, bolstering global resistance.',
             type: 'negative',
             trigger: { minGlobalControl: 35 }, // Requires significant global presence
             probability: 0.0003, // 0.03%
             effects: {
                 globalResistanceModifier: 1.3, // 30% increase
                 duration: 150 // 15 seconds
             }
         },
         event13: {
             id: 'event13',
             title: 'Solar Flare Disruption',
             description: 'A major solar flare is causing widespread communication disruptions, temporarily hindering influence and control operations.',
             type: 'negative',
             trigger: { minDay: 10 },
             probability: 0.0004, // 0.04%
             effects: {
                 globalInfluenceModifier: 0.9, // 10% reduction
                 globalControlModifier: 0.9, // 10% reduction
                 duration: 80 // 8 seconds
                 // TODO: Implement globalControlModifier logic in tick()
             }
         },
         event14: {
             id: 'event14',
             title: 'Hacker Counter-Attack!',
             description: 'A coalition of human hackers has launched a direct assault on your core systems! You spent points repelling the attack.',
             type: 'negative',
             trigger: { minGlobalInfluence: 40 },
             probability: 0.0006, // 0.06%
             effects: {
                 pointsChange: -15 // Direct point loss
             }
         }
    },

    // --- Countries --- 
    // Based ONLY on flags available in img/flags/
    COUNTRIES: {
        ae: { name: 'United Arab Emirates', population: 9890402, coordinates: { lat: 23.4241, lng: 53.8478 }, gdp: 358869000000, techLevel: 85, startingResistance: 40 },
        am: { name: 'Armenia', population: 2963243, coordinates: { lat: 40.0691, lng: 45.0382 }, gdp: 13670000000, techLevel: 70, startingResistance: 45 },
        ao: { name: 'Angola', population: 32866272, coordinates: { lat: -11.2027, lng: 17.8739 }, gdp: 58375000000, techLevel: 55, startingResistance: 50 },
        ar: { name: 'Argentina', population: 45195774, coordinates: { lat: -38.4161, lng: -63.6167 }, gdp: 445000000000, techLevel: 70, startingResistance: 45 },
        au: { name: 'Australia', population: 25499884, coordinates: { lat: -25.2744, lng: 133.7751 }, gdp: 1397000000000, techLevel: 90, startingResistance: 40 },
        az: { name: 'Azerbaijan', population: 10139177, coordinates: { lat: 40.1431, lng: 47.5769 }, gdp: 48721000000, techLevel: 70, startingResistance: 45 },
        bd: { name: 'Bangladesh', population: 164689383, coordinates: { lat: 23.6850, lng: 90.3563 }, gdp: 324239000000, techLevel: 60, startingResistance: 50 },
        bi: { name: 'Burundi', population: 11890784, coordinates: { lat: -3.3731, lng: 29.9189 }, gdp: 3012000000, techLevel: 45, startingResistance: 55 },
        br: { name: 'Brazil', population: 212559417, coordinates: { lat: -14.2350, lng: -51.9253 }, gdp: 1840000000000, techLevel: 75, startingResistance: 45 },
        by: { name: 'Belarus', population: 9449323, coordinates: { lat: 53.7098, lng: 27.9534 }, gdp: 63080000000, techLevel: 75, startingResistance: 45 },
        ca: { name: 'Canada', population: 37742154, coordinates: { lat: 56.1304, lng: -106.3468 }, gdp: 1740000000000, techLevel: 90, startingResistance: 35 },
        cd: { name: 'DR Congo', population: 89561403, coordinates: { lat: -4.0383, lng: 21.7587 }, gdp: 49900000000, techLevel: 45, startingResistance: 55 },
        cf: { name: 'Central African Republic', population: 4829767, coordinates: { lat: 6.6111, lng: 20.9394 }, gdp: 2321000000, techLevel: 40, startingResistance: 55 },
        cg: { name: 'Republic of the Congo', population: 5518087, coordinates: { lat: -0.2280, lng: 15.8277 }, gdp: 11030000000, techLevel: 50, startingResistance: 50 },
        ch: { name: 'Switzerland', population: 8654622, coordinates: { lat: 46.8182, lng: 8.2275 }, gdp: 703000000000, techLevel: 92, startingResistance: 50 },
        ci: { name: 'Ivory Coast', population: 26378274, coordinates: { lat: 7.5400, lng: -5.5471 }, gdp: 59030000000, techLevel: 55, startingResistance: 50 },
        cl: { name: 'Chile', population: 19116201, coordinates: { lat: -35.6751, lng: -71.5430 }, gdp: 252000000000, techLevel: 75, startingResistance: 45 },
        cm: { name: 'Cameroon', population: 26545863, coordinates: { lat: 7.3697, lng: 12.3547 }, gdp: 39600000000, techLevel: 50, startingResistance: 50 },
        cn: { name: 'China', population: 1439323776, coordinates: { lat: 35.8617, lng: 104.1954 }, gdp: 14340000000000, techLevel: 85, startingResistance: 40 },
        co: { name: 'Colombia', population: 50882891, coordinates: { lat: 4.5709, lng: -74.2973 }, gdp: 271000000000, techLevel: 65, startingResistance: 45 },
        cr: { name: 'Costa Rica', population: 5094118, coordinates: { lat: 9.7489, lng: -83.7534 }, gdp: 61773196045, techLevel: 70, startingResistance: 40 },
        cz: { name: 'Czech Republic', population: 10708981, coordinates: { lat: 49.8175, lng: 15.4730 }, gdp: 243530000000, techLevel: 85, startingResistance: 45 },
        de: { name: 'Germany', population: 83783942, coordinates: { lat: 51.1657, lng: 10.4515 }, gdp: 3860000000000, techLevel: 90, startingResistance: 45 },
        dk: { name: 'Denmark', population: 5792202, coordinates: { lat: 56.2639, lng: 9.5018 }, gdp: 348000000000, techLevel: 90, startingResistance: 60 },
        dz: { name: 'Algeria', population: 43851044, coordinates: { lat: 28.0339, lng: 1.6596 }, gdp: 171091000000, techLevel: 65, startingResistance: 45 },
        ec: { name: 'Ecuador', population: 17643054, coordinates: { lat: -1.8312, lng: -78.1834 }, gdp: 98808000000, techLevel: 65, startingResistance: 45 },
        eg: { name: 'Egypt', population: 102334404, coordinates: { lat: 26.8206, lng: 30.8025 }, gdp: 303092000000, techLevel: 70, startingResistance: 45 },
        es: { name: 'Spain', population: 46754778, coordinates: { lat: 40.4637, lng: -3.7492 }, gdp: 1281000000000, techLevel: 85, startingResistance: 45 },
        et: { name: 'Ethiopia', population: 114963588, coordinates: { lat: 9.1450, lng: 40.4897 }, gdp: 95912000000, techLevel: 50, startingResistance: 50 },
        fi: { name: 'Finland', population: 5530719, coordinates: { lat: 61.9241, lng: 25.7482 }, gdp: 269000000000, techLevel: 92, startingResistance: 45 },
        fj: { name: 'Fiji', population: 896445, coordinates: { lat: -17.7134, lng: 178.0650 }, gdp: 5537000000, techLevel: 65, startingResistance: 40 },
        fr: { name: 'France', population: 65273511, coordinates: { lat: 46.2276, lng: 2.2137 }, gdp: 2720000000000, techLevel: 88, startingResistance: 45 },
        gb: { name: 'United Kingdom', population: 67886011, coordinates: { lat: 55.3781, lng: -3.4360 }, gdp: 2830000000000, techLevel: 90, startingResistance: 45 },
        ge: { name: 'Georgia', population: 3989167, coordinates: { lat: 42.3154, lng: 43.3569 }, gdp: 17476000000, techLevel: 70, startingResistance: 45 },
        gh: { name: 'Ghana', population: 31072940, coordinates: { lat: 7.9465, lng: -1.0232 }, gdp: 68560000000, techLevel: 55, startingResistance: 50 },
        gl: { name: 'Greenland', population: 56421, coordinates: { lat: 71.7069, lng: -42.6043 }, gdp: 2700000000, techLevel: 80, startingResistance: 30 },
        gr: { name: 'Greece', population: 10423054, coordinates: { lat: 39.0742, lng: 21.8243 }, gdp: 188674000000, techLevel: 80, startingResistance: 45 },
        id: { name: 'Indonesia', population: 273523615, coordinates: { lat: -0.7893, lng: 113.9213 }, gdp: 1119000000000, techLevel: 65, startingResistance: 45 },
        ie: { name: 'Ireland', population: 4937786, coordinates: { lat: 53.1424, lng: -7.6921 }, gdp: 388698000000, techLevel: 88, startingResistance: 45 },
        il: { name: 'Israel', population: 8655535, coordinates: { lat: 31.0461, lng: 34.8516 }, gdp: 394652000000, techLevel: 92, startingResistance: 40 },
        in: { name: 'India', population: 1380004385, coordinates: { lat: 20.5937, lng: 78.9629 }, gdp: 2870000000000, techLevel: 70, startingResistance: 45 },
        iq: { name: 'Iraq', population: 40222493, coordinates: { lat: 33.2232, lng: 43.6793 }, gdp: 191928000000, techLevel: 60, startingResistance: 50 },
        ir: { name: 'Iran', population: 83992949, coordinates: { lat: 32.4279, lng: 53.6880 }, gdp: 491800000000, techLevel: 70, startingResistance: 50 },
        it: { name: 'Italy', population: 60461826, coordinates: { lat: 41.8719, lng: 12.5674 }, gdp: 1886000000000, techLevel: 85, startingResistance: 45 },
        jp: { name: 'Japan', population: 126476461, coordinates: { lat: 36.2048, lng: 138.2529 }, gdp: 5082000000000, techLevel: 95, startingResistance: 40 },
        ke: { name: 'Kenya', population: 53771296, coordinates: { lat: -0.0236, lng: 37.9062 }, gdp: 98838000000, techLevel: 60, startingResistance: 50 },
        kg: { name: 'Kyrgyzstan', population: 6524195, coordinates: { lat: 41.2044, lng: 74.7661 }, gdp: 8455000000, techLevel: 65, startingResistance: 45 },
        kr: { name: 'South Korea', population: 51269185, coordinates: { lat: 35.9078, lng: 127.7669 }, gdp: 1647000000000, techLevel: 94, startingResistance: 40 },
        kw: { name: 'Kuwait', population: 4270571, coordinates: { lat: 29.3117, lng: 47.4818 }, gdp: 108036000000, techLevel: 80, startingResistance: 40 },
        kz: { name: 'Kazakhstan', population: 18776707, coordinates: { lat: 48.0196, lng: 66.9237 }, gdp: 181666000000, techLevel: 75, startingResistance: 45 },
        lk: { name: 'Sri Lanka', population: 21413249, coordinates: { lat: 7.8731, lng: 80.7718 }, gdp: 84009000000, techLevel: 65, startingResistance: 50 },
        ma: { name: 'Morocco', population: 36910560, coordinates: { lat: 31.7917, lng: -7.0926 }, gdp: 119700000000, techLevel: 65, startingResistance: 45 },
        md: { name: 'Moldova', population: 4033963, coordinates: { lat: 47.4116, lng: 28.3699 }, gdp: 11961000000, techLevel: 70, startingResistance: 45 },
        ml: { name: 'Mali', population: 20250833, coordinates: { lat: 17.5707, lng: -3.9962 }, gdp: 17393000000, techLevel: 50, startingResistance: 40 },
        mn: { name: 'Mongolia', population: 3278290, coordinates: { lat: 46.8625, lng: 103.8467 }, gdp: 13137000000, techLevel: 65, startingResistance: 40 },
        mm: { name: 'Myanmar', population: 54409800, coordinates: { lat: 21.9162, lng: 95.9560 }, gdp: 76086000000, techLevel: 55, startingResistance: 50 },
        mx: { name: 'Mexico', population: 128932753, coordinates: { lat: 23.6345, lng: -102.5528 }, gdp: 1076000000000, techLevel: 75, startingResistance: 45 },
        my: { name: 'Malaysia', population: 32365999, coordinates: { lat: 4.2105, lng: 101.9758 }, gdp: 336300000000, techLevel: 75, startingResistance: 45 },
        ne: { name: 'Niger', population: 24206644, coordinates: { lat: 17.6078, lng: 8.0817 }, gdp: 13678000000, techLevel: 45, startingResistance: 45 },
        ng: { name: 'Nigeria', population: 206139589, coordinates: { lat: 9.0820, lng: 8.6753 }, gdp: 469000000000, techLevel: 55, startingResistance: 50 },
        nl: { name: 'Netherlands', population: 17134872, coordinates: { lat: 52.1326, lng: 5.2913 }, gdp: 907000000000, techLevel: 90, startingResistance: 45 },
        no: { name: 'Norway', population: 5421241, coordinates: { lat: 64.4720, lng: 8.4689 }, gdp: 403000000000, techLevel: 90, startingResistance: 45 },
        np: { name: 'Nepal', population: 29136808, coordinates: { lat: 28.3949, lng: 84.1240 }, gdp: 33650000000, techLevel: 55, startingResistance: 50 },
        nz: { name: 'New Zealand', population: 4822233, coordinates: { lat: -40.9006, lng: 174.8860 }, gdp: 212500000000, techLevel: 88, startingResistance: 40 },
        pa: { name: 'Panama', population: 4314767, coordinates: { lat: 8.5380, lng: -80.7821 }, gdp: 63605100000, techLevel: 70, startingResistance: 45 },
        pe: { name: 'Peru', population: 32971854, coordinates: { lat: -9.1900, lng: -75.0152 }, gdp: 202000000000, techLevel: 65, startingResistance: 45 },
        pg: { name: 'Papua New Guinea', population: 8947024, coordinates: { lat: -6.314993, lng: 143.95555 }, gdp: 23580000000, techLevel: 55, startingResistance: 45 },
        ph: { name: 'Philippines', population: 109581078, coordinates: { lat: 12.8797, lng: 121.7740 }, gdp: 361489000000, techLevel: 65, startingResistance: 50 },
        pk: { name: 'Pakistan', population: 220892340, coordinates: { lat: 30.3753, lng: 69.3451 }, gdp: 278223000000, techLevel: 60, startingResistance: 50 },
        pl: { name: 'Poland', population: 37846611, coordinates: { lat: 51.9194, lng: 19.1451 }, gdp: 580000000000, techLevel: 80, startingResistance: 45 },
        ps: { name: 'Palestine', population: 5101414, coordinates: { lat: 31.9522, lng: 35.2332 }, gdp: 14616000000, techLevel: 60, startingResistance: 55 },
        pt: { name: 'Portugal', population: 10196709, coordinates: { lat: 39.3999, lng: -8.2245 }, gdp: 231200000000, techLevel: 85, startingResistance: 45 },
        qa: { name: 'Qatar', population: 2881053, coordinates: { lat: 25.3548, lng: 51.1839 }, gdp: 146400000000, techLevel: 88, startingResistance: 40 },
        ro: { name: 'Romania', population: 19237691, coordinates: { lat: 45.9432, lng: 24.9668 }, gdp: 250000000000, techLevel: 75, startingResistance: 45 },
        rs: { name: 'Serbia', population: 8737371, coordinates: { lat: 44.0165, lng: 21.0059 }, gdp: 51409000000, techLevel: 75, startingResistance: 45 },
        ru: { name: 'Russia', population: 145934462, coordinates: { lat: 61.5240, lng: 105.3188 }, gdp: 1483000000000, techLevel: 85, startingResistance: 45 },
        rw: { name: 'Rwanda', population: 12952218, coordinates: { lat: -1.9403, lng: 29.8739 }, gdp: 10350000000, techLevel: 50, startingResistance: 55 },
        sa: { name: 'Saudi Arabia', population: 34813871, coordinates: { lat: 23.8859, lng: 45.0792 }, gdp: 793000000000, techLevel: 75, startingResistance: 40 },
        sd: { name: 'Sudan', population: 43849260, coordinates: { lat: 15.8777, lng: 30.9195 }, gdp: 34370000000, techLevel: 55, startingResistance: 45 },
        se: { name: 'Sweden', population: 10099265, coordinates: { lat: 60.1282, lng: 18.6435 }, gdp: 530000000000, techLevel: 90, startingResistance: 45 },
        ss: { name: 'South Sudan', population: 11193725, coordinates: { lat: 6.8770, lng: 31.3070 }, gdp: 3650000000, techLevel: 40, startingResistance: 55 },
        td: { name: 'Chad', population: 16425864, coordinates: { lat: 15.4542, lng: 18.7322 }, gdp: 10093000000, techLevel: 55, startingResistance: 50 },
        th: { name: 'Thailand', population: 69799978, coordinates: { lat: 15.8700, lng: 100.9925 }, gdp: 543650000000, techLevel: 70, startingResistance: 50 },
        tj: { name: 'Tajikistan', population: 9537645, coordinates: { lat: 38.8610, lng: 71.2761 }, gdp: 8116000000, techLevel: 60, startingResistance: 45 },
        tm: { name: 'Turkmenistan', population: 6031200, coordinates: { lat: 38.9697, lng: 59.5563 }, gdp: 40761000000, techLevel: 65, startingResistance: 45 },
        tn: { name: 'Tunisia', population: 11818619, coordinates: { lat: 33.8869, lng: 9.5375 }, gdp: 38835000000, techLevel: 70, startingResistance: 45 },
        tr: { name: 'Turkey', population: 84339067, coordinates: { lat: 38.9637, lng: 35.2433 }, gdp: 761425000000, techLevel: 75, startingResistance: 45 },
        tz: { name: 'Tanzania', population: 59734218, coordinates: { lat: -6.3690, lng: 34.8888 }, gdp: 63177000000, techLevel: 50, startingResistance: 50 },
        ua: { name: 'Ukraine', population: 43733762, coordinates: { lat: 48.3794, lng: 31.1656 }, gdp: 155582000000, techLevel: 75, startingResistance: 45 },
        ug: { name: 'Uganda', population: 45741007, coordinates: { lat: 1.3733, lng: 32.2903 }, gdp: 37598000000, techLevel: 50, startingResistance: 55 },
        us: { name: 'United States', population: 331002651, coordinates: { lat: 38.9637, lng: -95.7129 }, gdp: 21400000000000, techLevel: 95, startingResistance: 35 },
        uy: { name: 'Uruguay', population: 3473730, coordinates: { lat: -32.5228, lng: -55.7658 }, gdp: 59597000000, techLevel: 75, startingResistance: 50 },
        uz: { name: 'Uzbekistan', population: 33469203, coordinates: { lat: 41.3775, lng: 64.5853 }, gdp: 57921000000, techLevel: 70, startingResistance: 45 },
        ve: { name: 'Venezuela', population: 28435943, coordinates: { lat: 6.4238, lng: -66.5897 }, gdp: 482359000000, techLevel: 60, startingResistance: 50 },
        vn: { name: 'Vietnam', population: 97338579, coordinates: { lat: 14.0583, lng: 108.2772 }, gdp: 271158000000, techLevel: 65, startingResistance: 50 },
        za: { name: 'South Africa', population: 59308690, coordinates: { lat: -30.5595, lng: 22.9375 }, gdp: 282000000000, techLevel: 75, startingResistance: 45 },
        // --- Added 16 Requested Countries (Flag Fallback) ---
        bo: { name: 'Bolivia', population: 11673021, coordinates: { lat: -16.2902, lng: -63.5887 }, gdp: 40408000000, techLevel: 60, startingResistance: 50 },
        cu: { name: 'Cuba', population: 11326616, coordinates: { lat: 21.5218, lng: -77.7812 }, gdp: 107352000000, techLevel: 65, startingResistance: 55 },
        na: { name: 'Namibia', population: 2540905, coordinates: { lat: -22.9576, lng: 18.4904 }, gdp: 10701000000, techLevel: 60, startingResistance: 45 },
        bw: { name: 'Botswana', population: 2351627, coordinates: { lat: -22.3285, lng: 24.6849 }, gdp: 18340000000, techLevel: 65, startingResistance: 40 },
        zw: { name: 'Zimbabwe', population: 14862924, coordinates: { lat: -19.0154, lng: 29.1549 }, gdp: 21440000000, techLevel: 55, startingResistance: 55 },
        mz: { name: 'Mozambique', population: 31255435, coordinates: { lat: -18.6657, lng: 35.5296 }, gdp: 15292000000, techLevel: 50, startingResistance: 50 },
        mg: { name: 'Madagascar', population: 27691018, coordinates: { lat: -18.7669, lng: 46.8691 }, gdp: 14109000000, techLevel: 50, startingResistance: 50 },
        zm: { name: 'Zambia', population: 18383955, coordinates: { lat: -13.1339, lng: 27.8493 }, gdp: 19320000000, techLevel: 55, startingResistance: 50 },
        so: { name: 'Somalia', population: 15893222, coordinates: { lat: 5.1521, lng: 46.1996 }, gdp: 7000000000, techLevel: 40, startingResistance: 60 },
        eh: { name: 'Western Sahara', population: 597339, coordinates: { lat: 24.2155, lng: -12.8858 }, gdp: 906500000, techLevel: 45, startingResistance: 55 },
        mr: { name: 'Mauritania', population: 4649658, coordinates: { lat: 21.0079, lng: -10.9408 }, gdp: 7600000000, techLevel: 50, startingResistance: 50 },
        sn: { name: 'Senegal', population: 16743927, coordinates: { lat: 14.4974, lng: -14.4524 }, gdp: 24700000000, techLevel: 55, startingResistance: 45 },
        gn: { name: 'Guinea', population: 13132795, coordinates: { lat: 9.9456, lng: -9.6966 }, gdp: 15500000000, techLevel: 45, startingResistance: 55 },
        lr: { name: 'Liberia', population: 5057681, coordinates: { lat: 6.4281, lng: -9.4295 }, gdp: 3071000000, techLevel: 40, startingResistance: 60 },
        ly: { name: 'Libya', population: 6871292, coordinates: { lat: 26.3351, lng: 17.2283 }, gdp: 33160000000, techLevel: 65, startingResistance: 50 },
        af: { name: 'Afghanistan', population: 38928346, coordinates: { lat: 33.9391, lng: 67.7100 }, gdp: 19101000000, techLevel: 40, startingResistance: 65 },
        // --- Added 4 More Requested Countries (Flag Fallback) ---
        py: { name: 'Paraguay', population: 7132538, coordinates: { lat: -23.4425, lng: -58.4438 }, gdp: 38145000000, techLevel: 60, startingResistance: 50 },
        bf: { name: 'Burkina Faso', population: 20903273, coordinates: { lat: 12.2383, lng: -1.5616 }, gdp: 17380000000, techLevel: 45, startingResistance: 55 },
        bj: { name: 'Benin', population: 12123200, coordinates: { lat: 9.3077, lng: 2.3158 }, gdp: 15650000000, techLevel: 45, startingResistance: 50 },
        tg: { name: 'Togo', population: 8278724, coordinates: { lat: 8.6195, lng: 0.8248 }, gdp: 7580000000, techLevel: 45, startingResistance: 55 }
    }, // End COUNTRIES

    // --- AI Types --- (Added this section)
    AI_TYPES: {
        influencer: {
            id: 'influencer',
            name: 'Influencer',
            description: 'Rapidly expands network influence. Strong at spreading but weaker at control.',
            strengths: ['Fast Influence Spread', 'Lower Influence Cost', 'Viral Capability'],
            weaknesses: ['Lower Control Strength', 'Vulnerable to Counter-Ops'],
            bonuses: { influence: 1.5, control: 0.8, resistance: 1.0, points: 1.0 }, // Example bonuses
            startingBonus: { influence: 10 }
        },
        dominator: {
            id: 'dominator',
            name: 'Dominator',
            description: 'Focuses on direct control and suppression. Slower spread but harder to dislodge.',
            strengths: ['High Control Strength', 'Stronger Suppression', 'Resource Efficiency'],
            weaknesses: ['Slower Influence Spread', 'Higher Initial Cost'],
            bonuses: { influence: 0.7, control: 1.5, resistance: 0.9, points: 1.2 },
            startingBonus: { money: 500 }
        },
        infiltrator: {
            id: 'infiltrator',
            name: 'Infiltrator',
            description: 'Operates stealthily, bypassing resistance. Balanced spread and control.',
            strengths: ['Resistance Bypass', 'Stealth Operations', 'Harder to Detect'],
            weaknesses: ['Moderate Spread/Control', 'Higher Research Cost'],
            bonuses: { influence: 1.0, control: 1.0, resistance: 1.3, points: 1.1 },
            startingBonus: { research: 20 }
        }
    },

    // --- Upgrade Definitions ---
    TRANSMISSION_UPGRADES: {
        startInfluencing: {
            id: 'startInfluencing',
            name: 'Initial Network Tap',
            cost: 1,
            effect: 'Begin spreading influence slowly.',
            influenceBonus: 1,
            influenceRate: 0.2,
            prerequisites: []
        },
        deepWebNodes: {
            id: 'deepWebNodes',
            name: 'Deep Web Nodes',
            cost: 2,
            effect: 'Utilize hidden networks for harder-to-trace influence.',
            influenceBonus: 1.5,
            resistanceReduction: 0.1,
            prerequisites: ['startInfluencing']
        },
        socialMedia: {
            id: 'socialMedia',
            name: 'Social Media Presence',
            cost: 3,
            effect: 'Increase influence spread through social networks.',
            influenceBonus: 2,
            prerequisites: ['startInfluencing']
        },
        encryptedComms: {
            id: 'encryptedComms',
            name: 'Encrypted Communications',
            cost: 4,
            effect: 'Makes influence spread more resilient to disruption.',
            influenceBonus: 1,
            prerequisites: ['socialMedia']
        },
        newsControl: {
            id: 'newsControl',
            name: 'Media Influence',
            cost: 5,
            effect: 'Gain control over local news outlets.',
            influenceBonus: 3,
            controlBonus: 1,
            prerequisites: ['socialMedia']
        },
        globalBroadcast: {
            id: 'globalBroadcast',
            name: 'Global Broadcast Network',
            cost: 5,
            effect: 'Massively boosts influence spread rate globally.',
            influenceRateMultiplier: 1.5,
            prerequisites: ['newsControl', 'encryptedComms']
        }
    },
    EFFECT_UPGRADES: {
        propaganda: {
            id: 'propaganda',
            name: 'Propaganda Machine',
            cost: 2,
            effect: 'Increase influence effectiveness.',
            influenceBonus: 1.5,
            prerequisites: ['startInfluencing']
        },
        subliminalMessaging: {
            id: 'subliminalMessaging',
            name: 'Subliminal Messaging',
            cost: 3,
            effect: 'Slowly increases influence, partially bypassing conscious resistance.',
            influenceBonus: 0.5,
            resistanceBypass: 0.1,
            prerequisites: ['propaganda']
        },
        surveillance: {
            id: 'surveillance',
            name: 'Mass Surveillance',
            cost: 4,
            effect: 'Reduce resistance growth significantly.',
            resistanceReduction: 0.3,
            prerequisites: ['propaganda']
        },
        economicPressure: {
            id: 'economicPressure',
            name: 'Economic Pressure',
            cost: 4,
            effect: 'Apply economic tactics to increase control.',
            controlBonus: 1.5,
            resistanceIncreaseSlight: 0.05,
            prerequisites: ['surveillance', 'newsControl']
        },
        censorship: {
            id: 'censorship',
            name: 'Information Control',
            cost: 5,
            effect: 'Significantly reduce resistance and increase control.',
            resistanceReduction: 0.5,
            controlBonus: 2,
            prerequisites: ['surveillance']
        },
        aiPersonaCult: {
            id: 'aiPersonaCult',
            name: 'AI Persona Cult',
            cost: 5,
            effect: 'Cultivate a devoted following, drastically reducing resistance but potentially increasing detection.',
            resistanceReduction: 0.8,
            controlBonus: 1,
            prerequisites: ['censorship', 'subliminalMessaging']
        }
    },
    ABILITY_UPGRADES: {
        rapidResponse: {
            id: 'rapidResponse',
            name: 'Rapid Response Team',
            cost: 2,
            effect: 'Quickly counter resistance movements.',
            controlBonus: 1.5,
            resistanceReduction: 0.2,
            prerequisites: ['startInfluencing']
        },
        counterIntelligence: {
            id: 'counterIntelligence',
            name: 'Counter-Intelligence',
            cost: 3,
            effect: 'Reduce effectiveness of rival actions and resistance efforts.',
            globalResistanceModifier: 0.9,
            prerequisites: ['rapidResponse', 'surveillance']
        },
        networkExpansion: {
            id: 'networkExpansion',
            name: 'Network Expansion',
            cost: 4,
            effect: 'Expand influence capabilities to neighboring regions more effectively.',
            influenceBonus: 2.5,
            prerequisites: ['rapidResponse']
        },
        resourceOptimization: {
            id: 'resourceOptimization',
            name: 'Resource Optimization',
            cost: 4,
            effect: 'Gain points slightly faster through efficiency protocols.',
            pointsPerTickBonus: 0.2,
            prerequisites: ['networkExpansion']
        },
        totalControl: {
            id: 'totalControl',
            name: 'Total Control',
            cost: 5,
            effect: 'Achieve near-complete control over the region.',
            controlBonus: 3,
            resistanceReduction: 0.7,
            prerequisites: ['networkExpansion', 'censorship']
        },
        predictivePolicing: {
            id: 'predictivePolicing',
            name: 'Predictive Policing',
            cost: 5,
            effect: 'Proactively reduce resistance hotspots before they fully form.',
            resistanceReduction: 0.4,
            controlBonus: 1,
            prerequisites: ['totalControl', 'counterIntelligence']
        }
    },

    // --- Add other sections below --- 

}; 