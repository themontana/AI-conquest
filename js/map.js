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
    }

    createSampleCountries() {
        this.countries = {};

        const regions = [
            { name: 'North America', x: 0.1, y: 0.2 },
            { name: 'South America', x: 0.2, y: 0.6 },
            { name: 'Europe', x: 0.45, y: 0.2 },
            { name: 'Africa', x: 0.45, y: 0.45 },
            { name: 'Asia', x: 0.7, y: 0.3 },
            { name: 'Oceania', x: 0.8, y: 0.7 },
            { name: 'Antarctica', x: 0.5, y: 0.85 }
        ];

        regions.forEach(region => {
            this.countries[region.name] = {
                name: region.name,
                continent: region.name,
                coordinates: { x: region.x, y: region.y },
                influence: 0,
                control: 0,
                resistance: CONFIG.INITIAL_RESISTANCE || 50
            };
        });
    }

    render() {
        if (!this.ctx || !this.canvas) return;
        if (!this.dirty) return;

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
        if (country.control >= (CONFIG.CONTROL_THRESHOLD || 75)) {
            return '#1b8a1b';
        } else if (country.influence >= (CONFIG.INFLUENCE_THRESHOLD || 50)) {
            const controlIntensity = Math.min(country.control / (CONFIG.CONTROL_THRESHOLD || 75), 1);
            const r = Math.round(30);
            const g = Math.round(80 + controlIntensity * 58);
            const b = Math.round(130 - controlIntensity * 100);
            return `rgb(${r}, ${g}, ${b})`;
        } else if (country.influence > 0) {
            const intensity = Math.min(country.influence / (CONFIG.INFLUENCE_THRESHOLD || 50), 1);
            const r = Math.round(42);
            const g = Math.round(42 + intensity * 40);
            const b = Math.round(42 + intensity * 90);
            return `rgb(${r}, ${g}, ${b})`;
        } else {
            return '#2a2a2a';
        }
    }

    updateCountryStats(code, stats) {
        if (this.countries[code]) {
            this.countries[code] = { ...this.countries[code], ...stats };
            this.dirty = true;
            this.requestRender();
        }
    }
}

export default WorldMap; 