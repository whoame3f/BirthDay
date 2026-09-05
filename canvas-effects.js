/**
 * Canvas Visual Effects Controller (Particles, Route Path, Tulip Garden, Confetti)
 */

class VisualEffectsController {
    constructor() {
        this.bgCanvas = document.getElementById('bgCanvas');
        this.bgCtx = this.bgCanvas ? this.bgCanvas.getContext('2d') : null;
        
        this.routeCanvas = document.getElementById('routeCanvas');
        this.routeCtx = this.routeCanvas ? this.routeCanvas.getContext('2d') : null;

        this.tulipCanvas = document.getElementById('tulipCanvas');
        this.tulipCtx = this.tulipCanvas ? this.tulipCanvas.getContext('2d') : null;

        this.celebrationCanvas = document.getElementById('celebrationCanvas');
        this.celebrationCtx = this.celebrationCanvas ? this.celebrationCanvas.getContext('2d') : null;

        this.particles = [];
        this.confettiParticles = [];
        this.tulips = [];
        this.dashOffset = 0;

        this.init();
    }

    init() {
        this.resizeCanvases();
        window.addEventListener('resize', () => this.resizeCanvases());

        this.initBgParticles();
        this.initTulipGarden();
        this.animate();
    }

    resizeCanvases() {
        if (this.bgCanvas) {
            this.bgCanvas.width = window.innerWidth;
            this.bgCanvas.height = window.innerHeight;
        }

        if (this.routeCanvas && this.routeCanvas.parentElement) {
            const w = this.routeCanvas.parentElement.clientWidth;
            const h = this.routeCanvas.parentElement.clientHeight;
            if (w > 0 && h > 0) {
                this.routeCanvas.width = w;
                this.routeCanvas.height = h;
            }
        }

        this.ensureTulipCanvasSize();

        if (this.celebrationCanvas && this.celebrationCanvas.parentElement) {
            const w = this.celebrationCanvas.parentElement.clientWidth;
            const h = this.celebrationCanvas.parentElement.clientHeight;
            if (w > 0 && h > 0) {
                this.celebrationCanvas.width = w;
                this.celebrationCanvas.height = h;
            }
        }
    }

    ensureTulipCanvasSize() {
        if (!this.tulipCanvas || !this.tulipCanvas.parentElement) return;
        const parent = this.tulipCanvas.parentElement;
        const w = parent.clientWidth || parent.getBoundingClientRect().width;
        const h = parent.clientHeight || parent.getBoundingClientRect().height;

        if (w > 0 && h > 0) {
            const intW = Math.floor(w);
            const intH = Math.floor(h);
            if (this.tulipCanvas.width !== intW || this.tulipCanvas.height !== intH) {
                this.tulipCanvas.width = intW;
                this.tulipCanvas.height = intH;
                if (!this.tulips || this.tulips.length === 0 || (this.tulips[0] && this.tulips[0].y <= 0)) {
                    this.seedDefaultTulips();
                }
            }
        }
    }

    seedDefaultTulips() {
        this.tulips = [];
        const w = this.tulipCanvas.width || 500;
        const h = this.tulipCanvas.height || 300;

        for (let i = 0; i < 5; i++) {
            this.tulips.push({
                x: (w / 6) * (i + 1),
                y: h - 25,
                stemHeight: 0,
                maxStemHeight: Math.random() * 35 + 55,
                bloomProgress: 0,
                color: ['#ff758c', '#c77dff', '#ffd166', '#ff4d6d', '#ff85a1'][i % 5]
            });
        }
    }

