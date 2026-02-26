import { CONFIG } from './config.js';

class WorldMap {
    constructor(mapId, tooltipId) {
        this.mapId = mapId;
        this.tooltipId = tooltipId;
        this.countries = {};
        this.canvas = null;
        this.ctx = null;
        this.initialized = false;
        this.dirty = true;
        this.renderRequested = false;
        this.hoveredRegion = null;
        this.selectedRegion = null;
    }

    init() {
        this.canvas = document.getElementById(this.mapId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) return;

        const container = this.canvas.parentElement;
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        } else {
            this.canvas.width = CONFIG.MAP_WIDTH || 800;
            this.canvas.height = CONFIG.MAP_HEIGHT || 400;
        }

        this.createRegions();
        this.setupInteraction();
        this.dirty = true;
        this.render();
        this.initialized = true;
    }

    createRegions() {
        this.countries = {};
        const w = this.canvas.width;
        const h = this.canvas.height;

        const regionShapes = [
            {
                name: 'North America',
                labelX: 0.18, labelY: 0.28,
                path: [
                    [0.03, 0.08], [0.08, 0.05], [0.15, 0.04], [0.22, 0.06],
                    [0.28, 0.10], [0.30, 0.16], [0.32, 0.22], [0.30, 0.30],
                    [0.28, 0.38], [0.24, 0.44], [0.20, 0.48], [0.17, 0.52],
                    [0.14, 0.50], [0.12, 0.46], [0.08, 0.42], [0.06, 0.38],
                    [0.04, 0.32], [0.02, 0.24], [0.02, 0.16]
                ]
            },
            {
                name: 'South America',
                labelX: 0.22, labelY: 0.68,
                path: [
                    [0.20, 0.52], [0.24, 0.50], [0.28, 0.52], [0.30, 0.56],
                    [0.31, 0.62], [0.30, 0.68], [0.28, 0.74], [0.26, 0.80],
                    [0.24, 0.86], [0.22, 0.90], [0.20, 0.88], [0.18, 0.82],
                    [0.16, 0.76], [0.15, 0.70], [0.16, 0.64], [0.17, 0.58],
                    [0.18, 0.54]
                ]
            },
            {
                name: 'Europe',
                labelX: 0.48, labelY: 0.22,
                path: [
                    [0.40, 0.08], [0.44, 0.06], [0.48, 0.08], [0.52, 0.10],
                    [0.55, 0.14], [0.56, 0.18], [0.55, 0.24], [0.54, 0.30],
                    [0.52, 0.34], [0.50, 0.36], [0.47, 0.34], [0.44, 0.32],
                    [0.42, 0.30], [0.40, 0.26], [0.38, 0.22], [0.38, 0.16],
                    [0.39, 0.12]
                ]
            },
            {
                name: 'Africa',
                labelX: 0.50, labelY: 0.55,
                path: [
                    [0.42, 0.36], [0.46, 0.34], [0.50, 0.36], [0.54, 0.38],
                    [0.56, 0.42], [0.58, 0.48], [0.58, 0.54], [0.56, 0.62],
                    [0.54, 0.70], [0.52, 0.76], [0.50, 0.80], [0.48, 0.78],
                    [0.46, 0.72], [0.44, 0.66], [0.42, 0.58], [0.40, 0.50],
                    [0.40, 0.44], [0.41, 0.40]
                ]
            },
            {
                name: 'Asia',
                labelX: 0.72, labelY: 0.28,
                path: [
                    [0.56, 0.06], [0.62, 0.04], [0.68, 0.06], [0.74, 0.08],
                    [0.80, 0.10], [0.86, 0.14], [0.90, 0.18], [0.92, 0.24],
                    [0.90, 0.30], [0.88, 0.36], [0.84, 0.42], [0.80, 0.46],
                    [0.76, 0.48], [0.72, 0.46], [0.68, 0.44], [0.64, 0.40],
                    [0.60, 0.36], [0.58, 0.30], [0.56, 0.24], [0.56, 0.16],
                    [0.56, 0.10]
                ]
            },
            {
                name: 'Oceania',
                labelX: 0.84, labelY: 0.68,
                path: [
                    [0.78, 0.56], [0.82, 0.54], [0.86, 0.56], [0.90, 0.58],
                    [0.94, 0.62], [0.95, 0.68], [0.94, 0.74], [0.92, 0.78],
                    [0.88, 0.80], [0.84, 0.78], [0.80, 0.76], [0.78, 0.72],
                    [0.76, 0.66], [0.76, 0.60]
                ]
            },
            {
                name: 'Antarctica',
                labelX: 0.50, labelY: 0.94,
                path: [
                    [0.10, 0.92], [0.20, 0.90], [0.30, 0.88], [0.40, 0.90],
                    [0.50, 0.88], [0.60, 0.90], [0.70, 0.88], [0.80, 0.90],
                    [0.90, 0.92], [0.88, 0.96], [0.78, 0.98], [0.60, 0.98],
                    [0.40, 0.98], [0.22, 0.98], [0.12, 0.96]
                ]
            }
        ];

        regionShapes.forEach(region => {
            this.countries[region.name] = {
                name: region.name,
                continent: region.name,
                labelX: region.labelX,
                labelY: region.labelY,
                path: region.path,
                influence: 0,
                control: 0,
                resistance: CONFIG.INITIAL_RESISTANCE || 50
            };
        });
    }

    setupInteraction() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / this.canvas.width;
            const y = (e.clientY - rect.top) / this.canvas.height;
            const region = this.getRegionAtPoint(x, y);

            if (region !== this.hoveredRegion) {
                this.hoveredRegion = region;
                this.dirty = true;
                this.render();

                const tooltip = document.getElementById(this.tooltipId);
                if (tooltip) {
                    if (region && this.countries[region]) {
                        const c = this.countries[region];
                        tooltip.innerHTML = `<strong>${c.name}</strong><br>Influence: ${Math.round(c.influence)}% | Control: ${Math.round(c.control)}% | Resistance: ${Math.round(c.resistance)}%`;
                        tooltip.style.display = 'block';
                        tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
                        tooltip.style.top = (e.clientY - rect.top - 10) + 'px';
                    } else {
                        tooltip.style.display = 'none';
                    }
                }
            } else if (this.hoveredRegion) {
                const tooltip = document.getElementById(this.tooltipId);
                if (tooltip) {
                    tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
                    tooltip.style.top = (e.clientY - rect.top - 10) + 'px';
                }
            }
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.hoveredRegion = null;
            this.dirty = true;
            this.render();
            const tooltip = document.getElementById(this.tooltipId);
            if (tooltip) tooltip.style.display = 'none';
        });
    }

    getRegionAtPoint(px, py) {
        for (const [name, country] of Object.entries(this.countries)) {
            if (this.isPointInPath(px, py, country.path)) {
                return name;
            }
        }
        return null;
    }

    isPointInPath(px, py, path) {
        let inside = false;
        for (let i = 0, j = path.length - 1; i < path.length; j = i++) {
            const xi = path[i][0], yi = path[i][1];
            const xj = path[j][0], yj = path[j][1];
            if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }

    render() {
        if (!this.ctx || !this.canvas) return;
        if (!this.dirty) return;

        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.clearRect(0, 0, w, h);

        // Background gradient (ocean)
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#0a1628');
        bgGrad.addColorStop(0.5, '#0d1f3c');
        bgGrad.addColorStop(1, '#0a1628');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Grid lines
        ctx.strokeStyle = 'rgba(30, 60, 90, 0.3)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < w; i += w / 16) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, h);
            ctx.stroke();
        }
        for (let i = 0; i < h; i += h / 8) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(w, i);
            ctx.stroke();
        }

        // Draw each region
        Object.entries(this.countries).forEach(([name, country]) => {
            this.drawRegion(ctx, w, h, name, country);
        });

        this.dirty = false;
        this.renderRequested = false;
    }

    drawRegion(ctx, w, h, name, country) {
        const path = country.path;
        if (!path || path.length < 3) return;

        // Build canvas path
        ctx.beginPath();
        ctx.moveTo(path[0][0] * w, path[0][1] * h);
        for (let i = 1; i < path.length; i++) {
            const prev = path[i - 1];
            const curr = path[i];
            const cpx = (prev[0] + curr[0]) / 2 * w;
            const cpy = (prev[1] + curr[1]) / 2 * h;
            ctx.quadraticCurveTo(prev[0] * w, prev[1] * h, cpx, cpy);
        }
        ctx.closePath();

        // Determine colors based on state
        const isHovered = (name === this.hoveredRegion);
        const fillColor = this.getRegionFill(country, isHovered);
        const borderColor = this.getRegionBorder(country, isHovered);

        // Fill
        ctx.fillStyle = fillColor;
        ctx.fill();

        // Glow for influenced/controlled regions
        if (country.influence > 0 || isHovered) {
            ctx.save();
            ctx.shadowColor = this.getGlowColor(country);
            ctx.shadowBlur = isHovered ? 20 : Math.min(country.influence / 5, 15);
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = isHovered ? 3 : 2;
            ctx.stroke();
            ctx.restore();
        } else {
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Region label
        const lx = country.labelX * w;
        const ly = country.labelY * h;

        ctx.save();
        ctx.fillStyle = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.85)';
        ctx.font = `bold ${isHovered ? 13 : 11}px 'Orbitron', 'Segoe UI', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Text shadow for readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(country.name, lx, ly);
        ctx.restore();

        // Status indicator dot
        if (country.control >= (CONFIG.CONTROL_THRESHOLD || 75)) {
            this.drawStatusDot(ctx, lx, ly + 14, '#00ff88', 'CTRL');
        } else if (country.influence >= (CONFIG.INFLUENCE_THRESHOLD || 50)) {
            this.drawStatusDot(ctx, lx, ly + 14, '#4488ff', 'INF');
        }
    }

    drawStatusDot(ctx, x, y, color, label) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(x - 14, y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.font = '9px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(label, x - 8, y + 3);
        ctx.restore();
    }

    getRegionFill(country, isHovered) {
        const ctrl = country.control || 0;
        const inf = country.influence || 0;
        const threshold = CONFIG.CONTROL_THRESHOLD || 75;
        const infThreshold = CONFIG.INFLUENCE_THRESHOLD || 50;

        if (ctrl >= threshold) {
            // Controlled - green
            return isHovered ? 'rgba(0, 200, 100, 0.55)' : 'rgba(0, 180, 80, 0.45)';
        } else if (inf >= infThreshold) {
            // Influenced - blue transitioning to green based on control
            const t = Math.min(ctrl / threshold, 1);
            const r = Math.round(20 + t * 0);
            const g = Math.round(80 + t * 100);
            const b = Math.round(180 - t * 100);
            const a = isHovered ? 0.50 : 0.40;
            return `rgba(${r}, ${g}, ${b}, ${a})`;
        } else if (inf > 0) {
            // Partial influence - dark blue glow
            const t = Math.min(inf / infThreshold, 1);
            const r = Math.round(20 + t * 10);
            const g = Math.round(30 + t * 50);
            const b = Math.round(50 + t * 130);
            const a = isHovered ? 0.45 : 0.35;
            return `rgba(${r}, ${g}, ${b}, ${a})`;
        } else {
            // Neutral
            return isHovered ? 'rgba(60, 75, 90, 0.50)' : 'rgba(40, 55, 70, 0.35)';
        }
    }

    getRegionBorder(country, isHovered) {
        const ctrl = country.control || 0;
        const inf = country.influence || 0;
        const threshold = CONFIG.CONTROL_THRESHOLD || 75;
        const infThreshold = CONFIG.INFLUENCE_THRESHOLD || 50;

        if (ctrl >= threshold) {
            return isHovered ? '#00ff88' : '#00cc66';
        } else if (inf >= infThreshold) {
            return isHovered ? '#66aaff' : '#4488dd';
        } else if (inf > 0) {
            return isHovered ? '#5577aa' : '#3a5577';
        } else {
            return isHovered ? '#667788' : '#334455';
        }
    }

    getGlowColor(country) {
        const ctrl = country.control || 0;
        const inf = country.influence || 0;
        if (ctrl >= (CONFIG.CONTROL_THRESHOLD || 75)) return '#00ff88';
        if (inf >= (CONFIG.INFLUENCE_THRESHOLD || 50)) return '#4488ff';
        if (inf > 0) return '#335588';
        return '#223344';
    }

    updateCountryStats(code, stats) {
        if (this.countries[code]) {
            this.countries[code] = { ...this.countries[code], ...stats };
            this.dirty = true;
        }
    }

    requestRender() {
        if (!this.renderRequested) {
            this.renderRequested = true;
            requestAnimationFrame(() => {
                this.render();
            });
        }
    }
}

export default WorldMap;
