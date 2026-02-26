import { CONFIG } from '../config.js';

export class MapRenderer {
    constructor(containerId = 'world-map', tooltipId = 'country-tooltip', clickCallback = () => {}) {
        this.container = document.getElementById(containerId);
        this.tooltipElement = document.getElementById(tooltipId);
        this.clickCallback = clickCallback;
        
        if (!this.container) {
            return;
        }
        
        this.svg = null;
        this.countryPaths = new Map();
        this.countriesData = {};
        this.activeSignals = new Map(); // Track active signal effects
        this.signalCounter = 0; // Unique ID counter for signals
    }

    async initialize() {
        if (!this.container) {
            return;
        }

        try {
            await this.loadSVG();
            this.setupSVG();
            this.initializeCountryPaths();
            
        } catch (error) {
            throw error;
        }
    }

    async loadSVG() {
        if (!this.container) {
            throw new Error('Map container not found');
        }

        try {
            const response = await fetch('./img/map/world-map.svg');
            if (!response.ok) {
                throw new Error(`Failed to load SVG: ${response.status}`);
            }
            const svgContent = await response.text();
            
            this.container.innerHTML = svgContent;
            this.svg = this.container.querySelector('svg');
            
            if (!this.svg) {
                throw new Error('SVG element not found in loaded content');
            }
        } catch (error) {
            throw error;
        }
    }

    setupSVG() {
        if (!this.svg) {
            throw new Error('SVG not loaded');
        }

        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    }

    initializeCountryPaths() {
        if (!this.svg) {
            throw new Error('SVG not loaded');
        }
        if (!this.countriesData) {
             throw new Error('Countries data not set before initializing paths.');
        }

        // Clear previous paths and listeners if re-initializing
        this.countryPaths.forEach(paths => {
            paths.forEach(p => {
                // Simple clone-replace to remove all listeners
                p.replaceWith(p.cloneNode(true));
            });
        });
        this.countryPaths.clear(); 

        const allPaths = this.svg.querySelectorAll('path');
        const countryCodesFound = new Set();
        const unmappedPathDetails = [];
        const missingDataCodes = new Set();

        // First pass: Assign data-country attribute and identify codes
        allPaths.forEach((path, index) => {
            let rawCode = path.id || 
                          path.getAttribute('class') || 
                          path.getAttribute('data-country') ||
                          path.getAttribute('data-code');
            
            if (rawCode) {
                const countryCode = this.normalizeCountryCode(rawCode);
                if (countryCode && this.countriesData[countryCode]) {
                    path.setAttribute('data-country', countryCode);
                    countryCodesFound.add(countryCode);
                } else if (countryCode) {
                    missingDataCodes.add(countryCode);
                    unmappedPathDetails.push({ index, pathId: path.id, rawCode: rawCode, normalizedCode: countryCode, reason: 'Missing in CONFIG.COUNTRIES' });
                } else {
                    unmappedPathDetails.push({ index, pathId: path.id, rawCode: rawCode, reason: 'Normalization failed' });
                }
            } else {
                unmappedPathDetails.push({ index, pathId: path.id, reason: 'No identifier (id, class, data-*) found' });
            }
        });
        
        // Log unmapped paths for debugging
        if (unmappedPathDetails.length > 0) {
            // Paths could not be mapped
        }
        if (missingDataCodes.size > 0) {
            // SVG paths found for codes missing in CONFIG.COUNTRIES
        }

        // Second pass: Group paths by country code and add listeners
        countryCodesFound.forEach(code => {
            const pathsForCountry = this.svg.querySelectorAll(`path[data-country="${code}"]`);
            if (pathsForCountry.length > 0) {
                // Store the NodeList directly
                this.countryPaths.set(code, Array.from(pathsForCountry)); 

                pathsForCountry.forEach(path => {
                    path.classList.add('neutral'); // Add default class

                    // Add mouseover listener
                    path.addEventListener('mouseover', (e) => {
                        const currentCode = e.target.getAttribute('data-country');
                        const targetPath = e.target; // Store the element that triggered the event
                        if (!currentCode || !targetPath) return;
                        
                        const pathsToHighlight = this.countryPaths.get(currentCode);
                        if (pathsToHighlight) {
                            pathsToHighlight.forEach(p => {
                                p.style.fill = '#1a1a1a'; // Dark black color
                                p.style.stroke = '#ffffff'; // White stroke
                                p.style.strokeWidth = '1';
                            });
                        }
                        if (this.tooltipElement) {
                           this.showTooltip(currentCode, targetPath);
                        }
                    });

                    // Add mouseout listener
                    path.addEventListener('mouseout', (e) => {
                        const currentCode = e.target.getAttribute('data-country');
                        if (!currentCode) return;
                        const pathsToUnhighlight = this.countryPaths.get(currentCode);
                        if (pathsToUnhighlight) {
                            pathsToUnhighlight.forEach(p => {
                                // Reset to original styles
                                p.style.fill = '';
                                p.style.stroke = '';
                                p.style.strokeWidth = '';
                            });
                        }
                        if (this.tooltipElement) {
                            this.hideTooltip();
                        }
                    });

                    // Add click listener
                    path.addEventListener('click', (e) => {
                        const currentCode = e.target.getAttribute('data-country');
                        if (currentCode && this.clickCallback) {
                            this.clickCallback(currentCode);
                        }
                    });
                });
            } else {
                // QuerySelector failed to find paths for known code
            }
        });
        
        // Mapped countries to paths
        console.log(`Mapped ${this.countryPaths.size} countries to ${Array.from(this.countryPaths.values()).flat().length} paths.`);
    }

