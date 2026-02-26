import { CONFIG } from './config.js';

export class WorldMap {
    constructor(mapId, tooltipId, onCountrySelected) {
        this.mapId = mapId;
        this.tooltipId = tooltipId;
        this.map = null;
        this.markers = {};
        this.countries = {};
        this.tooltip = document.getElementById(tooltipId);
        this.onCountrySelected = onCountrySelected;
        this.init();
    }

    init() {
        if (this.map) {
            console.log("Map already initialized, skipping");
            return;
        }

        console.log("Initializing map");
        const mapContainer = document.getElementById(this.mapId);
        if (!mapContainer) {
            console.error("Map container not found:", this.mapId);
            return;
        }

        // Set the container height and style
        mapContainer.style.height = '600px';
        mapContainer.style.minHeight = '600px';
        mapContainer.style.maxHeight = '600px';
        mapContainer.style.display = 'flex';
        mapContainer.style.alignItems = 'center';
        mapContainer.style.justifyContent = 'center';
        mapContainer.style.overflow = 'hidden';
        mapContainer.style.borderRadius = '8px';
        mapContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';

        // Load the world map SVG
        this.loadWorldMap();

        // Initialize countries
        Object.entries(CONFIG.COUNTRIES).forEach(([code, country]) => {
            this.countries[code] = {
                ...country,
                influence: 0,
                control: 0,
                resistance: CONFIG.INITIAL_RESISTANCE
            };
        });
    }

