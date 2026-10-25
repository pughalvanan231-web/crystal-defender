/**
 * ============================================================================
 * CRYSTAL DEFENDER (Game ID: G0431)
 * 2D Tower Defense / Survival Game
 * Built for College World-Record Event
 * ============================================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. CONFIGURATION & CONSTANTS
  // --------------------------------------------------------------------------
  const CANVAS_WIDTH = 1000;
  const CANVAS_HEIGHT = 650;
  const CENTER_X = CANVAS_WIDTH / 2;
  const CENTER_Y = CANVAS_HEIGHT / 2;
  const CRYSTAL_MAX_HP = 100;
  const INITIAL_COINS = 150;
  const MAGIC_BOLT_COOLDOWN = 0.28; // seconds
  const MAGIC_BOLT_DAMAGE = 20;

  const TOWER_SPECS = {
    magic: {
      id: 'magic',
      name: 'Magic Tower',
      cost: 50,
      range: 160,
      damage: 15,
      fireRate: 0.8, // seconds per attack
      projectileSpeed: 420,
      color: '#9b5de5',
      glow: '#d946ef',
      icon: '🔮'
    },
    frost: {
      id: 'frost',
      name: 'Frost Tower',
      cost: 75,
      range: 140,
      damage: 8,
      fireRate: 1.1,
      projectileSpeed: 380,
      slowFactor: 0.5,
      slowDuration: 2.5, // seconds
      color: '#00f5d4',
      glow: '#70d6ff',
      icon: '❄️'
    }
  };

  // 6 Predefined strategic pedestals around the central crystal
  const PEDESTAL_CONFIGS = [
    { id: 1, x: 330, y: 200, label: 'NW' },
    { id: 2, x: 670, y: 200, label: 'NE' },
    { id: 3, x: 220, y: 325, label: 'W' },
    { id: 4, x: 780, y: 325, label: 'E' },
    { id: 5, x: 330, y: 450, label: 'SW' },
    { id: 6, x: 670, y: 450, label: 'SE' }
  ];

  // 5 Wave Configurations
  const WAVE_DEFINITIONS = [
    {
      waveNumber: 1,
      title: 'First Threat',
      description: 'Slow-moving Shadow Slimes approach. Tap or click them to fire Magic Bolts!',
      spawns: [
        { type: 'slime', delay: 1.0 },
        { type: 'slime', delay: 2.2 },
        { type: 'slime', delay: 2.0 },
        { type: 'slime', delay: 2.0 },
        { type: 'slime', delay: 1.8 },
        { type: 'slime', delay: 1.8 }
      ]
    },
    {
      waveNumber: 2,
      title: 'Growing Danger',
      description: 'Goblin Raiders join the assault! Build towers on stone pedestals for automatic defense.',
      spawns: [
        { type: 'slime', delay: 0.8 },
        { type: 'slime', delay: 1.2 },
        { type: 'goblin', delay: 2.0 },
        { type: 'slime', delay: 1.5 },
        { type: 'goblin', delay: 1.8 },
        { type: 'slime', delay: 1.5 },
        { type: 'goblin', delay: 1.8 },
        { type: 'goblin', delay: 2.0 }
      ]
    },
    {
      waveNumber: 3,
      title: 'Dark Forest Horde',
      description: 'Heavily armored Dark Knights enter the fray. Use Frost Towers to slow their march!',
      spawns: [
        { type: 'slime', delay: 0.6 },
        { type: 'goblin', delay: 1.0 },
        { type: 'slime', delay: 1.0 },
        { type: 'goblin', delay: 1.2 },
        { type: 'knight', delay: 2.2 },
        { type: 'slime', delay: 1.2 },
        { type: 'goblin', delay: 1.2 },
        { type: 'knight', delay: 2.5 },
        { type: 'slime', delay: 1.0 },
        { type: 'goblin', delay: 1.0 }
      ]
    },
    {
      waveNumber: 4,
      title: 'Monster Assault',
      description: 'The enemy launches a multi-pronged assault! Protect the crystal at all costs.',
      spawns: [
        { type: 'goblin', delay: 0.5 },
        { type: 'goblin', delay: 0.8 },
        { type: 'slime', delay: 0.8 },
        { type: 'knight', delay: 1.6 },
        { type: 'slime', delay: 0.8 },
        { type: 'goblin', delay: 1.0 },
        { type: 'knight', delay: 1.8 },
        { type: 'slime', delay: 0.8 },
        { type: 'goblin', delay: 1.0 },
        { type: 'knight', delay: 2.0 },
        { type: 'goblin', delay: 1.2 },
        { type: 'knight', delay: 2.0 }
      ]
    },
    {
      waveNumber: 5,
      title: 'Final Siege',
      description: 'The Dread Knight Commander leads the final wave! Slay the boss to save the magic crystal!',
      spawns: [
        { type: 'slime', delay: 0.5 },
        { type: 'slime', delay: 0.8 },
        { type: 'goblin', delay: 0.8 },
        { type: 'goblin', delay: 1.0 },
        { type: 'knight', delay: 1.5 },
        { type: 'knight', delay: 1.8 },
        { type: 'goblin', delay: 1.0 },
        { type: 'slime', delay: 0.8 },
        { type: 'knight', delay: 1.8 },
        { type: 'boss', delay: 3.0 }, // Powerful Boss Dark Knight
        { type: 'goblin', delay: 1.5 },
        { type: 'slime', delay: 1.2 },
        { type: 'goblin', delay: 1.5 }
      ]
    }
  ];

  // --------------------------------------------------------------------------
  // 2. PROCEDURAL SOUND SYNTHESIS (Web Audio API)
  // --------------------------------------------------------------------------
  class SoundManager {
    constructor() {
      this.ctx = null;
      this.enabled = localStorage.getItem('crystalDefender_soundEnabled') !== 'false';
      this.initialized = false;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
          this.initialized = true;
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('crystalDefender_soundEnabled', this.enabled ? 'true' : 'false');
      return this.enabled;
    }

    playBolt() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.14);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.15);
    }

    playFrost() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.2);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.2);
    }

    playHit() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.09);
    }

    playEnemyDefeat() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      // Two-tone cheerful pop
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, t);
      osc1.frequency.exponentialRampToValueAtTime(880, t + 0.12);
      gain1.gain.setValueAtTime(0.2, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.13);
    }

    playCrystalDamage() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.linearRampToValueAtTime(60, t + 0.3);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.36);
    }

    playTowerPlacement() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const notes = [330, 440, 660];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteStart = t + idx * 0.06;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.2, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.13);
      });
    }

    playWaveStart() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const chords = [261.6, 329.6, 392.0, 523.3]; // C chord arpeggio
      chords.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteStart = t + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.25, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.3);
      });
    }

    playVictory() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const notes = [261.6, 329.6, 392.0, 523.3, 659.3, 784.0];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteStart = t + idx * 0.1;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.3, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.45);
      });
    }

    playGameOver() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const notes = [392.0, 369.9, 329.6, 293.6, 261.6];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteStart = t + idx * 0.15;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.2, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.35);
      });
    }

    playError() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.setValueAtTime(110, t + 0.08);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.17);
    }
  }

  // --------------------------------------------------------------------------
  // 3. PARTICLE & FLOATING TEXT SYSTEMS
  // --------------------------------------------------------------------------
  class Particle {
    constructor(x, y, vx, vy, color, size, life, shape = 'circle') {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color;
      this.size = size;
      this.life = life;
      this.maxLife = life;
      this.shape = shape;
      this.alpha = 1;
    }

    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.vx *= 0.96;
      this.vy *= 0.96;
      this.life -= dt;
      this.alpha = Math.max(0, this.life / this.maxLife);
    }

    draw(ctx) {
      if (this.alpha <= 0) return;
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 6;

      if (this.shape === 'star') {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  class FloatingText {
    constructor(text, x, y, color = '#ffffff', fontSize = 14) {
      this.text = text;
      this.x = x;
      this.y = y;
      this.color = color;
      this.fontSize = fontSize;
      this.life = 0.9; // seconds
      this.maxLife = 0.9;
      this.vy = -35; // floats upward
    }

    update(dt) {
      this.y += this.vy * dt;
      this.life -= dt;
    }

    draw(ctx) {
      const alpha = Math.max(0, this.life / this.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `bold ${this.fontSize}px 'Outfit', sans-serif`;
      ctx.fillStyle = this.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(this.text, this.x, this.y);
      ctx.restore();
    }
  }

  // --------------------------------------------------------------------------
  // 4. ENTITIES: CRYSTAL, TOWER, ENEMY, PROJECTILE
  // --------------------------------------------------------------------------

  // Central Magical Crystal
  class Crystal {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.radius = 34;
      this.hp = CRYSTAL_MAX_HP;
      this.maxHp = CRYSTAL_MAX_HP;
      this.pulseTimer = 0;
      this.hitFlashTimer = 0;
      this.destroyed = false;
      this.destructionTimer = 0;
    }

    takeDamage(amount) {
      this.hp = Math.max(0, this.hp - amount);
      this.hitFlashTimer = 0.2;
      if (this.hp <= 0 && !this.destroyed) {
        this.destroyed = true;
        this.destructionTimer = 1.5;
      }
      return this.hp;
    }

    update(dt) {
      this.pulseTimer += dt * 2.5;
      if (this.hitFlashTimer > 0) {
        this.hitFlashTimer -= dt;
      }
      if (this.destroyed && this.destructionTimer > 0) {
        this.destructionTimer -= dt;
      }
    }

    draw(ctx) {
      ctx.save();
      const pulse = Math.sin(this.pulseTimer) * 4;
      const isDamaged = this.hitFlashTimer > 0;
      const hpRatio = this.hp / this.maxHp;

      // Outer Magic Aura
      const auraGrad = ctx.createRadialGradient(this.x, this.y, 10, this.x, this.y, this.radius + 30 + pulse);
      if (isDamaged) {
        auraGrad.addColorStop(0, 'rgba(239, 35, 60, 0.8)');
        auraGrad.addColorStop(1, 'rgba(239, 35, 60, 0)');
      } else if (hpRatio < 0.3) {
        auraGrad.addColorStop(0, 'rgba(255, 107, 107, 0.6)');
        auraGrad.addColorStop(1, 'rgba(255, 107, 107, 0)');
      } else {
        auraGrad.addColorStop(0, 'rgba(0, 245, 212, 0.6)');
        auraGrad.addColorStop(0.6, 'rgba(155, 93, 229, 0.3)');
        auraGrad.addColorStop(1, 'rgba(0, 245, 212, 0)');
      }

      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 30 + pulse, 0, Math.PI * 2);
      ctx.fill();

      // Magic Runic Pedestal Platform under crystal
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.pulseTimer * 0.2);
      ctx.strokeStyle = isDamaged ? '#ef233c' : 'rgba(0, 245, 212, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const px = Math.cos(angle) * (this.radius + 12);
        const py = Math.sin(angle) * (this.radius + 12);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // Draw Multi-Faceted Gemstone Crystal
      ctx.save();
      ctx.translate(this.x, this.y);

      // Top point (0, -radius - 4)
      // Left point (-radius + 4, 0)
      // Right point (radius - 4, 0)
      // Bottom point (0, radius + 4)
      const r = this.radius;

      // Facet shading
      ctx.shadowColor = isDamaged ? '#ef233c' : '#00f5d4';
      ctx.shadowBlur = 18 + pulse;

      // Top Left facet
      ctx.beginPath();
      ctx.moveTo(0, -r - 4);
      ctx.lineTo(-r + 6, -2);
      ctx.lineTo(0, 4);
      ctx.closePath();
      ctx.fillStyle = isDamaged ? '#ff758f' : '#2dfce0';
      ctx.fill();

      // Top Right facet
      ctx.beginPath();
      ctx.moveTo(0, -r - 4);
      ctx.lineTo(r - 6, -2);
      ctx.lineTo(0, 4);
      ctx.closePath();
      ctx.fillStyle = isDamaged ? '#ff4d6d' : '#00bbf9';
      ctx.fill();

      // Bottom Left facet
      ctx.beginPath();
      ctx.moveTo(-r + 6, -2);
      ctx.lineTo(0, r + 4);
      ctx.lineTo(0, 4);
      ctx.closePath();
      ctx.fillStyle = isDamaged ? '#c9184a' : '#7209b7';
      ctx.fill();

      // Bottom Right facet
      ctx.beginPath();
      ctx.moveTo(r - 6, -2);
      ctx.lineTo(0, r + 4);
      ctx.lineTo(0, 4);
      ctx.closePath();
      ctx.fillStyle = isDamaged ? '#a4133c' : '#4361ee';
      ctx.fill();

      // Inner Core Glow
      ctx.beginPath();
      ctx.arc(0, 0, 7 + pulse * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.restore();

      // Crystal In-World Health Bar (clean, floating below crystal)
      const barW = 70;
      const barH = 7;
      const barX = this.x - barW / 2;
      const barY = this.y + this.radius + 18;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

      let hpCol = '#00f5d4';
      if (hpRatio < 0.3) hpCol = '#ef233c';
      else if (hpRatio < 0.6) hpCol = '#ffd166';

      ctx.fillStyle = hpCol;
      ctx.fillRect(barX, barY, Math.max(0, barW * hpRatio), barH);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);

      ctx.restore();
    }
  }

  // Defensive Tower
  class Tower {
    constructor(spec, x, y) {
      this.spec = spec;
      this.type = spec.id;
      this.x = x;
      this.y = y;
      this.range = spec.range;
      this.damage = spec.damage;
      this.fireRate = spec.fireRate;
      this.cooldown = 0;
      this.rotation = 0;
      this.target = null;
      this.recoil = 0;
    }

    update(dt, enemies) {
      if (this.cooldown > 0) this.cooldown -= dt;
      if (this.recoil > 0) this.recoil -= dt * 4;

      // Find nearest alive enemy in range
      let bestDist = this.range;
      this.target = null;

      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.isDead) continue;
        const dist = Math.hypot(e.x - this.x, e.y - this.y);
        if (dist <= bestDist) {
          bestDist = dist;
          this.target = e;
        }
      }

      if (this.target) {
        this.rotation = Math.atan2(this.target.y - this.y, this.target.x - this.x);
        if (this.cooldown <= 0) {
          this.shoot();
          this.cooldown = this.fireRate;
          this.recoil = 1;
        }
      }
    }

    shoot() {
      if (!this.target) return;
      window.game.spawnTowerProjectile(this);
    }

    draw(ctx, isHovered = false) {
      ctx.save();

      // Show attack range circle when hovered
      if (isHovered) {
        ctx.strokeStyle = this.type === 'frost' ? 'rgba(112, 214, 255, 0.4)' : 'rgba(155, 93, 229, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Stone Pedestal Base
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = this.spec.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = this.spec.glow;
      ctx.shadowBlur = 10;
      ctx.stroke();

      // Runic obelisk head rotating to target
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);

      if (this.type === 'magic') {
        // Magic Tower: Arcane Crystal Orb atop obsidian mount
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-10, -6, 16, 12);

        // Firing crystal orb
        ctx.beginPath();
        ctx.arc(4, 0, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#9b5de5';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(4, 0, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      } else {
        // Frost Tower: Crystalline Ice Shards
        ctx.fillStyle = '#0b192c';
        ctx.fillRect(-8, -7, 14, 14);

        // Frost crystal spike
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(2, -7);
        ctx.lineTo(2, 7);
        ctx.closePath();
        ctx.fillStyle = '#00f5d4';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }

      ctx.restore();
      ctx.restore();
    }
  }

  // Pre-placed pedestal socket on the ground
  class Pedestal {
    constructor(config) {
      this.id = config.id;
      this.x = config.x;
      this.y = config.y;
      this.radius = 26;
      this.tower = null;
      this.isHovered = false;
      this.pulseTimer = Math.random() * 5;
    }

    update(dt) {
      this.pulseTimer += dt * 3;
    }

    isPointInside(px, py) {
      return Math.hypot(px - this.x, py - this.y) <= this.radius;
    }

    draw(ctx) {
      ctx.save();
      const pulse = Math.sin(this.pulseTimer) * 0.3 + 0.7;

      if (!this.tower) {
        // Empty pedestal socket with glowing runes
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = this.isHovered ? 'rgba(0, 245, 212, 0.9)' : `rgba(0, 245, 212, ${0.3 * pulse})`;
        ctx.lineWidth = this.isHovered ? 2.5 : 1.5;
        if (this.isHovered) {
          ctx.shadowColor = '#00f5d4';
          ctx.shadowBlur = 12;
        }
        ctx.stroke();

        // Inner glowing rune
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.stroke();

        ctx.fillStyle = this.isHovered ? '#00f5d4' : 'rgba(255, 255, 255, 0.4)';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', this.x, this.y);
      } else {
        // Draw the placed tower
        this.tower.draw(ctx, this.isHovered);
      }

      ctx.restore();
    }
  }

  // Enemies
  class Enemy {
    constructor(type, startX, startY) {
      this.type = type; // 'slime', 'goblin', 'knight', 'boss'
      this.x = startX;
      this.y = startY;
      this.isDead = false;
      this.hitFlash = 0;
      this.slowTimer = 0;
      this.slowFactor = 1;
      this.animTimer = Math.random() * 5;

      switch (type) {
        case 'slime':
          this.name = 'Shadow Slime';
          this.maxHp = 20;
          this.baseSpeed = 45;
          this.crystalDamage = 5;
          this.rewardPoints = 10;
          this.rewardCoins = 10;
          this.radius = 16;
          this.color = '#9d4edd';
          this.eyeColor = '#ff007f';
          break;
        case 'goblin':
          this.name = 'Goblin Raider';
          this.maxHp = 40;
          this.baseSpeed = 70;
          this.crystalDamage = 10;
          this.rewardPoints = 20;
          this.rewardCoins = 20;
          this.radius = 18;
          this.color = '#38b000';
          this.eyeColor = '#ffff3f';
          break;
        case 'knight':
          this.name = 'Dark Knight';
          this.maxHp = 80;
          this.baseSpeed = 35;
          this.crystalDamage = 20;
          this.rewardPoints = 40;
          this.rewardCoins = 40;
          this.radius = 22;
          this.color = '#d90429';
          this.eyeColor = '#ff4d6d';
          break;
        case 'boss':
          this.name = 'Dread Knight Commander';
          this.maxHp = 250;
          this.baseSpeed = 30;
          this.crystalDamage = 35;
          this.rewardPoints = 100;
          this.rewardCoins = 100;
          this.radius = 30;
          this.color = '#780000';
          this.eyeColor = '#ff0055';
          break;
      }

      this.hp = this.maxHp;
      this.speed = this.baseSpeed;
    }

    applyDamage(amount) {
      if (this.isDead) return false;
      this.hp -= amount;
      this.hitFlash = 0.1;
      if (this.hp <= 0) {
        this.hp = 0;
        this.isDead = true;
        return true; // killed
      }
      return false;
    }

    applySlow(factor, duration) {
      this.slowFactor = factor;
      this.slowTimer = Math.max(this.slowTimer, duration);
    }

    update(dt, targetX, targetY) {
      if (this.isDead) return;

      this.animTimer += dt * 4;

      if (this.hitFlash > 0) this.hitFlash -= dt;

      // Handle Slow effect
      if (this.slowTimer > 0) {
        this.slowTimer -= dt;
        this.speed = this.baseSpeed * this.slowFactor;
      } else {
        this.speed = this.baseSpeed;
      }

      // Move directly toward target (central crystal)
      const dx = targetX - this.x;
      const dy = targetY - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 1) {
        this.x += (dx / dist) * this.speed * dt;
        this.y += (dy / dist) * this.speed * dt;
      }
    }

    draw(ctx) {
      if (this.isDead) return;

      ctx.save();
      ctx.translate(this.x, this.y);

      // Facing angle towards center
      const angle = Math.atan2(CENTER_Y - this.y, CENTER_X - this.x);
      ctx.rotate(angle);

      const isHit = this.hitFlash > 0;
      const isSlowed = this.slowTimer > 0;

      // Slow Frost Aura Mote
      if (isSlowed) {
        ctx.strokeStyle = 'rgba(0, 245, 212, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 1. DRAW BODY BASED ON ENEMY TYPE
      if (this.type === 'slime') {
        const wobble = Math.sin(this.animTimer) * 2;
        ctx.fillStyle = isHit ? '#ffffff' : (isSlowed ? '#70d6ff' : this.color);
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius + wobble, this.radius - wobble, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dark slime inner core
        ctx.fillStyle = isHit ? '#ffd166' : '#5a189a';
        ctx.beginPath();
        ctx.arc(2, 0, this.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Glowing eyes looking forward
        ctx.fillStyle = this.eyeColor;
        ctx.beginPath();
        ctx.arc(this.radius * 0.5, -4, 3, 0, Math.PI * 2);
        ctx.arc(this.radius * 0.5, 4, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.type === 'goblin') {
        // Goblin: Fast runner with pointed ears and daggers
        const legWobble = Math.sin(this.animTimer * 2) * 5;

        // Running limbs
        ctx.strokeStyle = '#2b9348';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-6, -8);
        ctx.lineTo(-12 + legWobble, -12);
        ctx.moveTo(-6, 8);
        ctx.lineTo(-12 - legWobble, 12);
        ctx.stroke();

        // Goblin Torso & Head
        ctx.fillStyle = isHit ? '#ffffff' : (isSlowed ? '#70d6ff' : this.color);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius - 2, 0, Math.PI * 2);
        ctx.fill();

        // Spiky Goblin Ears
        ctx.beginPath();
        ctx.moveTo(-2, -this.radius + 2);
        ctx.lineTo(-8, -this.radius - 8);
        ctx.lineTo(4, -this.radius + 4);
        ctx.moveTo(-2, this.radius - 2);
        ctx.lineTo(-8, this.radius + 8);
        ctx.lineTo(4, this.radius - 4);
        ctx.fillStyle = '#2d6a4f';
        ctx.fill();

        // Twin Daggers
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(8, -8);
        ctx.lineTo(18, -12);
        ctx.moveTo(8, 8);
        ctx.lineTo(18, 12);
        ctx.stroke();

        // Glowing menacing eyes
        ctx.fillStyle = this.eyeColor;
        ctx.beginPath();
        ctx.arc(6, -4, 2.5, 0, Math.PI * 2);
        ctx.arc(6, 4, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.type === 'knight' || this.type === 'boss') {
        // Dark Knight: Heavy spiked armor, greatshield & blade
        const isBoss = this.type === 'boss';

        // Dark Cape
        ctx.fillStyle = '#2b0914';
        ctx.beginPath();
        ctx.moveTo(-this.radius, -this.radius * 0.8);
        ctx.lineTo(-this.radius - (isBoss ? 16 : 10), 0);
        ctx.lineTo(-this.radius, this.radius * 0.8);
        ctx.closePath();
        ctx.fill();

        // Armored silhouette
        ctx.fillStyle = isHit ? '#ffffff' : (isSlowed ? '#70d6ff' : this.color);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Spiked pauldrons / horns
        ctx.fillStyle = '#1f030a';
        ctx.beginPath();
        ctx.moveTo(-4, -this.radius - 2);
        ctx.lineTo(6, -this.radius - (isBoss ? 12 : 7));
        ctx.lineTo(8, -this.radius + 2);
        ctx.moveTo(-4, this.radius + 2);
        ctx.lineTo(6, this.radius + (isBoss ? 12 : 7));
        ctx.lineTo(8, this.radius - 2);
        ctx.fill();

        // Glowing crimson eye visor slit
        ctx.fillStyle = isBoss ? '#ffff00' : this.eyeColor;
        ctx.shadowColor = this.eyeColor;
        ctx.shadowBlur = 8;
        ctx.fillRect(4, -5, 4, 10);
        ctx.shadowBlur = 0;

        // Boss Flaming Aura
        if (isBoss) {
          ctx.strokeStyle = 'rgba(255, 0, 85, 0.7)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.restore();

      // 2. ENEMY HEALTH BAR (Drawn above enemy head in world space)
      const barW = this.radius * 2;
      const barH = 5;
      const barX = this.x - barW / 2;
      const barY = this.y - this.radius - 10;
      const hpRatio = Math.max(0, this.hp / this.maxHp);

      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

      let barColor = '#38b000';
      if (hpRatio < 0.35) barColor = '#ef233c';
      else if (hpRatio < 0.7) barColor = '#ffd166';

      ctx.fillStyle = barColor;
      ctx.fillRect(barX, barY, barW * hpRatio, barH);
      ctx.restore();
    }
  }

  // Projectiles (Magic Bolt from player or Towers)
  class Projectile {
    constructor(startX, startY, targetX, targetY, type, damage, speed, slow = null) {
      this.x = startX;
      this.y = startY;
      this.type = type; // 'player_bolt', 'magic_tower', 'frost_tower'
      this.damage = damage;
      this.speed = speed;
      this.slow = slow; // { factor, duration }
      this.isDead = false;
      this.radius = type === 'player_bolt' ? 7 : 5;

      const dx = targetX - startX;
      const dy = targetY - startY;
      const dist = Math.hypot(dx, dy) || 1;
      this.vx = (dx / dist) * speed;
      this.vy = (dy / dist) * speed;

      this.life = 2.0; // max seconds before disappearing
    }

    update(dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.life -= dt;
      if (this.life <= 0) this.isDead = true;

      // Bound checks
      if (this.x < -20 || this.x > CANVAS_WIDTH + 20 || this.y < -20 || this.y > CANVAS_HEIGHT + 20) {
        this.isDead = true;
      }
    }

    draw(ctx) {
      ctx.save();
      if (this.type === 'player_bolt') {
        // Vibrant Cyan / Magenta Arcane Spark
        ctx.fillStyle = '#00f5d4';
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.type === 'magic_tower') {
        // Purple Arcane Energy Bolt
        ctx.fillStyle = '#9b5de5';
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.type === 'frost_tower') {
        // Crystalline Ice Shard
        ctx.fillStyle = '#70d6ff';
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // --------------------------------------------------------------------------
  // 5. MASTER GAME ENGINE
  // --------------------------------------------------------------------------
  class CrystalDefenderGame {
    constructor() {
      // DOM Elements
      this.canvas = document.getElementById('gameCanvas');
      this.ctx = this.canvas.getContext('2d');

      this.hudOverlay = document.getElementById('hud-overlay');
      this.menuOverlay = document.getElementById('menu-overlay');
      this.howToPlayModal = document.getElementById('how-to-play-modal');
      this.pauseModal = document.getElementById('pause-modal');
      this.gameoverModal = document.getElementById('gameover-modal');
      this.victoryModal = document.getElementById('victory-modal');
      this.toastEl = document.getElementById('toast-notification');

      // Top HUD Elements
      this.crystalHpBar = document.getElementById('crystal-hp-bar');
      this.crystalHpText = document.getElementById('crystal-hp-text');
      this.waveTitleDisplay = document.getElementById('wave-title-display');
      this.waveNameDisplay = document.getElementById('wave-name-display');
      this.enemiesRemainingText = document.getElementById('enemies-remaining-text');
      this.coinCounter = document.getElementById('coin-counter');
      this.scoreCounter = document.getElementById('score-counter');
      this.soundIcon = document.getElementById('sound-icon');
      this.menuSoundIcon = document.getElementById('menu-sound-icon');
      this.menuBestScore = document.getElementById('menu-best-score');

      // Bottom HUD Elements
      this.boltCooldownOverlay = document.getElementById('bolt-cooldown-overlay');
      this.cardMagicTower = document.getElementById('card-magic-tower');
      this.cardFrostTower = document.getElementById('card-frost-tower');
      this.btnCancelPlacement = document.getElementById('btn-cancel-placement');

      // Prep Banner Elements
      this.wavePrepBanner = document.getElementById('wave-prep-banner');
      this.prepTitle = document.getElementById('prep-title');
      this.prepSubtext = document.getElementById('prep-subtext');
      this.prepCountdown = document.getElementById('prep-countdown');
      this.btnStartWaveNow = document.getElementById('btn-start-wave-now');

      // Results Elements
      this.goFinalScore = document.getElementById('go-final-score');
      this.goBestScore = document.getElementById('go-best-score');
      this.goWaveReached = document.getElementById('go-wave-reached');
      this.goEnemiesSlain = document.getElementById('go-enemies-slain');

      this.vicFinalScore = document.getElementById('vic-final-score');
      this.vicBestScore = document.getElementById('vic-best-score');
      this.vicCrystalHp = document.getElementById('vic-crystal-hp');
      this.vicEnemiesSlain = document.getElementById('vic-enemies-slain');

      // Subsystems
      this.sound = new SoundManager();

      // State Management
      this.state = 'MENU'; // 'MENU', 'PLAYING', 'PREP', 'PAUSED', 'GAME_OVER', 'VICTORY'
      this.bestScore = parseInt(localStorage.getItem('crystalDefender_highScore') || '0', 10);
      this.menuBestScore.textContent = this.bestScore.toLocaleString();

      // Game Entities & Variables
      this.crystal = new Crystal(CENTER_X, CENTER_Y);
      this.pedestals = PEDESTAL_CONFIGS.map(c => new Pedestal(c));
      this.enemies = [];
      this.projectiles = [];
      this.particles = [];
      this.floatingTexts = [];

      this.score = 0;
      this.coins = INITIAL_COINS;
      this.currentWaveIndex = 0;
      this.waveSpawnQueue = [];
      this.waveSpawnTimer = 0;
      this.totalWaveEnemies = 0;
      this.enemiesSlainTotal = 0;

      // Player Attack Cooldown
      this.magicBoltCooldownTimer = 0;

      // Tower Placement Mode
      this.activePlacementType = null; // 'magic' or 'frost'

      // Wave Prep Countdown
      this.prepTimeRemaining = 0;

      // Ambient motes
      this.ambientParticles = [];
      this.initAmbientParticles();

      // Screen Shake
      this.shakeDuration = 0;
      this.shakeIntensity = 0;

      // Game Loop
      this.lastTimestamp = 0;
      this.animationFrameId = null;

      // Mouse & Canvas Tracking
      this.mouse = { x: 0, y: 0, isHoveringCanvas: false };

      this.bindEvents();
      this.updateSoundIcons();
      this.render(); // Start drawing initial background loop
      requestAnimationFrame(ts => this.gameLoop(ts));
    }

    initAmbientParticles() {
      this.ambientParticles = [];
      for (let i = 0; i < 40; i++) {
        this.ambientParticles.push({
          x: Math.random() * CANVAS_WIDTH,
          y: Math.random() * CANVAS_HEIGHT,
          radius: Math.random() * 2 + 1,
          color: Math.random() > 0.5 ? 'rgba(0, 245, 212, ' : 'rgba(155, 93, 229, ',
          alpha: Math.random() * 0.4 + 0.1,
          speedY: -(Math.random() * 15 + 10),
          speedX: (Math.random() - 0.5) * 8
        });
      }
    }

    // ------------------------------------------------------------------------
    // EVENT LISTENERS & INPUT MAPPING
    // ------------------------------------------------------------------------
    bindEvents() {
      // Coordinate transformation helper
      const getCanvasCoords = e => {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY
        };
      };

      // Mouse Move on Canvas
      this.canvas.addEventListener('mousemove', e => {
        const coords = getCanvasCoords(e);
        this.mouse.x = coords.x;
        this.mouse.y = coords.y;
        this.mouse.isHoveringCanvas = true;
        this.checkPedestalHovers(coords.x, coords.y);
      });

      this.canvas.addEventListener('mouseleave', () => {
        this.mouse.isHoveringCanvas = false;
        this.pedestals.forEach(p => (p.isHovered = false));
      });

      // Canvas Click / Tap (Fire Magic Bolt or Place Tower)
      const handleCanvasAction = (x, y) => {
        if (this.state !== 'PLAYING' && this.state !== 'PREP') return;

        // 1. Check if clicking on a pedestal
        const clickedPedestal = this.pedestals.find(p => p.isPointInside(x, y));

        if (clickedPedestal) {
          if (!clickedPedestal.tower) {
            // Empty pedestal clicked
            if (this.activePlacementType) {
              this.placeTowerOnPedestal(clickedPedestal, this.activePlacementType);
              return;
            } else {
              // Quick helper: if player clicks empty pedestal without selecting, auto-suggest or build Magic Tower if affordable
              if (this.coins >= TOWER_SPECS.magic.cost) {
                this.placeTowerOnPedestal(clickedPedestal, 'magic');
                return;
              } else {
                this.showToast('Need 50 coins to build a Magic Tower!');
                this.sound.playError();
                return;
              }
            }
          } else {
            // Already occupied: show brief info
            this.showToast(`${clickedPedestal.tower.spec.name} is guarding here!`);
            return;
          }
        }

        // 2. If not clicking pedestal, fire Magic Bolt toward click point
        if (this.state === 'PLAYING') {
          this.firePlayerBolt(x, y);
        }
      };

      this.canvas.addEventListener('mousedown', e => {
        if (e.button !== 0) return; // Left click only
        const coords = getCanvasCoords(e);
        handleCanvasAction(coords.x, coords.y);
      });

      this.canvas.addEventListener('touchstart', e => {
        if (e.touches.length > 0) {
          const coords = getCanvasCoords(e);
          handleCanvasAction(coords.x, coords.y);
        }
      }, { passive: true });

      // Menu Button Handlers
      document.getElementById('btn-play-game').addEventListener('click', () => {
        this.startNewGame();
      });

      document.getElementById('btn-how-to-play').addEventListener('click', () => {
        this.howToPlayModal.classList.remove('hidden');
      });

      document.getElementById('btn-close-how-to-play').addEventListener('click', () => {
        this.howToPlayModal.classList.add('hidden');
      });

      document.getElementById('btn-how-to-play-got-it').addEventListener('click', () => {
        this.howToPlayModal.classList.add('hidden');
      });

      // Sound Toggles
      const toggleSoundAction = () => {
        const enabled = this.sound.toggle();
        this.updateSoundIcons();
        this.showToast(enabled ? 'Sound FX Enabled 🔊' : 'Sound FX Muted 🔇');
      };

      document.getElementById('btn-sound-toggle').addEventListener('click', toggleSoundAction);
      document.getElementById('btn-menu-sound').addEventListener('click', toggleSoundAction);
      document.getElementById('btn-pause-sound').addEventListener('click', toggleSoundAction);

      // Pause Handlers
      document.getElementById('btn-pause').addEventListener('click', () => {
        this.togglePause();
      });

      document.getElementById('btn-resume').addEventListener('click', () => {
        this.togglePause();
      });

      document.getElementById('btn-pause-restart').addEventListener('click', () => {
        this.pauseModal.classList.add('hidden');
        this.startNewGame();
      });

      document.getElementById('btn-pause-menu').addEventListener('click', () => {
        this.pauseModal.classList.add('hidden');
        this.returnToMenu();
      });

      // Tower Selection Shop Buttons
      this.cardMagicTower.addEventListener('click', () => {
        this.selectTowerForPlacement('magic');
      });

      this.cardFrostTower.addEventListener('click', () => {
        this.selectTowerForPlacement('frost');
      });

      this.btnCancelPlacement.addEventListener('click', () => {
        this.cancelPlacementMode();
      });

      // Prep Banner "Start Wave Now" button
      this.btnStartWaveNow.addEventListener('click', () => {
        if (this.state === 'PREP') {
          this.prepTimeRemaining = 0;
          this.startNextWave();
        }
      });

      // Game Over / Victory Buttons
      document.getElementById('btn-gameover-restart').addEventListener('click', () => {
        this.gameoverModal.classList.add('hidden');
        this.startNewGame();
      });

      document.getElementById('btn-gameover-menu').addEventListener('click', () => {
        this.gameoverModal.classList.add('hidden');
        this.returnToMenu();
      });

      document.getElementById('btn-victory-restart').addEventListener('click', () => {
        this.victoryModal.classList.add('hidden');
        this.startNewGame();
      });

      document.getElementById('btn-victory-menu').addEventListener('click', () => {
        this.victoryModal.classList.add('hidden');
        this.returnToMenu();
      });

      // Keyboard Hotkeys
      window.addEventListener('keydown', e => {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          if (this.state === 'PLAYING' || this.state === 'PAUSED' || this.state === 'PREP') {
            this.togglePause();
          }
        } else if (e.key === 'm' || e.key === 'M') {
          toggleSoundAction();
        } else if (e.key === '1') {
          if (this.state === 'PLAYING' || this.state === 'PREP') {
            this.selectTowerForPlacement('magic');
          }
        } else if (e.key === '2') {
          if (this.state === 'PLAYING' || this.state === 'PREP') {
            this.selectTowerForPlacement('frost');
          }
        }
      });
    }

    checkPedestalHovers(mx, my) {
      this.pedestals.forEach(p => {
        p.isHovered = p.isPointInside(mx, my);
      });
    }

    updateSoundIcons() {
      const isEnabled = this.sound.enabled;
      this.soundIcon.textContent = isEnabled ? '🔊' : '🔇';
      this.menuSoundIcon.textContent = isEnabled ? '🔊' : '🔇';
      const menuBtn = document.getElementById('btn-menu-sound');
      if (menuBtn) {
        menuBtn.innerHTML = `<span id="menu-sound-icon">${isEnabled ? '🔊' : '🔇'}</span> Sound: ${isEnabled ? 'ON' : 'OFF'}`;
      }
    }

    showToast(message) {
      if (!this.toastEl) return;
      this.toastEl.textContent = message;
      this.toastEl.classList.remove('hidden');

      // Reset animation
      this.toastEl.style.animation = 'none';
      void this.toastEl.offsetWidth; // trigger reflow
      this.toastEl.style.animation = 'toastFade 1.8s ease forwards';
    }

    // ------------------------------------------------------------------------
    // TOWER PLACEMENT LOGIC
    // ------------------------------------------------------------------------
    selectTowerForPlacement(type) {
      const spec = TOWER_SPECS[type];
      if (this.coins < spec.cost) {
        this.showToast(`Not enough coins! Need ${spec.cost} 🪙`);
        this.sound.playError();
        return;
      }

      if (this.activePlacementType === type) {
        // Deselect if clicked again
        this.cancelPlacementMode();
        return;
      }

      this.activePlacementType = type;
      this.cardMagicTower.classList.toggle('selected', type === 'magic');
      this.cardFrostTower.classList.toggle('selected', type === 'frost');
      this.btnCancelPlacement.classList.remove('hidden');
      this.showToast(`Click any glowing stone pedestal to place ${spec.name}!`);
    }

    cancelPlacementMode() {
      this.activePlacementType = null;
      this.cardMagicTower.classList.remove('selected');
      this.cardFrostTower.classList.remove('selected');
      this.btnCancelPlacement.classList.add('hidden');
    }

    placeTowerOnPedestal(pedestal, type) {
      const spec = TOWER_SPECS[type];
      if (this.coins < spec.cost) {
        this.showToast(`Not enough coins! Need ${spec.cost} 🪙`);
        this.sound.playError();
        return;
      }

      // Deduct coins & spawn tower
      this.coins -= spec.cost;
      this.updateHudResources();

      pedestal.tower = new Tower(spec, pedestal.x, pedestal.y);
      this.sound.playTowerPlacement();

      // Spawn celebration particles at pedestal
      for (let i = 0; i < 16; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 60 + 30;
        this.particles.push(
          new Particle(
            pedestal.x,
            pedestal.y,
            Math.cos(angle) * spd,
            Math.sin(angle) * spd,
            spec.color,
            Math.random() * 3 + 2,
            0.6
          )
        );
      }

      this.floatingTexts.push(
        new FloatingText(`-${spec.cost} 🪙`, pedestal.x, pedestal.y - 15, '#ffd166', 15)
      );

      this.cancelPlacementMode();
      this.showToast(`${spec.name} placed!`);
    }

    // ------------------------------------------------------------------------
    // PLAYER COMBAT & PROJECTILE LOGIC
    // ------------------------------------------------------------------------
    firePlayerBolt(targetX, targetY) {
      if (this.magicBoltCooldownTimer > 0) return;

      this.magicBoltCooldownTimer = MAGIC_BOLT_COOLDOWN;
      this.sound.playBolt();

      // Spawns from the central crystal toward click point
      const proj = new Projectile(
        this.crystal.x,
        this.crystal.y,
        targetX,
        targetY,
        'player_bolt',
        MAGIC_BOLT_DAMAGE,
        550
      );
      this.projectiles.push(proj);

      // Flash & sparks at crystal
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2;
        this.particles.push(
          new Particle(
            this.crystal.x,
            this.crystal.y,
            Math.cos(a) * 40,
            Math.sin(a) * 40,
            '#00f5d4',
            2,
            0.3
          )
        );
      }
    }

    spawnTowerProjectile(tower) {
      if (!tower.target || tower.target.isDead) return;

      if (tower.type === 'magic') {
        this.sound.playBolt();
        this.projectiles.push(
          new Projectile(
            tower.x,
            tower.y,
            tower.target.x,
            tower.target.y,
            'magic_tower',
            tower.damage,
            tower.spec.projectileSpeed
          )
        );
      } else if (tower.type === 'frost') {
        this.sound.playFrost();
        this.projectiles.push(
          new Projectile(
            tower.x,
            tower.y,
            tower.target.x,
            tower.target.y,
            'frost_tower',
            tower.damage,
            tower.spec.projectileSpeed,
            { factor: tower.spec.slowFactor, duration: tower.spec.slowDuration }
          )
        );
      }
    }

    // ------------------------------------------------------------------------
    // WAVE & ENEMY SPAWNING SYSTEM
    // ------------------------------------------------------------------------
    startNewGame() {
      // Reset all game state
      this.state = 'PLAYING';
      this.score = 0;
      this.coins = INITIAL_COINS;
      this.currentWaveIndex = 0;
      this.enemiesSlainTotal = 0;
      this.magicBoltCooldownTimer = 0;
      this.activePlacementType = null;

      // Reset entities
      this.crystal = new Crystal(CENTER_X, CENTER_Y);
      this.pedestals = PEDESTAL_CONFIGS.map(c => new Pedestal(c));
      this.enemies = [];
      this.projectiles = [];
      this.particles = [];
      this.floatingTexts = [];

      // UI switches
      this.menuOverlay.classList.add('hidden');
      this.howToPlayModal.classList.add('hidden');
      this.pauseModal.classList.add('hidden');
      this.gameoverModal.classList.add('hidden');
      this.victoryModal.classList.add('hidden');
      this.wavePrepBanner.classList.add('hidden');
      this.hudOverlay.classList.remove('hidden');

      this.updateHudResources();
      this.updateCrystalHealthHud();
      this.cancelPlacementMode();

      // Launch Wave 1
      this.setupWave(0);
    }

    setupWave(waveIdx) {
      this.currentWaveIndex = waveIdx;
      const def = WAVE_DEFINITIONS[waveIdx];
      this.waveSpawnQueue = [...def.spawns];
      this.waveSpawnTimer = 0.5; // initial grace before first enemy
      this.totalWaveEnemies = def.spawns.length;

      this.waveTitleDisplay.textContent = `WAVE ${def.waveNumber} / 5`;
      this.waveNameDisplay.textContent = def.title;
      this.updateEnemiesRemainingHud();

      this.sound.playWaveStart();
      this.showToast(`⚔️ Wave ${def.waveNumber}: ${def.title}`);
    }

    spawnEnemy(type) {
      // Pick random spawn perimeter position along canvas boundary
      let spawnX, spawnY;
      const edge = Math.floor(Math.random() * 4); // 0=Top, 1=Right, 2=Bottom, 3=Left

      switch (edge) {
        case 0: // Top
          spawnX = Math.random() * CANVAS_WIDTH;
          spawnY = -25;
          break;
        case 1: // Right
          spawnX = CANVAS_WIDTH + 25;
          spawnY = Math.random() * CANVAS_HEIGHT;
          break;
        case 2: // Bottom
          spawnX = Math.random() * CANVAS_WIDTH;
          spawnY = CANVAS_HEIGHT + 25;
          break;
        case 3: // Left
          spawnX = -25;
          spawnY = Math.random() * CANVAS_HEIGHT;
          break;
      }

      const enemy = new Enemy(type, spawnX, spawnY);
      this.enemies.push(enemy);
      this.updateEnemiesRemainingHud();
    }

    handleEnemyDefeat(enemy) {
      this.enemiesSlainTotal++;
      this.score += enemy.rewardPoints;
      this.coins += enemy.rewardCoins;

      this.sound.playEnemyDefeat();
      this.updateHudResources();

      // Floating text popups
      this.floatingTexts.push(
        new FloatingText(`+${enemy.rewardPoints} PTS`, enemy.x, enemy.y - 10, '#00f5d4', 14)
      );
      this.floatingTexts.push(
        new FloatingText(`+${enemy.rewardCoins} 🪙`, enemy.x, enemy.y + 6, '#ffd166', 13)
      );

      // Death explosion particles
      const count = enemy.type === 'boss' ? 36 : 14;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = Math.random() * 90 + 20;
        this.particles.push(
          new Particle(
            enemy.x,
            enemy.y,
            Math.cos(a) * spd,
            Math.sin(a) * spd,
            enemy.color,
            Math.random() * 4 + 2,
            Math.random() * 0.4 + 0.3
          )
        );
      }

      this.updateEnemiesRemainingHud();
    }

    onWaveCleared() {
      // Wave bonus points (+50)
      this.score += 50;
      this.updateHudResources();

      this.floatingTexts.push(
        new FloatingText('+50 WAVE BONUS!', CENTER_X, CENTER_Y - 50, '#ffd166', 20)
      );

      // Check if all 5 waves completed
      if (this.currentWaveIndex >= 4) {
        this.triggerVictory();
        return;
      }

      // Enter Preparation Phase
      this.state = 'PREP';
      this.prepTimeRemaining = 5;
      const nextWaveDef = WAVE_DEFINITIONS[this.currentWaveIndex + 1];

      this.prepTitle.textContent = `WAVE ${this.currentWaveIndex + 1} CLEARED!`;
      this.prepSubtext.textContent = `Next Wave: "${nextWaveDef.title}". Upgrade your towers now!`;
      this.prepCountdown.textContent = '5';
      this.wavePrepBanner.classList.remove('hidden');
    }

    startNextWave() {
      this.wavePrepBanner.classList.add('hidden');
      this.state = 'PLAYING';
      this.setupWave(this.currentWaveIndex + 1);
    }

    // ------------------------------------------------------------------------
    // HUD & UI UPDATES
    // ------------------------------------------------------------------------
    updateHudResources() {
      this.coinCounter.textContent = this.coins;
      this.scoreCounter.textContent = this.score;

      // Update shop buttons affordability
      this.cardMagicTower.classList.toggle('disabled', this.coins < TOWER_SPECS.magic.cost);
      this.cardFrostTower.classList.toggle('disabled', this.coins < TOWER_SPECS.frost.cost);
    }

    updateCrystalHealthHud() {
      const hp = this.crystal.hp;
      const max = this.crystal.maxHp;
      const pct = Math.max(0, (hp / max) * 100);

      this.crystalHpBar.style.width = `${pct}%`;
      this.crystalHpText.textContent = `${hp} / ${max}`;

      this.crystalHpBar.classList.remove('warning', 'danger');
      if (pct <= 30) {
        this.crystalHpBar.classList.add('danger');
      } else if (pct <= 60) {
        this.crystalHpBar.classList.add('warning');
      }
    }

    updateEnemiesRemainingHud() {
      const activeCount = this.enemies.filter(e => !e.isDead).length;
      const totalRemaining = activeCount + this.waveSpawnQueue.length;
      this.enemiesRemainingText.textContent = `Enemies: ${totalRemaining}`;
    }

    // ------------------------------------------------------------------------
    // GAME OVER & VICTORY
    // ------------------------------------------------------------------------
    triggerGameOver() {
      this.state = 'GAME_OVER';
      this.sound.playGameOver();

      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        localStorage.setItem('crystalDefender_highScore', this.bestScore.toString());
      }

      this.goFinalScore.textContent = this.score.toLocaleString();
      this.goBestScore.textContent = this.bestScore.toLocaleString();
      this.goWaveReached.textContent = `Wave ${this.currentWaveIndex + 1} / 5`;
      this.goEnemiesSlain.textContent = this.enemiesSlainTotal.toLocaleString();

      this.hudOverlay.classList.add('hidden');
      this.gameoverModal.classList.remove('hidden');
    }

    triggerVictory() {
      this.state = 'VICTORY';
      // All Waves Cleared Bonus: +200 points
      this.score += 200;
      this.sound.playVictory();

      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        localStorage.setItem('crystalDefender_highScore', this.bestScore.toString());
      }

      this.vicFinalScore.textContent = this.score.toLocaleString();
      this.vicBestScore.textContent = this.bestScore.toLocaleString();
      this.vicCrystalHp.textContent = `${this.crystal.hp}%`;
      this.vicEnemiesSlain.textContent = this.enemiesSlainTotal.toLocaleString();

      this.hudOverlay.classList.add('hidden');
      this.victoryModal.classList.remove('hidden');

      // Spawn celebratory victory particles
      for (let i = 0; i < 70; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = Math.random() * 140 + 40;
        const colors = ['#00f5d4', '#ffd166', '#9b5de5', '#f15bb5', '#ffffff'];
        this.particles.push(
          new Particle(
            CENTER_X,
            CENTER_Y,
            Math.cos(a) * spd,
            Math.sin(a) * spd,
            colors[Math.floor(Math.random() * colors.length)],
            Math.random() * 4 + 2,
            1.8,
            'star'
          )
        );
      }
    }

    togglePause() {
      if (this.state === 'PLAYING' || this.state === 'PREP') {
        this.state = 'PAUSED';
        this.pauseModal.classList.remove('hidden');
      } else if (this.state === 'PAUSED') {
        this.state = 'PLAYING';
        this.pauseModal.classList.add('hidden');
      }
    }

    returnToMenu() {
      this.state = 'MENU';
      this.hudOverlay.classList.add('hidden');
      this.pauseModal.classList.add('hidden');
      this.gameoverModal.classList.add('hidden');
      this.victoryModal.classList.add('hidden');
      this.howToPlayModal.classList.add('hidden');
      this.wavePrepBanner.classList.add('hidden');
      this.menuOverlay.classList.remove('hidden');

      this.menuBestScore.textContent = this.bestScore.toLocaleString();
      this.enemies = [];
      this.projectiles = [];
    }

    triggerScreenShake(duration, intensity) {
      this.shakeDuration = duration;
      this.shakeIntensity = intensity;
    }

    // ------------------------------------------------------------------------
    // MAIN UPDATE LOOP
    // ------------------------------------------------------------------------
    update(dt) {
      // 1. Always update ambient background motes
      for (let i = 0; i < this.ambientParticles.length; i++) {
        const p = this.ambientParticles[i];
        p.y += p.speedY * dt;
        p.x += p.speedX * dt;
        if (p.y < -10) {
          p.y = CANVAS_HEIGHT + 10;
          p.x = Math.random() * CANVAS_WIDTH;
        }
      }

      // Screen shake decay
      if (this.shakeDuration > 0) {
        this.shakeDuration -= dt;
      }

      // If paused or in menu, only update aesthetic particles
      if (this.state === 'MENU' || this.state === 'PAUSED') {
        this.crystal.update(dt);
        return;
      }

      // 2. Magic Bolt Cooldown
      if (this.magicBoltCooldownTimer > 0) {
        this.magicBoltCooldownTimer -= dt;
        const pct = Math.max(0, (this.magicBoltCooldownTimer / MAGIC_BOLT_COOLDOWN) * 100);
        this.boltCooldownOverlay.style.height = `${pct}%`;
      } else {
        this.boltCooldownOverlay.style.height = '0%';
      }

      // 3. Update Crystal
      this.crystal.update(dt);
      if (this.crystal.destroyed && this.crystal.destructionTimer <= 0 && this.state !== 'GAME_OVER') {
        this.triggerGameOver();
        return;
      }

      // 4. Update Pedestals & Towers
      this.pedestals.forEach(p => {
        p.update(dt);
        if (p.tower) {
          p.tower.update(dt, this.enemies);
        }
      });

      // 5. Update Wave Prep Phase (Between Waves)
      if (this.state === 'PREP') {
        this.prepTimeRemaining -= dt;
        const secondsLeft = Math.ceil(Math.max(0, this.prepTimeRemaining));
        this.prepCountdown.textContent = secondsLeft.toString();

        if (this.prepTimeRemaining <= 0) {
          this.startNextWave();
        }
      }

      // 6. Spawn Wave Enemies (when PLAYING)
      if (this.state === 'PLAYING' && this.waveSpawnQueue.length > 0) {
        this.waveSpawnTimer -= dt;
        if (this.waveSpawnTimer <= 0) {
          const nextEnemySpawn = this.waveSpawnQueue.shift();
          this.spawnEnemy(nextEnemySpawn.type);
          this.waveSpawnTimer = nextEnemySpawn.delay;
        }
      }

      // 7. Update Active Enemies & Movement
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.isDead) continue;

        e.update(dt, this.crystal.x, this.crystal.y);

        // Check if enemy reached the central crystal
        const distToCrystal = Math.hypot(e.x - this.crystal.x, e.y - this.crystal.y);
        if (distToCrystal <= this.crystal.radius + e.radius) {
          // Monster impacts crystal!
          e.isDead = true;
          this.crystal.takeDamage(e.crystalDamage);
          this.updateCrystalHealthHud();
          this.sound.playCrystalDamage();
          this.triggerScreenShake(0.3, 8);

          // Impact shockwave & particles
          this.floatingTexts.push(
            new FloatingText(`-${e.crystalDamage} HP!`, this.crystal.x, this.crystal.y - 20, '#ef233c', 16)
          );

          for (let p = 0; p < 12; p++) {
            const a = Math.random() * Math.PI * 2;
            this.particles.push(
              new Particle(
                e.x,
                e.y,
                Math.cos(a) * 60,
                Math.sin(a) * 60,
                '#ef233c',
                Math.random() * 3 + 2,
                0.4
              )
            );
          }

          this.updateEnemiesRemainingHud();

          if (this.crystal.hp <= 0 && this.state !== 'GAME_OVER') {
            this.triggerGameOver();
            return;
          }
        }
      }

      // 8. Update Projectiles & Collision Detection
      for (let i = 0; i < this.projectiles.length; i++) {
        const p = this.projectiles[i];
        p.update(dt);
        if (p.isDead) continue;

        // Collision test against alive enemies
        for (let j = 0; j < this.enemies.length; j++) {
          const e = this.enemies[j];
          if (e.isDead) continue;

          const dist = Math.hypot(p.x - e.x, p.y - e.y);
          if (dist <= p.radius + e.radius) {
            // Hit enemy!
            p.isDead = true;
            this.sound.playHit();

            // Apply slow if Frost Tower projectile
            if (p.slow) {
              e.applySlow(p.slow.factor, p.slow.duration);
              this.floatingTexts.push(
                new FloatingText('SLOW!', e.x, e.y - 12, '#70d6ff', 12)
              );
            }

            const isKilled = e.applyDamage(p.damage);

            // Damage popup
            this.floatingTexts.push(
              new FloatingText(`-${p.damage}`, e.x, e.y - 6, '#ffffff', 13)
            );

            // Hit sparks
            for (let s = 0; s < 5; s++) {
              const a = Math.random() * Math.PI * 2;
              this.particles.push(
                new Particle(
                  p.x,
                  p.y,
                  Math.cos(a) * 45,
                  Math.sin(a) * 45,
                  p.type === 'frost_tower' ? '#00f5d4' : '#ffd166',
                  2,
                  0.25
                )
              );
            }

            if (isKilled) {
              this.handleEnemyDefeat(e);
            }

            break; // Projectile hits one enemy
          }
        }
      }

      // 9. Cleanup dead projectiles and dead enemies
      this.projectiles = this.projectiles.filter(p => !p.isDead);
      this.enemies = this.enemies.filter(e => !e.isDead);

      // 10. Check if current wave is cleared
      if (
        this.state === 'PLAYING' &&
        this.waveSpawnQueue.length === 0 &&
        this.enemies.length === 0
      ) {
        this.onWaveCleared();
      }

      // 11. Update particles & floating texts
      for (let i = 0; i < this.particles.length; i++) {
        this.particles[i].update(dt);
      }
      this.particles = this.particles.filter(p => p.life > 0);

      for (let i = 0; i < this.floatingTexts.length; i++) {
        this.floatingTexts[i].update(dt);
      }
      this.floatingTexts = this.floatingTexts.filter(t => t.life > 0);
    }

    // ------------------------------------------------------------------------
    // MAIN DRAW / RENDER LOOP
    // ------------------------------------------------------------------------
    render() {
      this.ctx.save();

      // Screen Shake translation
      if (this.shakeDuration > 0) {
        const ox = (Math.random() - 0.5) * this.shakeIntensity;
        const oy = (Math.random() - 0.5) * this.shakeIntensity;
        this.ctx.translate(ox, oy);
      }

      // 1. Dark Enchanted Arena Ground
      this.drawArenaEnvironment();

      // 2. Ambient Particles
      for (let i = 0; i < this.ambientParticles.length; i++) {
        const p = this.ambientParticles[i];
        this.ctx.fillStyle = `${p.color}${p.alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // 3. Tower Pedestals & Built Towers
      this.pedestals.forEach(p => p.draw(this.ctx));

      // 4. Central Magical Crystal
      this.crystal.draw(this.ctx);

      // 5. Enemies
      this.enemies.forEach(e => e.draw(this.ctx));

      // 6. Projectiles
      this.projectiles.forEach(p => p.draw(this.ctx));

      // 7. Visual Particles (sparks, death bursts, smoke)
      this.particles.forEach(p => p.draw(this.ctx));

      // 8. Floating Combat Text (+10 PTS, -15 HP, etc.)
      this.floatingTexts.forEach(t => t.draw(this.ctx));

      // 9. Tower Placement Range Preview (when placement mode active)
      if (this.activePlacementType && this.mouse.isHoveringCanvas) {
        const spec = TOWER_SPECS[this.activePlacementType];
        this.ctx.save();
        this.ctx.strokeStyle = spec.color;
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(this.mouse.x, this.mouse.y, spec.range, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.font = '12px Outfit, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Place ${spec.name}`, this.mouse.x, this.mouse.y - 20);
        this.ctx.restore();
      }

      this.ctx.restore();
    }

    drawArenaEnvironment() {
      // Background base
      const bgGrad = this.ctx.createRadialGradient(CENTER_X, CENTER_Y, 80, CENTER_X, CENTER_Y, 500);
      bgGrad.addColorStop(0, '#10162f');
      bgGrad.addColorStop(0.7, '#090d1c');
      bgGrad.addColorStop(1, '#05070e');
      this.ctx.fillStyle = bgGrad;
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Stone Paths radiating from edges to central crystal
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      this.ctx.lineWidth = 44;
      this.ctx.lineCap = 'round';

      // North to Center
      this.ctx.beginPath();
      this.ctx.moveTo(CENTER_X, 0);
      this.ctx.lineTo(CENTER_X, CENTER_Y);
      this.ctx.stroke();

      // South to Center
      this.ctx.beginPath();
      this.ctx.moveTo(CENTER_X, CANVAS_HEIGHT);
      this.ctx.lineTo(CENTER_X, CENTER_Y);
      this.ctx.stroke();

      // West to Center
      this.ctx.beginPath();
      this.ctx.moveTo(0, CENTER_Y);
      this.ctx.lineTo(CENTER_X, CENTER_Y);
      this.ctx.stroke();

      // East to Center
      this.ctx.beginPath();
      this.ctx.moveTo(CANVAS_WIDTH, CENTER_Y);
      this.ctx.lineTo(CENTER_X, CENTER_Y);
      this.ctx.stroke();

      // Runic concentric circles around arena
      this.ctx.strokeStyle = 'rgba(0, 245, 212, 0.06)';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.arc(CENTER_X, CENTER_Y, 180, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.arc(CENTER_X, CENTER_Y, 280, 0, Math.PI * 2);
      this.ctx.stroke();

      // Decorative arcane runic glyphs on the ground
      this.ctx.strokeStyle = 'rgba(155, 93, 229, 0.12)';
      this.ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const gx = CENTER_X + Math.cos(a) * 230;
        const gy = CENTER_Y + Math.sin(a) * 230;
        this.ctx.beginPath();
        this.ctx.arc(gx, gy, 12, 0, Math.PI * 2);
        this.ctx.stroke();
      }

      this.ctx.restore();
    }

    // ------------------------------------------------------------------------
    // MAIN GAME TICK
    // ------------------------------------------------------------------------
    gameLoop(timestamp) {
      if (!this.lastTimestamp) this.lastTimestamp = timestamp;
      const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1); // Cap delta-time to 100ms
      this.lastTimestamp = timestamp;

      this.update(dt);
      this.render();

      this.animationFrameId = requestAnimationFrame(ts => this.gameLoop(ts));
    }
  }

  // --------------------------------------------------------------------------
  // INITIALIZE ON DOM READY
  // --------------------------------------------------------------------------
  window.addEventListener('DOMContentLoaded', () => {
    window.game = new CrystalDefenderGame();
  });
})();