    initBgParticles() {
        this.particles = [];
        const count = Math.min(Math.floor(window.innerWidth / 20), 40);
        
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                radius: Math.random() * 2 + 1,
                color: ['#ffd166', '#ff758c', '#c77dff', '#4cc9f0'][Math.floor(Math.random() * 4)],
                alpha: Math.random() * 0.6 + 0.2,
                vx: (Math.random() - 0.5) * 0.4,
                vy: -Math.random() * 0.5 - 0.2
            });
        }
    }

    initTulipGarden() {
        if (!this.tulipCanvas) return;
        this.ensureTulipCanvasSize();
        if (!this.tulips || this.tulips.length === 0) {
            this.seedDefaultTulips();
        }

        const plantTulip = (clientX, clientY) => {
            this.ensureTulipCanvasSize();
            const rect = this.tulipCanvas.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;

            this.tulips.push({
                x,
                y,
                stemHeight: 0,
                maxStemHeight: Math.random() * 40 + 65,
                bloomProgress: 0,
                color: ['#ff758c', '#c77dff', '#ffd166', '#ff4d6d', '#ff85a1'][Math.floor(Math.random() * 5)]
            });

            if (window.appController && window.appController.soundController) {
                window.appController.soundController.playSparkleChime();
            }
        };

        this.tulipCanvas.addEventListener('pointerdown', (e) => {
            plantTulip(e.clientX, e.clientY);
        });
    }

    drawRoute(currentStatus) {
        if (!this.routeCtx || !this.routeCanvas) return;

        const w = this.routeCanvas.width;
        const h = this.routeCanvas.height;

        this.routeCtx.clearRect(0, 0, w, h);

        const checkpoints = [
            { x: w * 0.10, y: h * 0.50 },
            { x: w * 0.30, y: h * 0.35 },
            { x: w * 0.50, y: h * 0.65 },
            { x: w * 0.70, y: h * 0.40 },
            { x: w * 0.85, y: h * 0.70 },
            { x: w * 0.95, y: h * 0.50 }
        ];

        this.routeCtx.beginPath();
        this.routeCtx.moveTo(checkpoints[0].x, checkpoints[0].y);

        for (let i = 1; i < checkpoints.length; i++) {
            const xc = (checkpoints[i].x + checkpoints[i - 1].x) / 2;
            const yc = (checkpoints[i].y + checkpoints[i - 1].y) / 2;
            this.routeCtx.quadraticCurveTo(checkpoints[i - 1].x, checkpoints[i - 1].y, xc, yc);
        }

        this.routeCtx.strokeStyle = 'rgba(199, 125, 255, 0.4)';
        this.routeCtx.lineWidth = 4;
        this.routeCtx.setLineDash([8, 6]);
        this.routeCtx.lineDashOffset = -this.dashOffset;
        this.routeCtx.stroke();
        this.routeCtx.setLineDash([]);
    }

    drawTulips() {
        if (!this.tulipCtx || !this.tulipCanvas) return;

        this.ensureTulipCanvasSize();

        this.tulipCtx.clearRect(0, 0, this.tulipCanvas.width, this.tulipCanvas.height);

        this.tulips.forEach(t => {
            if (t.stemHeight < t.maxStemHeight) {
                t.stemHeight += 1.5;
            } else if (t.bloomProgress < 1) {
                t.bloomProgress += 0.04;
            }

            const topY = t.y - t.stemHeight;

            // Stem
            this.tulipCtx.beginPath();
            this.tulipCtx.moveTo(t.x, t.y);
            this.tulipCtx.quadraticCurveTo(t.x + 10, t.y - t.stemHeight / 2, t.x, topY);
            this.tulipCtx.strokeStyle = '#48bb78';
            this.tulipCtx.lineWidth = 4;
            this.tulipCtx.stroke();

            // Leaf
            this.tulipCtx.beginPath();
            this.tulipCtx.moveTo(t.x, t.y - 15);
            this.tulipCtx.quadraticCurveTo(t.x + 20, t.y - 25, t.x + 15, t.y - 45);
            this.tulipCtx.quadraticCurveTo(t.x + 5, t.y - 30, t.x, t.y - 15);
            this.tulipCtx.fillStyle = '#38a169';
            this.tulipCtx.fill();

            // Petals Bloom
            if (t.bloomProgress > 0) {
                const size = 16 * t.bloomProgress;
                this.tulipCtx.save();
                this.tulipCtx.translate(t.x, topY);

                this.tulipCtx.beginPath();
                this.tulipCtx.arc(0, -size / 2, size, 0, Math.PI * 2);
                this.tulipCtx.fillStyle = t.color;
                this.tulipCtx.shadowColor = t.color;
                this.tulipCtx.shadowBlur = 15;
                this.tulipCtx.fill();

                this.tulipCtx.restore();
            }
        });
    }

    triggerConfettiBurst() {
        const count = 70;
        for (let i = 0; i < count; i++) {
            this.confettiParticles.push({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                vx: (Math.random() - 0.5) * 14,
                vy: (Math.random() - 0.8) * 12,
                radius: Math.random() * 6 + 3,
                color: ['#ffd166', '#ff758c', '#c77dff', '#4cc9f0', '#ffffff'][Math.floor(Math.random() * 5)],
                alpha: 1,
                decay: Math.random() * 0.02 + 0.01
            });
        }
    }

    triggerSparklesAroundElement(selector) {
        const el = document.querySelector(selector);
        if (!el) return;

        const rect = el.getBoundingClientRect();
        for (let i = 0; i < 30; i++) {
            this.confettiParticles.push({
                x: rect.left + rect.width / 2 + (Math.random() - 0.5) * rect.width,
                y: rect.top + rect.height / 2 + (Math.random() - 0.5) * rect.height,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                radius: Math.random() * 4 + 2,
                color: '#ffd166',
                alpha: 1,
                decay: 0.02
            });
        }
    }

    triggerCelebrationEffects() {
        this.triggerConfettiBurst();
    }

    animate() {
        // Bg Particles
        if (this.bgCtx && this.bgCanvas) {
            this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
            
            this.particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.y < 0) p.y = this.bgCanvas.height;
                if (p.x < 0) p.x = this.bgCanvas.width;
                if (p.x > this.bgCanvas.width) p.x = 0;

                this.bgCtx.beginPath();
                this.bgCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.bgCtx.fillStyle = p.color;
                this.bgCtx.globalAlpha = p.alpha;
                this.bgCtx.fill();
            });
            this.bgCtx.globalAlpha = 1;
        }

        // Route animation
        this.dashOffset += 0.4;
        if (window.appController && window.appController.activeTrackingData) {
            this.drawRoute(window.appController.activeTrackingData.status);
        }

        // Tulips
        this.drawTulips();

        // Confetti / Sparkles
        if (this.bgCtx) {
            for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
                const c = this.confettiParticles[i];
                c.x += c.vx;
                c.y += c.vy;
                c.vy += 0.2; // Gravity
                c.alpha -= c.decay;

                if (c.alpha <= 0) {
                    this.confettiParticles.splice(i, 1);
                    continue;
                }

                this.bgCtx.beginPath();
                this.bgCtx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
                this.bgCtx.fillStyle = c.color;
                this.bgCtx.globalAlpha = c.alpha;
                this.bgCtx.fill();
            }
            this.bgCtx.globalAlpha = 1;
        }

        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.effectsController = new VisualEffectsController();
});