    loadWorldMap() {
        const mapContainer = document.getElementById(this.mapId);
        
        // Load the SVG content directly
        fetch('./img/map/world-map.svg')
            .then(response => response.text())
            .then(svgContent => {
                mapContainer.innerHTML = svgContent;
                const svg = mapContainer.querySelector('svg');
                
                // Set SVG attributes
                svg.setAttribute('width', '100%');
                svg.setAttribute('height', '100%');
                svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                svg.style.position = 'absolute';
                svg.style.top = '0';
                svg.style.left = '0';

                // Define country code mappings for common variations
                const countryCodeMappings = {
                    // North America
                    'united-states': 'US',
                    'usa': 'US',
                    'united-states-of-america': 'US',
                    'ca': 'CA',
                    'can': 'CA',
                    'canada': 'CA',
                    'mx': 'MX',
                    'mex': 'MX',
                    'mexico': 'MX',
                    'gt': 'GT',
                    'gtm': 'GT',
                    'guatemala': 'GT',
                    'pa': 'PA',
                    'pan': 'PA',
                    'panama': 'PA',
                    'bz': 'BZ',
                    'blz': 'BZ',
                    'belize': 'BZ',
                    'cr': 'CR',
                    'cri': 'CR',
                    'costa-rica': 'CR',
                    'cu': 'CU',
                    'cub': 'CU',
                    'cuba': 'CU',
                    'do': 'DO',
                    'dom': 'DO',
                    'dominican-republic': 'DO',
                    'ht': 'HT',
                    'hti': 'HT',
                    'haiti': 'HT',
                    'hn': 'HN',
                    'hnd': 'HN',
                    'honduras': 'HN',
                    'jm': 'JM',
                    'jam': 'JM',
                    'jamaica': 'JM',
                    'ni': 'NI',
                    'nic': 'NI',
                    'nicaragua': 'NI',
                    'sv': 'SV',
                    'slv': 'SV',
                    'el-salvador': 'SV',
                    'tt': 'TT',
                    'tto': 'TT',
                    'trinidad-and-tobago': 'TT',
                    'pr': 'PR',
                    'pri': 'PR',
                    'puerto-rico': 'PR',
                    
                    // South America
                    'ar': 'AR',
                    'arg': 'AR',
                    'argentina': 'AR',
                    'bo': 'BO',
                    'bol': 'BO',
                    'bolivia': 'BO',
                    'br': 'BR',
                    'bra': 'BR',
                    'brazil': 'BR',
                    'cl': 'CL',
                    'chl': 'CL',
                    'chile': 'CL',
                    'co': 'CO',
                    'col': 'CO',
                    'colombia': 'CO',
                    'ec': 'EC',
                    'ecu': 'EC',
                    'ecuador': 'EC',
                    'gy': 'GY',
                    'guy': 'GY',
                    'guyana': 'GY',
                    'py': 'PY',
                    'pry': 'PY',
                    'paraguay': 'PY',
                    'pe': 'PE',
                    'per': 'PE',
                    'peru': 'PE',
                    'sr': 'SR',
                    'sur': 'SR',
                    'suriname': 'SR',
                    'uy': 'UY',
                    'ury': 'UY',
                    'uruguay': 'UY',
                    've': 'VE',
                    'ven': 'VE',
                    'venezuela': 'VE',
                    
                    // Europe
                    'uk': 'GB',
                    'gbr': 'GB',
                    'united-kingdom': 'GB',
                    'great-britain': 'GB',
                    'england': 'GB',
                    'fr': 'FR',
                    'fra': 'FR',
                    'france': 'FR',
                    'de': 'DE',
                    'deu': 'DE',
                    'germany': 'DE',
                    'it': 'IT',
                    'ita': 'IT',
                    'italy': 'IT',
                    'es': 'ES',
                    'esp': 'ES',
                    'spain': 'ES',
                    'ru': 'RU',
                    'rus': 'RU',
                    'russia': 'RU',
                    'nl': 'NL',
                    'nld': 'NL',
                    'netherlands': 'NL',
                    'be': 'BE',
                    'bel': 'BE',
                    'belgium': 'BE',
                    'pt': 'PT',
                    'prt': 'PT',
                    'portugal': 'PT',
                    'se': 'SE',
                    'swe': 'SE',
                    'sweden': 'SE',
                    'dk': 'DK',
                    'dnk': 'DK',
                    'denmark': 'DK',
                    'no': 'NO',
                    'nor': 'NO',
                    'norway': 'NO',
                    'ch': 'CH',
                    'che': 'CH',
                    'switzerland': 'CH',
                    'at': 'AT',
                    'aut': 'AT',
                    'austria': 'AT',
                    'pl': 'PL',
                    'pol': 'PL',
                    'poland': 'PL',
                    'ua': 'UA',
                    'ukr': 'UA',
                    'ukraine': 'UA',
                    'gr': 'GR',
                    'grc': 'GR',
                    'greece': 'GR',
                    'fi': 'FI',
                    'fin': 'FI',
                    'finland': 'FI',
                    'ie': 'IE',
                    'irl': 'IE',
                    'ireland': 'IE',
                    'hu': 'HU',
                    'hun': 'HU',
                    'hungary': 'HU',
                    'ro': 'RO',
                    'rou': 'RO',
                    'romania': 'RO',
                    'by': 'BY',
                    'blr': 'BY',
                    'belarus': 'BY',
                    'sk': 'SK',
                    'svk': 'SK',
                    'slovakia': 'SK',
                    'cz': 'CZ',
                    'cze': 'CZ',
                    'czech-republic': 'CZ',
                    'czechia': 'CZ',
                    'lt': 'LT',
                    'ltu': 'LT',
                    'lithuania': 'LT',
                    'hr': 'HR',
                    'hrv': 'HR',
                    'croatia': 'HR',
                    'rs': 'RS',
                    'srb': 'RS',
                    'serbia': 'RS',
                    'ba': 'BA',
                    'bih': 'BA',
                    'bosnia': 'BA',
                    'bosnia-herzegovina': 'BA',
                    'al': 'AL',
                    'alb': 'AL',
                    'albania': 'AL',
                    'si': 'SI',
                    'svn': 'SI',
                    'slovenia': 'SI',
                    'mk': 'MK',
                    'mkd': 'MK',
                    'north-macedonia': 'MK',
                    'macedonia': 'MK',
                    'lv': 'LV',
                    'lva': 'LV',
                    'latvia': 'LV',
                    'ee': 'EE',
                    'est': 'EE',
                    'estonia': 'EE',
                    'cy': 'CY',
                    'cyp': 'CY',
                    'cyprus': 'CY',
                    'mt': 'MT',
                    'mlt': 'MT',
                    'malta': 'MT',
                    'lu': 'LU',
                    'lux': 'LU',
                    'luxembourg': 'LU',
                    'me': 'ME',
                    'mne': 'ME',
                    'montenegro': 'ME',
                    'is': 'IS',
                    'isl': 'IS',
                    'iceland': 'IS',
                    'md': 'MD',
                    'mda': 'MD',
                    'moldova': 'MD',
                    
                    // Asia
                    'cn': 'CN',
                    'chn': 'CN',
                    'china': 'CN',
                    'in': 'IN',
                    'ind': 'IN',
                    'india': 'IN',
                    'jp': 'JP',
                    'jpn': 'JP',
                    'japan': 'JP',
                    'kr': 'KR',
                    'kor': 'KR',
                    'south-korea': 'KR',
                    'kp': 'KP',
                    'prk': 'KP',
                    'north-korea': 'KP',
                    'id': 'ID',
                    'idn': 'ID',
                    'indonesia': 'ID',
                    'sg': 'SG',
                    'sgp': 'SG',
                    'singapore': 'SG',
                    'th': 'TH',
                    'tha': 'TH',
                    'thailand': 'TH',
                    'ph': 'PH',
                    'phl': 'PH',
                    
                    // New variations to add
                    'united_states': 'US',
                    'united-states-america': 'US',
                    'us': 'US',
                    'u-s': 'US',
                    'u-s-a': 'US',
                    'u_s_a': 'US',
                    'united_kingdom': 'GB',
                    'great_britain': 'GB',
                    'britain': 'GB',
                    'gb': 'GB',
                    'uk': 'GB',
                    'russian-federation': 'RU',
                    'soviet-union': 'RU',
                    'ussr': 'RU',
                    'peoples-republic-of-china': 'CN',
                    'peoples-republic-china': 'CN',
                    'republic-of-india': 'IN',
                    'republic-india': 'IN',
                    'republic-of-korea': 'KR',
                    'republic-korea': 'KR',
                    'democratic-peoples-republic-of-korea': 'KP',
                    'democratic-peoples-republic-korea': 'KP',
                    'dprk': 'KP',
                    'republic-of-indonesia': 'ID',
                    'republic-indonesia': 'ID',
                    'republic-of-singapore': 'SG',
                    'republic-singapore': 'SG',
                    'kingdom-of-thailand': 'TH',
                    'kingdom-thailand': 'TH',
                    'republic-of-philippines': 'PH',
                    'republic-philippines': 'PH',
                    'united_states_of_america': 'US',
                    'united-states_of_america': 'US',
                    'united_states-of_america': 'US',
                    'united_states-of_america': 'US',
                    'taiwan': 'TW',
                    'republic-of-china': 'TW', 
                    'republic-china': 'TW',
                    'tw': 'TW',
                    'twn': 'TW',
                    'hong-kong': 'HK',
                    'hk': 'HK',
                    'hkg': 'HK',
                    'south_africa': 'ZA',
                    'republic-of-south-africa': 'ZA',
                    'republic-south-africa': 'ZA',
                    'islamic-republic-of-iran': 'IR',
                    'islamic-republic-iran': 'IR',
                    'israel-state': 'IL', 
                    'state-of-israel': 'IL',
                    'united-mexican-states': 'MX',
                    'federative-republic-of-brazil': 'BR',
                    'federative-republic-brazil': 'BR',
                    'republic-of-france': 'FR',
                    'french-republic': 'FR',
                    'federal-republic-of-germany': 'DE',
                    'federal-republic-germany': 'DE',
                    'costa_rica': 'CR',
                    'costa_rica': 'CR',
                    'dominican_republic': 'DO',
                    'el_salvador': 'SV',
                    'trinidad_and_tobago': 'TT',
                    'puerto_rico': 'PR',
                    'bosnia_and_herzegovina': 'BA',
                    'bosnia_herzegovina': 'BA',
                    'northern_ireland': 'GB',
                    'scotland': 'GB',
                    'wales': 'GB',
                    
                    // Continue with other existing mappings...
                };

                // Add interactivity to country paths
                const paths = svg.querySelectorAll('path');
                console.log(`Found ${paths.length} country paths in SVG`);

                paths.forEach(path => {
                    // Try to get country code from various attributes
                    let countryCode = path.id || 
                                    path.getAttribute('class') || 
                                    path.getAttribute('data-country') ||
                                    path.getAttribute('data-code');
                    
                    // Debug log the raw country code
                    console.log('Raw country code from SVG:', countryCode);
                    
                    // Clean up the country code
                    if (countryCode) {
                        // Remove any 'country-' or similar prefixes
                        countryCode = countryCode.replace(/^(country-|country_|land-|region-)/, '');
                        // Convert to lowercase for mapping check
                        const normalizedCode = countryCode.toLowerCase();
                        
                        // Check if we have a mapping for this country code
                        if (countryCodeMappings[normalizedCode]) {
                            countryCode = countryCodeMappings[normalizedCode];
                        } else {
                            // If no mapping found, convert to uppercase
                            countryCode = countryCode.toUpperCase();
                        }
                        
                        console.log(`Processed country code: ${countryCode}`);
                        
                        // Set data attribute for country identification
                        path.setAttribute('data-country', countryCode);
                        
                        // Add CSS classes for styling
                        path.classList.add('country');
                        
                        // Add event listeners only if we have this country in our data
                        if (this.countries[countryCode]) {
                            console.log(`Adding interactivity for country: ${countryCode}`);
                            
                            path.addEventListener('mouseover', (e) => {
                                const code = e.target.getAttribute('data-country');
                                if (code && this.countries[code]) {
                                    this.showTooltip(code, this.countries[code]);
                                    e.target.style.filter = 'brightness(1.2)';
                                    e.target.style.transform = 'scale(1.02)';
                                    e.target.style.transformOrigin = 'center';
                                }
                            });

                            path.addEventListener('mouseout', (e) => {
                                this.hideTooltip();
                                e.target.style.filter = '';
                                e.target.style.transform = '';
                            });

                            path.addEventListener('click', (e) => {
                                const code = e.target.getAttribute('data-country');
                                if (code && this.countries[code]) {
                                    this.selectCountry(code);
                                    // Remove previous selection
                                    paths.forEach(p => p.classList.remove('selected'));
                                    // Add selected class to clicked country
                                    e.target.classList.add('selected');
                                }
                            });

                            // Set initial status
                            const country = this.countries[countryCode];
                            if (country.control >= CONFIG.CONTROL_THRESHOLD) {
                                path.classList.add('controlled');
                            } else if (country.influence >= CONFIG.INFLUENCE_THRESHOLD) {
                                path.classList.add('influenced');
                            }
                        } else {
                            console.warn(`No country data for code: ${countryCode}`);
                        }
                    } else {
                        console.warn('Path found with no country identification:', path);
                    }
                });

                // Log all available country codes from CONFIG
                console.log('Available country codes in CONFIG:', Object.keys(this.countries));
            })
            .catch(error => {
                console.error("Error loading world map:", error);
                this.createFallbackMap();
            });
    }