    normalizeCountryCode(rawCode) {
        if (!rawCode) return null;

        let code = rawCode.replace(/^(country-|country_|land-|region-)/, '').trim();
        let lowerCode = code.toLowerCase();

        const mappings = {
            'united-states': 'us',
            'usa': 'us',
            'united states': 'us',
            'united_states': 'us',
            'u.s.a.': 'us',
            'u.s.': 'us',
            'canada': 'ca',
            'mexico': 'mx',
            'brazil': 'br',
            'argentina': 'ar',
            'united kingdom': 'gb',
            'united_kingdom': 'gb',
            'uk': 'gb',
            'great britain': 'gb',
            'great_britain': 'gb',
            'england': 'gb',
            'scotland': 'gb',
            'wales': 'gb',
            'northern ireland': 'gb',
            'france': 'fr',
            'germany': 'de',
            'italy': 'it',
            'spain': 'es',
            'russia': 'ru',
            'russian federation': 'ru',
            'china': 'cn',
            'japan': 'jp',
            'south korea': 'kr',
            'republic of korea': 'kr',
            'north korea': 'kp',
            'democratic people\'s republic of korea': 'kp',
            'dprk': 'kp',
            'india': 'in',
            'australia': 'au',
            'new zealand': 'nz',
            'south africa': 'za',
            'egypt': 'eg',
            'nigeria': 'ng',
            'american samoa': 'as',
            'antigua and barbuda': 'ag',
            'azerbaijan': 'az',
            'bahamas': 'bs',
            'bosnia and herzegovina': 'ba',
            'canary islands (spain)': 'ic',
            'cape verde': 'cv',
            'cayman islands': 'ky',
            'cyprus': 'cy',
            'faeroe islands': 'fo',
            'falkland islands': 'fk',
            'federated states of micronesia': 'fm',
            'french polynesia': 'pf',
            'guadeloupe': 'gp',
            'northern mariana islands': 'mp',
            'papua new guinea': 'pg',
            'puerto rico': 'pr',
            'saint kitts and nevis': 'kn',
            'são tomé and principe': 'st',
            'solomon islands': 'sb',
            'trinidad and tobago': 'tt',
            'turks and caicos islands': 'tc',
            'united states virgin islands': 'vi',
            'vanuatu': 'vu',
            'turkey': 'tr',
            'oman': 'om',
            'seychelles': 'sc',
            'samoa': 'ws',
            'tonga': 'to',
            'nauru': 'nr',
            'angola': 'ao',
            'denmark': 'dk',
            'greece': 'gr',
            'indonesia': 'id',
            'malaysia': 'my',
            'norway': 'no',
            'philippines': 'ph',
            'chile': 'cl',
            'fiji': 'fj',
        };

        let mappedCode = mappings[lowerCode];
        
        if (mappedCode) {
            return mappedCode.toLowerCase();
        }
        
        if (code.length === 2 && /^[a-zA-Z]+$/.test(code)) {
             return code.toLowerCase();
        }

        return null; 
    }

