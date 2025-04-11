import { CONFIG } from './config.js';

class WorldMap {
    constructor(mapId, tooltipId) {
        this.mapId = mapId;
        this.tooltipId = tooltipId;
        this.countries = {};
        this.canvas = null;
        this.ctx = null;
        this.initialized = false;
        this.dirty = true; // Flag to track if map needs rendering
        this.renderRequested = false; // Flag to track if render is already scheduled
    }

    init() {
        console.log('Initializing world map...');
        // Get canvas element
        this.canvas = document.getElementById(this.mapId);
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }

        // Get canvas context
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('Could not get canvas context');
            return;
        }

        // Set canvas size based on container size
        const container = this.canvas.parentElement;
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        } else {
            this.canvas.width = CONFIG.MAP_WIDTH || 800;
            this.canvas.height = CONFIG.MAP_HEIGHT || 400;
        }

        // Create sample countries if none exist in CONFIG
        this.createSampleCountries();

        // Draw initial map
        this.render();
        this.initialized = true;
        console.log('World map initialized');
    }

    createSampleCountries() {
        // Create sample countries for each region
        this.countries = {};
        
        // Define regions and positions
        const regions = [
            { name: 'North America', x: 0.1, y: 0.2 },
            { name: 'South America', x: 0.2, y: 0.6 },
            { name: 'Europe', x: 0.45, y: 0.2 },
            { name: 'Africa', x: 0.45, y: 0.45 },
            { name: 'Asia', x: 0.7, y: 0.3 },
            { name: 'Oceania', x: 0.8, y: 0.7 },
            { name: 'Antarctica', x: 0.5, y: 0.85 }
        ];
        
        // Create countries for each region
        regions.forEach(region => {
            const regionCode = region.name.substring(0, 2).toUpperCase();
            this.countries[regionCode] = {
                name: region.name,
                code: regionCode,
                continent: region.name,
                coordinates: { x: region.x, y: region.y },
                influence: 0,
                control: 0,
                resistance: CONFIG.INITIAL_RESISTANCE || 50
            };
        });
    }

    render() {
        if (!this.ctx || !this.canvas) {
            console.error('Cannot render map: canvas or context not initialized');
            return;
        }

        if (!this.dirty) {
            return; // Skip render if nothing has changed
        }

        console.log('Rendering world map...');

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        this.ctx.fillStyle = CONFIG.MAP_BACKGROUND || '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw countries
        Object.entries(this.countries).forEach(([code, country]) => {
            // Calculate pixel coordinates
            const x = country.coordinates.x * this.canvas.width;
            const y = country.coordinates.y * this.canvas.height;
            const width = 100;
            const height = 60;

            // Draw country rectangle
            this.ctx.fillStyle = this.getCountryColor(country);
            this.ctx.fillRect(x, y, width, height);
            
            // Draw country border
            this.ctx.strokeStyle = '#444444';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, width, height);
            
            // Draw country name
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(country.name, x + width/2, y + height/2);
        });

        this.dirty = false;
        this.renderRequested = false;
        console.log('World map rendered');
    }

    requestRender() {
        if (!this.renderRequested) {
            this.renderRequested = true;
            requestAnimationFrame(() => {
                this.render();
            });
        }
    }

    getCountryColor(country) {
        const colors = CONFIG.COUNTRY_COLORS || {
            neutral: '#2a2a2a',
            influenced: '#4a4a8a',
            controlled: '#6a6aba'
        };
        
        if (country.control >= (CONFIG.CONTROL_THRESHOLD || 75)) {
            return colors.controlled;
        } else if (country.influence >= (CONFIG.INFLUENCE_THRESHOLD || 50)) {
            return colors.influenced;
        } else {
            return colors.neutral;
        }
    }

    updateCountryStats(code, stats) {
        if (this.countries[code]) {
            const oldColor = this.getCountryColor(this.countries[code]);
            this.countries[code] = { ...this.countries[code], ...stats };
            const newColor = this.getCountryColor(this.countries[code]);
            
            // Only mark as dirty if the color changed
            if (oldColor !== newColor) {
                this.dirty = true;
                this.requestRender();
            }
        }
    }
}

export default WorldMap; 