    createFallbackMap() {
        const mapContainer = document.getElementById(this.mapId);
        
        // Create a simple colored background
        const background = document.createElement('div');
        background.style.width = '100%';
        background.style.height = '100%';
        background.style.backgroundColor = '#add8e6';
        background.style.position = 'absolute';
        background.style.top = '0';
        background.style.left = '0';
        mapContainer.appendChild(background);
        
        // Add a text overlay
        const text = document.createElement('div');
        text.textContent = 'World Map';
        text.style.position = 'absolute';
        text.style.top = '50%';
        text.style.left = '50%';
        text.style.transform = 'translate(-50%, -50%)';
        text.style.color = '#333';
        text.style.fontSize = '24px';
        text.style.fontWeight = 'bold';
        mapContainer.appendChild(text);
    }

    showTooltip(countryCode, country) {
        if (!country) return;
        
        // Get the SVG path element for this country
        const svg = document.querySelector(`#${this.mapId} svg`);
        const path = svg.querySelector(`[data-country="${countryCode}"]`);
        if (!path) return;
        
        // Get the bounding box of the path
        const bbox = path.getBBox();
        const svgRect = svg.getBoundingClientRect();
        
        // Calculate position in viewport coordinates
        const tooltipX = svgRect.left + (bbox.x + bbox.width/2) * (svgRect.width / svg.viewBox.baseVal.width);
        const tooltipY = svgRect.top + bbox.y * (svgRect.height / svg.viewBox.baseVal.height);
        
        const tooltip = document.getElementById(this.tooltipId);
        
        tooltip.innerHTML = `
            <div class="tooltip-content">
                ${this.getCountryFlagHTML(countryCode, country.name)}
                ${country.name}
            </div>
        `;
        
        // Position the tooltip above the country
        tooltip.style.left = `${tooltipX}px`;
        tooltip.style.top = `${tooltipY - 30}px`;
        tooltip.style.display = 'block';
    }