    setCountryColor(countryCode, color) {
        const path = this.countryPaths.get(countryCode);
        if (path) {
            path.style.fill = color;
        }
    }

    setCountriesData(data) {
        this.countriesData = data;
    }

    showTooltip(countryCode, targetPathElement) {
        const country = this.countriesData[countryCode];

        if (!country || !this.tooltipElement || !targetPathElement) {
            return;
        }

        try {
            const bbox = targetPathElement.getBBox();
            const svgRect = this.svg.getBoundingClientRect();
            const containerRect = this.container.getBoundingClientRect();

            const scaleX = svgRect.width / this.svg.viewBox.baseVal.width;
            const scaleY = svgRect.height / this.svg.viewBox.baseVal.height;

            const tooltipX = (svgRect.left - containerRect.left) + (bbox.x + bbox.width / 2) * scaleX;
            const tooltipY = (svgRect.top - containerRect.top) + (bbox.y + bbox.height / 2) * scaleY;

            let tooltipHTML = '';
            try {
                tooltipHTML = `
                    <div class="tooltip-content">
                        ${this.getCountryFlagHTML(countryCode, country.name)}
                        ${country.name}
                    </div>
                `;
            } catch (flagError) {
                tooltipHTML = `<div class="tooltip-content">Error loading data for ${countryCode}</div>`;
            }

            this.tooltipElement.innerHTML = tooltipHTML;
            
            this.tooltipElement.style.display = 'block';
            requestAnimationFrame(() => { 
                const tooltipRect = this.tooltipElement.getBoundingClientRect();
                const finalX = tooltipX - (tooltipRect.width / 2);
                
                let finalY = tooltipY - tooltipRect.height - 10; 

                const topMargin = 5; 

                if (finalY < topMargin) { 
                    finalY = tooltipY + 15; 
                }

                this.tooltipElement.style.left = `${finalX}px`; 
                this.tooltipElement.style.top = `${finalY}px`; 
            });

        } catch (error) {
            this.hideTooltip();
        }
    }

    hideTooltip() {
        if (!this.tooltipElement) return;
        this.tooltipElement.style.display = 'none';
    }

    getCountryFlagHTML(countryCode, countryName) {
        const paths = [
            `./img/flags/${countryCode.toLowerCase()}.png`,
            `img/flags/${countryCode.toLowerCase()}.png`,
            `/img/flags/${countryCode.toLowerCase()}.png`
        ];
        
        const rawFallbackHTML = this.createFallbackCountryImage(countryCode, countryName);
        const encodedFallbackHTML = encodeURIComponent(rawFallbackHTML);

        return `
            <img 
                src="${paths[0]}" 
                alt="${countryName} flag" 
                class="country-flag"
                onerror="
                    if (this.dataset.retryCount === undefined) {
                        this.dataset.retryCount = '0';
                        this.src = '${paths[1]}';
                    } else if (this.dataset.retryCount === '0') {
                        this.dataset.retryCount = '1';
                        this.src = '${paths[2]}';
                    } else {
                        this.outerHTML = decodeURIComponent('${encodedFallbackHTML}'); 
                    }
                "
                data-retry-count="0" 
            />
        `;
    }

    createFallbackCountryImage(countryCode, countryName) {
        return `
            <div class="country-flag country-flag-fallback" style="display: inline-block; width: 20px; height: 15px; line-height: 15px; text-align: center; background-color: #5a7a9a; color: white; font-size: 9px; font-weight: bold; margin-right: 5px; vertical-align: middle;">
                ${countryCode.toUpperCase()}
            </div>
        `;
    }

