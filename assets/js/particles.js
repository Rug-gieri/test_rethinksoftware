/**
 * Rethink Software - 3D Particle Sphere Animation
 * Specific to index.html
 */

const canvas = document.getElementById('canvas-particles');
const ctx = canvas.getContext('2d');

let particlesArray = [];
const numberOfParticles = 500;

// Sphere Settings
const globeRadius = 300;
let rotationX = 0;
let rotationY = 0;
let rotationSpeedXX = 0;
let rotationSpeedYY = 0;

// Interaction
let mouseX = -9999;
let mouseY = -9999;
const interactionRadius = 200;
const perspective = 800;

window.addEventListener('mousemove', (event) => {
    mouseX = event.clientX - window.innerWidth / 2;
    mouseY = event.clientY - window.innerHeight / 2;

    rotationSpeedYY = (mouseX / window.innerWidth) * 0.02;
    rotationSpeedXX = -(mouseY / window.innerHeight) * 0.02;
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init();
});

class Particle3D {
    constructor() {
        // Organic Sphere (Volumetric Cloud)
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);

        // Volumetric Fuzz: Radius +/- 70px
        const r = globeRadius + (Math.random() * 140 - 70);

        this.ox = r * Math.sin(phi) * Math.cos(theta);
        this.oy = r * Math.sin(phi) * Math.sin(theta);
        this.oz = r * Math.cos(phi);

        this.x = this.ox;
        this.y = this.oy;
        this.z = this.oz;

        this.vx = 0;
        this.vy = 0;
        this.vz = 0;

        this.baseSize = Math.random() * 2 + 1;
        this.screenX = 0;
        this.screenY = 0;
        this.scale = 1;

        this.friction = 0.92;
        this.springFactor = 0.05;
    }

    update(rX, rY) {
        // 3D Rotation
        const cosY = Math.cos(rY);
        const sinY = Math.sin(rY);
        let tx1 = this.ox * cosY - this.oz * sinY;
        let tz1 = this.oz * cosY + this.ox * sinY;
        let ty1 = this.oy;

        const cosX = Math.cos(rX);
        const sinX = Math.sin(rX);
        let ty2 = ty1 * cosX - tz1 * sinX;
        let tz2 = tz1 * cosX + ty1 * sinX;
        let tx2 = tx1;

        const targetX = tx2;
        const targetY = ty2;
        const targetZ = tz2;

        // Physics: Spring to Target
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dz = targetZ - this.z;

        this.vx += dx * this.springFactor;
        this.vy += dy * this.springFactor;
        this.vz += dz * this.springFactor;

        // Projection for Interaction
        const distanceRatio = perspective / (perspective + this.z);
        const sX = this.x * distanceRatio;
        const sY = this.y * distanceRatio;

        // Physics: Mouse Repulsion
        const mDx = sX - mouseX;
        const mDy = sY - mouseY;
        const dist = Math.sqrt(mDx * mDx + mDy * mDy);

        if (dist < interactionRadius) {
            const force = (interactionRadius - dist) / interactionRadius;
            const angle = Math.atan2(mDy, mDx);
            const push = force * 15;
            this.vx += Math.cos(angle) * push;
            this.vy += Math.sin(angle) * push;
        }

        // Integration
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vz *= this.friction;

        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;

        // Final Projection
        this.scale = perspective / (perspective + this.z);
        this.screenX = (canvas.width / 2) + this.x * this.scale;
        this.screenY = (canvas.height / 2) + this.y * this.scale;
    }

    draw() {
        const alpha = Math.max(0.1, (this.z + globeRadius * 1.5) / (globeRadius * 3));
        ctx.beginPath();
        ctx.arc(this.screenX, this.screenY, this.baseSize * this.scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(32, 33, 36, ${alpha})`;
        ctx.fill();
    }
}

function init() {
    particlesArray = [];
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle3D());
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    rotationY += 0.003 + rotationSpeedYY;
    rotationX += 0.003 + rotationSpeedXX;
    rotationSpeedXX *= 0.95;
    rotationSpeedYY *= 0.95;

    particlesArray.forEach(p => {
        p.update(rotationX, rotationY);
        p.draw();
    });

    // Connect nearby particles
    for (let i = 0; i < particlesArray.length; i++) {
        for (let j = i; j < particlesArray.length; j++) {
            const p1 = particlesArray[i];
            const p2 = particlesArray[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dz = p1.z - p2.z;
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq < 4900) { // 70*70
                const alpha = Math.max(0.05, (p1.z + globeRadius) / (globeRadius * 2)) * 0.25;
                ctx.beginPath();
                ctx.strokeStyle = `rgba(32, 33, 36, ${alpha})`;
                ctx.lineWidth = 0.5 * p1.scale;
                ctx.moveTo(p1.screenX, p1.screenY);
                ctx.lineTo(p2.screenX, p2.screenY);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animate);
}

init();
animate();