    hideTooltip() {
        const tooltip = document.getElementById(this.tooltipId);
        tooltip.style.display = 'none';
    }

    selectCountry(countryCode) {
        if (!this.countries[countryCode]) {
            console.warn('Invalid country selection:', countryCode);
            return;
        }

        // Deselect all other countries
        Object.entries(this.countries).forEach(([code, country]) => {
            country.selected = false;
            this.updateMarker(code);
        });
        
        // Select the new country
        this.countries[countryCode].selected = true;
        this.updateMarker(countryCode);

        // Call the callback
        if (this.onCountrySelected) {
            this.onCountrySelected(countryCode);
        }

        // Show the info box
        this.showCountryInfo(this.countries[countryCode]);
    }

    updateMarker(countryCode) {
        // Get the SVG path element for this country
        const svg = document.querySelector(`#${this.mapId} svg`);
        if (!svg) return;

        const path = svg.querySelector(`[data-country="${countryCode}"]`);
        if (!path) return;

        const country = this.countries[countryCode];
        if (!country) return;

        // Remove existing status classes
        path.classList.remove('controlled', 'influenced', 'neutral');

        // Add appropriate status class
        if (country.control >= CONFIG.CONTROL_THRESHOLD) {
            path.classList.add('controlled');
        } else if (country.influence >= CONFIG.INFLUENCE_THRESHOLD) {
            path.classList.add('influenced');
        } else {
            path.classList.add('neutral');
        }

        // Update selection state
        if (country.selected) {
            path.classList.add('selected');
        } else {
            path.classList.remove('selected');
        }
    }