    updateMapStatuses(countriesState) {
        // Color definitions are now primarily in CSS
        const nonPlayableColor = '#2C3E50'; // For countries not in game state

        // Iterate over the map [countryCode, pathList]
        this.countryPaths.forEach((pathList, countryCode) => {
            const countryState = countriesState[countryCode] || countriesState[countryCode.toUpperCase()];
            
            // Determine the correct class(es) based on state
            let statusClass = 'neutral'; // Default
            let isSelected = false;
            let isHighResistance = false;

            if (countryState) {
                 isSelected = countryState.selected || false;
                 isHighResistance = countryState.resistance >= 50; // Assuming CONFIG.RESISTANCE_HIGH_THRESHOLD?
                 
                 if (isHighResistance) {
                     statusClass = 'resistance-high';
                 } else if (countryState.control >= 50) { // Assuming CONFIG.CONTROL_THRESHOLD?
                     statusClass = 'controlled';
                 } else if (countryState.influence >= 50) { // Assuming CONFIG.INFLUENCE_THRESHOLD?
                     statusClass = 'influenced';
                 } else {
                     statusClass = 'neutral';
                 }
            } else {
                 // Handle paths that might exist in SVG but not in game state
                if (this.countriesData[countryCode]) {
                     statusClass = 'neutral'; // Default to neutral if in config but not state
                } else {
                     statusClass = 'non-playable'; // Use a class for non-playable if defined in CSS
                }
            }

            // Apply classes to ALL paths for this country code
            pathList.forEach(path => {
                 // Remove ALL potentially conflicting classes first
                 path.classList.remove('selected', 'resistance-high', 'controlled', 'influenced', 'neutral', 'hover', 'non-playable');
                 
                // Add the main status class
                path.classList.add(statusClass);

                // Add selected class if applicable (overrides status color)
                if (isSelected) {
                    path.classList.add('selected');
                }
                
                // Special handling for non-playable paths if no CSS class exists
                if (statusClass === 'non-playable' && !getComputedStyle(path).getPropertyValue('fill')) { // Check if CSS applied a fill
                     path.style.fill = nonPlayableColor; 
                }
            });
        });
    }

    // Signal Effect System
    createSignalEffect(countryCode, aiType, threshold) {
        console.log(`[MapRenderer] Creating signal effect for ${countryCode}, AI: ${aiType}, threshold: ${threshold}`);
        
        if (!this.svg || !this.countryPaths.has(countryCode)) {
            console.warn(`[MapRenderer] Cannot create signal: svg=${!!this.svg}, hasCountry=${this.countryPaths.has(countryCode)}`);
            return;
        }

        // Limit concurrent signals per country (max 2)
        const countrySignals = Array.from(this.activeSignals.values())
            .filter(signal => signal.countryCode === countryCode);
        if (countrySignals.length >= 2) {
            return;
        }

        const signalId = `signal-${this.signalCounter++}`;
        const pathList = this.countryPaths.get(countryCode);
        
        if (!pathList || pathList.length === 0) {
            return;
        }

        // Calculate center point of the country
        const firstPath = pathList[0];
        const bbox = firstPath.getBBox();
        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;
        
        // Ensure coordinates are valid
        if (isNaN(centerX) || isNaN(centerY) || !isFinite(centerX) || !isFinite(centerY)) {
            console.warn(`Invalid coordinates for country ${countryCode}, skipping signal effect`);
            return;
        }

        // Create signal circle
        const signalCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        signalCircle.setAttribute('cx', centerX);
        signalCircle.setAttribute('cy', centerY);
        signalCircle.setAttribute('r', '10'); // Larger initial radius for visibility
        signalCircle.setAttribute('fill', 'none');
        signalCircle.setAttribute('stroke', this.getAIColor(aiType));
        signalCircle.setAttribute('stroke-width', '3'); // Thicker stroke for visibility
        signalCircle.setAttribute('opacity', '1'); // Start fully visible
        signalCircle.classList.add('influence-signal');
        signalCircle.classList.add(`signal-${aiType}`);
        signalCircle.setAttribute('data-signal-id', signalId);
        signalCircle.setAttribute('data-country', countryCode);
        signalCircle.setAttribute('data-threshold', threshold);
        
        // Set transform origin for scaling
        signalCircle.style.transformOrigin = `${centerX}px ${centerY}px`;
        
        console.log(`[MapRenderer] Created circle for ${countryCode}: cx=${centerX}, cy=${centerY}, r=10, color=${this.getAIColor(aiType)}`);

        // Add to SVG
        this.svg.appendChild(signalCircle);

        // Store signal info
        this.activeSignals.set(signalId, {
            element: signalCircle,
            countryCode: countryCode,
            aiType: aiType,
            threshold: threshold,
            startTime: Date.now()
        });

        // Start animation
        requestAnimationFrame(() => {
            signalCircle.style.animation = 'signal-expand 2s ease-out forwards';
            console.log(`[MapRenderer] Animation started for ${countryCode} at (${centerX}, ${centerY})`);
        });

        // Auto-cleanup after animation
        setTimeout(() => {
            this.removeSignalEffect(signalId);
        }, 2000);
    }