    getCountryFlagHTML(countryCode, countryName) {
        // Try multiple paths for the flag image
        const paths = [
            `./img/flags/${countryCode.toLowerCase()}.png`,
            `img/flags/${countryCode.toLowerCase()}.png`,
            `/img/flags/${countryCode.toLowerCase()}.png`
        ];
        
        const fallbackHTML = this.createFallbackCountryImage(countryCode, countryName).replace(/'/g, "\\'");
        
        // Try to load the flag with a fallback to create a div with code
        return `
            <img 
                src="${paths[0]}" 
                alt="${countryName} flag" 
                class="country-flag"
                onerror="
                    if (this.dataset.retryCount === undefined) {
                        this.dataset.retryCount = '0';
                        console.log('Retrying flag with path: ${paths[1]}');
                        this.src = '${paths[1]}';
                    } else if (this.dataset.retryCount === '0') {
                        this.dataset.retryCount = '1';
                        console.log('Retrying flag with path: ${paths[2]}');
                        this.src = '${paths[2]}';
                    } else {
                        console.warn('All flag paths failed for ${countryCode}, using fallback');
                        this.outerHTML = '${fallbackHTML}';
                    }
                "
            />
        `;
    }

    createFallbackCountryImage(countryCode, countryName) {
        // Create a colored div with country code as text (as fallback for missing flag)
        return `
            <div class="country-flag country-flag-fallback" style="display: flex; align-items: center; justify-content: center; background-color: #5a7a9a; color: white; font-size: 10px; font-weight: bold;">
                ${countryCode.toUpperCase()}
            </div>
        `;
    }

    showCountryInfo(country) {
        // Get country code from the countries object
        const countryCode = Object.keys(this.countries).find(code => this.countries[code].name === country.name);
        
        // Update the country name display with flag
        const countryNameElement = document.getElementById('selected-country-name');
        if (countryNameElement) {
            // Add flag image before country name - use local flag with fallback
            countryNameElement.innerHTML = `
                ${this.getCountryFlagHTML(countryCode, country.name)} ${country.name}
            `;
        }

        // Update the country stats display
        const statsElement = document.getElementById('country-stats');
        if (statsElement) {
            const status = country.control >= CONFIG.CONTROL_THRESHOLD ? 'Controlled' :
                          country.influence >= CONFIG.INFLUENCE_THRESHOLD ? 'Influenced' : 'Neutral';

            // Update population and GDP
            document.getElementById('info-population').textContent = this.formatNumber(country.population);
            document.getElementById('info-gdp').textContent = this.formatNumber(country.gdp);

            // Update progress bars
            this.updateProgressBar('info-resistance-bar', 'info-resistance', country.resistance);
            this.updateProgressBar('info-influence-bar', 'info-influence', country.influence);
            this.updateProgressBar('info-control-bar', 'info-control', country.control);
        }
    }

    updateProgressBar(barId, valueId, value) {
        const bar = document.getElementById(barId);
        const valueElement = document.getElementById(valueId);
        
        if (bar && valueElement) {
            // Ensure value is between 0 and 100
            const percentage = Math.max(0, Math.min(100, value));
            
            // Update the progress bar width
            bar.style.width = `${percentage}%`;
            
            // Update the value display
            const valueText = `${Math.round(percentage)}%`;
            valueElement.textContent = valueText;
        }
    }

    formatNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toString();
    }