    removeSignalEffect(signalId) {
        const signal = this.activeSignals.get(signalId);
        if (signal && signal.element && signal.element.parentNode) {
            signal.element.parentNode.removeChild(signal.element);
        }
        this.activeSignals.delete(signalId);
    }

    updateSignalEffects() {
        // Clean up any expired signals
        const now = Date.now();
        for (const [signalId, signal] of this.activeSignals) {
            if (now - signal.startTime > 2000) {
                this.removeSignalEffect(signalId);
            }
        }
    }

    getAIColor(aiType) {
        const colors = {
            'influencer': '#4a90e2',
            'dominator': '#e74c3c',
            'infiltrator': '#9b59b6'
        };
        return colors[aiType] || '#4a90e2';
    }

    clearAllSignals() {
        for (const signalId of this.activeSignals.keys()) {
            this.removeSignalEffect(signalId);
        }
    }

    // Test method to create a signal effect manually
    testSignalEffect(countryCode = 'us', aiType = 'influencer') {
        console.log(`[MapRenderer] Testing signal effect for ${countryCode}`);
        this.createSignalEffect(countryCode, aiType, 25);
    }

    // Test method to create a simple static circle
    testStaticCircle() {
        if (!this.svg) {
            console.error('SVG not available');
            return;
        }
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '1000'); // Center of 2000px wide SVG
        circle.setAttribute('cy', '428');  // Center of 857px high SVG
        circle.setAttribute('r', '50');
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', '#ff0000');
        circle.setAttribute('stroke-width', '5');
        circle.setAttribute('opacity', '1');
        
        this.svg.appendChild(circle);
        console.log('Static test circle added to center of map');
    }

    // Method to test if the system is working
    testSystem() {
        console.log(`[MapRenderer] System test - SVG: ${!!this.svg}, Countries: ${this.countryPaths.size}`);
        if (this.svg) {
            console.log(`[MapRenderer] SVG viewBox:`, this.svg.viewBox.baseVal);
            console.log(`[MapRenderer] SVG children count:`, this.svg.children.length);
        }
        // Test with a few countries
        const testCountries = ['us', 'gb', 'fr', 'de', 'cn'];
        testCountries.forEach((code, index) => {
            setTimeout(() => {
                this.testSignalEffect(code, 'influencer');
                // Check if circle was added
                setTimeout(() => {
                    const circles = this.svg.querySelectorAll('.influence-signal');
                    console.log(`[MapRenderer] Circles in DOM: ${circles.length}`);
                    circles.forEach((circle, i) => {
                        console.log(`[MapRenderer] Circle ${i}:`, {
                            cx: circle.getAttribute('cx'),
                            cy: circle.getAttribute('cy'),
                            r: circle.getAttribute('r'),
                            stroke: circle.getAttribute('stroke'),
                            opacity: circle.getAttribute('opacity')
                        });
                    });
                }, 100);
            }, index * 1000);
        });
    }
} 