    updateCountryStats(countryCode, stats) {
        if (this.countries[countryCode]) {
            // Update the country's stats
            Object.assign(this.countries[countryCode], stats);
            
            // Update the country's status based on the new stats
            const country = this.countries[countryCode];
            if (country.control >= CONFIG.CONTROL_THRESHOLD) {
                country.status = 'controlled';
            } else if (country.influence >= CONFIG.INFLUENCE_THRESHOLD) {
                country.status = 'influenced';
            } else {
                country.status = 'neutral';
            }
            
            // Update the marker with the new status
            this.updateMarker(countryCode);

            // Update the info box if it's open
            this.updateCountryInfoBox(countryCode);
        }
    }

    updateCountryInfoBox(countryCode) {
        const country = this.countries[countryCode];
        if (!country) return;

        // Find the existing info box
        const infoWindow = document.querySelector('.country-info-window');
        if (!infoWindow) return;

        // Check if this is the info box for the current country
        const countryNameElement = infoWindow.querySelector('h2');
        if (!countryNameElement) return;
        
        // Update the country name with flag - use local flag with fallback
        countryNameElement.innerHTML = `
            ${this.getCountryFlagHTML(countryCode, country.name)} ${country.name}
        `;

        // Update the stats in the info box
        const formatNumber = (num) => {
            if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
            if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
            if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
            if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
            return num.toString();
        };

        const status = country.control >= CONFIG.CONTROL_THRESHOLD ? 'Controlled' :
                      country.influence >= CONFIG.INFLUENCE_THRESHOLD ? 'Influenced' : 'Neutral';

        // Update the stats
        const statsElements = infoWindow.querySelectorAll('.info-row');
        statsElements.forEach(row => {
            const labelElement = row.querySelector('strong');
            if (!labelElement) return;

            const label = labelElement.textContent;
            const valueElement = labelElement.nextSibling;
            if (!valueElement) return;

            if (label === 'Population:') {
                valueElement.textContent = ` ${formatNumber(country.population)}`;
            } else if (label === 'Status:') {
                valueElement.textContent = ` ${status}`;
            } else if (label === 'Influence:') {
                valueElement.textContent = ` ${Math.round(country.influence)}%`;
            } else if (label === 'Control:') {
                valueElement.textContent = ` ${Math.round(country.control)}%`;
            } else if (label === 'Resistance:') {
                valueElement.textContent = ` ${Math.round(country.resistance)}%`;
            } else if (label === 'Latest News:') {
                const getLatestNews = (country, status) => {
                    const news = {
                        Controlled: [
                            `AI systems now fully integrated into ${country.name}'s infrastructure`,
                            `${country.name} reports unprecedented efficiency under AI management`,
                            `New AI-driven policies transform ${country.name}'s economy`
                        ],
                        Influenced: [
                            `${country.name} considers expanding AI integration`,
                            `Public opinion shifts towards AI adoption in ${country.name}`,
                            `${country.name} reports positive results from initial AI implementation`
                        ],
                        Neutral: [
                            `${country.name} evaluates potential of AI integration`,
                            `Discussions ongoing about AI adoption in ${country.name}`,
                            `${country.name} maintains cautious approach to AI implementation`
                        ]
                    };
                    const newsArray = news[status];
                    return newsArray[Math.floor(Math.random() * newsArray.length)];
                };
                valueElement.textContent = ` ${getLatestNews(country, status)}`;
            }
        });

        // Force a redraw of the info box
        infoWindow.style.display = 'none';
        infoWindow.offsetHeight; // Force reflow
        infoWindow.style.display = 'block';
    }

    // Add a new method to sync with game state
    syncWithGameState(gameState) {
        if (!gameState || !gameState.countries) return;

        // Update all countries based on game state
        Object.entries(gameState.countries).forEach(([code, country]) => {
            if (this.countries[code]) {
                // Update stats
                this.countries[code].influence = country.influence;
                this.countries[code].control = country.control;
                this.countries[code].resistance = country.resistance;
                this.countries[code].status = country.status;
                this.countries[code].selected = country.selected;

                // Update marker
                this.updateMarker(code);
            }
        });
    }

    updateCountryStatus(countryCode, status) {
        const path = this.svg.querySelector(`path[data-country="${countryCode}"]`);
        if (path) {
            // Remove all status classes
            path.classList.remove('neutral', 'influenced', 'controlled', 'resistance-high');
            // Add the new status class
            path.classList.add(status);
        }
    }
} 