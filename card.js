// ============================================================
// Birthday Card — Multi-Stage Interactive
// ============================================================

(function() {
  'use strict';

  // ---------- State ----------
  const state = {
    stage: 1,
    soundOn: true,
    audioCtx: null,
    micStream: null,
    micAnalyser: null,
    micRAF: null,
    candleCount: 5,
    confettiDensity: 1,
    blownOut: 0,
    recipientName: 'Devanshi',
    fromName: 'Divyang'
  };

  // Read tweaks if present
  if (window.TWEAK_DEFAULTS) {
    Object.assign(state, {
      candleCount: window.TWEAK_DEFAULTS.candleCount || 5,
      confettiDensity: window.TWEAK_DEFAULTS.confettiDensity || 1,
      recipientName: window.TWEAK_DEFAULTS.recipientName || 'Devanshi',
      fromName: window.TWEAK_DEFAULTS.fromName || 'Divyang'
    });
  }

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const stages = [null, $('stage1'), $('stage2'), $('stage3'), $('stage4')];

  // ---------- Audio Engine ----------
  const Audio = {
    ctx: null,
    init() {
      if (this.ctx) return this.ctx;
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {}
      return this.ctx;
    },
    note(freq, duration = 0.3, type = 'sine', volume = 0.2, when = 0) {
      if (!state.soundOn) return;
      const ctx = this.init();
      if (!ctx) return;
      const t = ctx.currentTime + when;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duration + 0.05);
    },
    chime() {
      this.note(880, 0.4, 'triangle', 0.15);
      this.note(1320, 0.5, 'triangle', 0.12, 0.05);
      this.note(1760, 0.6, 'sine', 0.1, 0.1);
    },
    pop() {
      if (!state.soundOn) return;
      const ctx = this.init();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(120 + Math.random() * 60, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.08);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    },
    whoosh() {
      if (!state.soundOn) return;
      const ctx = this.init();
      if (!ctx) return;
      const t = ctx.currentTime;
      const bufferSize = 0.4 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 800;
      filter.Q.value = 0.5;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      noise.connect(filter).connect(gain).connect(ctx.destination);
      noise.start(t);
    },
    sparkle() {
      if (!state.soundOn) return;
      const freqs = [1200, 1800, 2400];
      freqs.forEach((f, i) => this.note(f + Math.random() * 200, 0.18, 'sine', 0.06, i * 0.03));
    },
    happyBirthday() {
      if (!state.soundOn) return;
      // Happy Birthday melody — simple
      // C C D C F E | C C D C G F | C C C5 A F E D | Bb Bb A F G F
      const ctx = this.init();
      if (!ctx) return;
      const tempo = 0.32;
      const notes = [
        // Happy Birth-day to you
        ['C4', 0.75], ['C4', 0.25], ['D4', 1], ['C4', 1], ['F4', 1], ['E4', 2],
        // Happy Birth-day to you
        ['C4', 0.75], ['C4', 0.25], ['D4', 1], ['C4', 1], ['G4', 1], ['F4', 2],
        // Happy Birth-day dear ___
        ['C4', 0.75], ['C4', 0.25], ['C5', 1], ['A4', 1], ['F4', 1], ['E4', 1], ['D4', 2],
        // Happy Birth-day to you
        ['Bb4', 0.75], ['Bb4', 0.25], ['A4', 1], ['F4', 1], ['G4', 1], ['F4', 2]
      ];
      const freqMap = {
        'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
        'G4': 392.00, 'A4': 440.00, 'Bb4': 466.16, 'C5': 523.25
      };
      let t = 0;
      notes.forEach(([n, dur]) => {
        const freq = freqMap[n];
        // main + harmony
        this.note(freq, dur * tempo * 0.95, 'triangle', 0.12, t);
        this.note(freq * 2, dur * tempo * 0.95, 'sine', 0.04, t);
        t += dur * tempo;
      });
    }
  };
  window.Audio2 = Audio;

  // ---------- Sound toggle ----------
  $('soundToggle').addEventListener('click', () => {
    state.soundOn = !state.soundOn;
    $('soundIcon').textContent = state.soundOn ? '🔔' : '🔕';
    if (state.soundOn) Audio.note(880, 0.15, 'triangle', 0.1);
  });

  // ---------- Stage Switch ----------
  function go(n) {
    if (n === state.stage) return;
    stages[state.stage]?.classList.add('hidden');
    state.stage = n;
    stages[n]?.classList.remove('hidden');
    if (n === 4) {
      $('restartBtn').classList.add('show');
    } else {
      $('restartBtn').classList.remove('show');
    }
  }

  // ============================================================
  // STAGE 1: ENVELOPE
  // ============================================================
  const envWrap = $('envWrap');
  const envelope = $('envelope');
  let opened = false;
  envWrap.addEventListener('click', (e) => {
    if (opened) return;
    opened = true;
    Audio.init(); // unlock
    Audio.whoosh();
    setTimeout(() => Audio.chime(), 200);
    envelope.classList.add('opening');
    spawnRipple(e.clientX, e.clientY);
    setTimeout(() => {
      go(2);
      // little confetti puff
      Confetti.burst(window.innerWidth/2, window.innerHeight/2, 30);
    }, 1700);
  });

  // ============================================================
  // STAGE 2: BIG CARD with letter scrambling
  // ============================================================
  function buildBigType() {
    document.querySelectorAll('.bigtype .word').forEach(word => {
      const text = word.dataset.word;
      word.innerHTML = '';
      [...text].forEach((ch, i) => {
        const span = document.createElement('span');
        span.className = 'letter-char';
        span.textContent = ch;
        span.style.transition = 'transform 400ms cubic-bezier(.34,1.56,.64,1), color 200ms';
        span.dataset.idx = i;
        word.appendChild(span);
      });
    });

    // Hover/click letters: bounce + color flash
    const colors = ['#FF2E93', '#1F6BFF', '#FFE94A', '#9CE53A'];
    document.querySelectorAll('.letter-char').forEach(span => {
      span.addEventListener('mouseenter', () => {
        const c = colors[Math.floor(Math.random() * colors.length)];
        span.style.color = c;
        span.style.transform = `translateY(-12px) rotate(${(Math.random()-0.5)*16}deg)`;
        Audio.note(400 + Math.random() * 600, 0.1, 'sine', 0.06);
        setTimeout(() => {
          span.style.transform = '';
        }, 350);
      });
      span.addEventListener('click', (e) => {
        e.stopPropagation();
        span.style.transform = `translateY(-30px) scale(1.4) rotate(${(Math.random()-0.5)*40}deg)`;
        const rect = span.getBoundingClientRect();
        Confetti.burst(rect.left + rect.width/2, rect.top + rect.height/2, 12);
        Audio.pop();
        setTimeout(() => { span.style.transform = ''; }, 500);
      });
    });
  }
  buildBigType();

  // Click anywhere in stage2 (not on letters) → go to cake
  stages[2].addEventListener('click', (e) => {
    if (e.target.classList.contains('letter-char')) return;
    Audio.pop();
    spawnRipple(e.clientX, e.clientY);
    Confetti.burst(e.clientX, e.clientY, 16);
    setTimeout(() => {
      go(3);
      initCake();
    }, 250);
  });

  // ============================================================
  // STAGE 3: CAKE with mic-blown candles
  // ============================================================
  function buildCandles() {
    const wrap = $('candles');
    wrap.innerHTML = '';
    state.blownOut = 0;
    for (let i = 0; i < state.candleCount; i++) {
      const c = document.createElement('div');
      c.className = 'candle';
      const flame = document.createElement('div');
      flame.className = 'flame';
      flame.style.animationDelay = (Math.random() * 200) + 'ms';
      c.appendChild(flame);
      // click to blow out
      c.addEventListener('click', () => blowOutCandle(c));
      wrap.appendChild(c);
    }
  }

  function blowOutCandle(c) {
    if (c.classList.contains('out')) return;
    c.classList.add('out');
    state.blownOut++;
    Audio.pop();
    const rect = c.getBoundingClientRect();
    Confetti.burst(rect.left + rect.width/2, rect.top, 8);
    if (state.blownOut >= state.candleCount) {
      celebrate();
    }
  }

  function celebrate() {
    $('cake').classList.add('celebrate');
    Audio.happyBirthday();
    // Big confetti burst
    setTimeout(() => Confetti.burst(window.innerWidth/2, window.innerHeight/2, 120), 200);
    setTimeout(() => Confetti.burst(window.innerWidth*0.25, window.innerHeight*0.5, 60), 600);
    setTimeout(() => Confetti.burst(window.innerWidth*0.75, window.innerHeight*0.5, 60), 800);
    stopMic();
    setTimeout(() => go(4), 2400);
  }

  $('skipBlow').addEventListener('click', () => {
    document.querySelectorAll('.candle').forEach((c, i) => {
      setTimeout(() => blowOutCandle(c), i * 120);
    });
  });

  function initCake() {
    buildCandles();
    requestMic();
    addCakeSprinkles();
  }

  function addCakeSprinkles() {
    const tiers = document.querySelectorAll('.tier');
    tiers.forEach(t => {
      // remove old sprinkles
      t.querySelectorAll('.sprinkle').forEach(s => s.remove());
      const count = 6 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        const s = document.createElement('div');
        s.className = 'sprinkle';
        s.style.left = (10 + Math.random() * 80) + '%';
        s.style.top = (15 + Math.random() * 70) + '%';
        s.style.transform = `rotate(${Math.random() * 360}deg)`;
        s.style.background = ['#FF2E93','#1F6BFF','#FFE94A','#9CE53A','#161320'][Math.floor(Math.random()*5)];
        t.appendChild(s);
      }
    });
  }

  // ---------- Microphone ----------
  async function requestMic() {
    const status = $('micStatus');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      state.micStream = stream;
      const ctx = Audio.init();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      state.micAnalyser = analyser;
      status.textContent = 'BLOW INTO YOUR MIC';
      monitorMic();
    } catch (e) {
      status.textContent = 'NO MIC — CLICK CANDLES TO BLOW OUT';
      status.style.color = 'var(--pink)';
    }
  }

  function stopMic() {
    if (state.micRAF) cancelAnimationFrame(state.micRAF);
    if (state.micStream) {
      state.micStream.getTracks().forEach(t => t.stop());
      state.micStream = null;
    }
  }

  function monitorMic() {
    const analyser = state.micAnalyser;
    if (!analyser) return;
    const buf = new Uint8Array(analyser.fftSize);
    const fill = $('micFill');
    let blowFrames = 0;
    let cooldown = 0;

    const tick = () => {
      analyser.getByteTimeDomainData(buf);
      // RMS
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);
      // amplify and clamp
      const level = Math.min(1, rms * 4);
      fill.style.width = (level * 100) + '%';

      // Blow detection: sustained loud
      const BLOW_THRESHOLD = 0.35;
      if (level > BLOW_THRESHOLD) {
        blowFrames++;
      } else {
        blowFrames = Math.max(0, blowFrames - 1);
      }

      if (cooldown > 0) cooldown--;

      if (blowFrames > 6 && cooldown === 0) {
        // blow out one or two candles
        const remaining = [...document.querySelectorAll('.candle:not(.out)')];
        if (remaining.length > 0) {
          const n = Math.min(remaining.length, level > 0.7 ? 2 : 1);
          for (let i = 0; i < n; i++) {
            blowOutCandle(remaining[i]);
          }
          cooldown = 20;
          blowFrames = 0;
        }
      }

      // Flame flutter based on level
      document.querySelectorAll('.candle:not(.out) .flame').forEach((f, idx) => {
        const wobble = level * 30 * (idx % 2 ? 1 : -1);
        f.style.transform = `translateX(calc(-50% + ${wobble}px)) scale(${1 - level * 0.2}, ${1 + level * 0.3})`;
      });

      state.micRAF = requestAnimationFrame(tick);
    };
    tick();
  }

  // ============================================================
  // STAGE 4: WISH — replay
  // ============================================================
  $('replayBtn').addEventListener('click', restart);
  $('restartBtn').addEventListener('click', restart);

  function restart() {
    // Reset envelope
    opened = false;
    envelope.classList.remove('opening');
    $('cake').classList.remove('celebrate');
    state.blownOut = 0;
    go(1);
  }

  // ============================================================
  // RIPPLE
  // ============================================================
  function spawnRipple(x, y) {
    const r = document.createElement('div');
    r.className = 'ripple';
    r.style.left = (x - 0) + 'px';
    r.style.top = (y - 0) + 'px';
    r.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 700);
  }

  // ============================================================
  // CONFETTI ENGINE
  // ============================================================
  const Confetti = (() => {
    const canvas = $('confetti');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let raf = null;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    }
    resize();
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
      canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio || 1, 1);
    });

    const COLORS = ['#FF2E93', '#1F6BFF', '#FFE94A', '#9CE53A', '#FF6FAE', '#43B0FF'];
    const SHAPES = ['rect', 'circle', 'strip', 'tri'];

    function spawn(x, y, count) {
      const n = Math.round(count * state.confettiDensity);
      for (let i = 0; i < n; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 8;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 4,
          gravity: 0.18 + Math.random() * 0.1,
          drag: 0.985,
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 0.4,
          size: 6 + Math.random() * 10,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
          life: 1,
          fade: 0.004 + Math.random() * 0.004
        });
      }
      if (!raf) loop();
    }

    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        p.life -= p.fade;

        if (p.life <= 0 || p.y > window.innerHeight + 40) return;

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        const s = p.size;
        if (p.shape === 'rect') {
          ctx.fillRect(-s/2, -s/4, s, s/2);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, s/2.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'strip') {
          ctx.fillRect(-s/2, -s/8, s, s/4);
        } else if (p.shape === 'tri') {
          ctx.beginPath();
          ctx.moveTo(0, -s/2);
          ctx.lineTo(s/2, s/2);
          ctx.lineTo(-s/2, s/2);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      });
      particles = particles.filter(p => p.life > 0 && p.y < window.innerHeight + 40);
      if (particles.length) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    }

    return { burst: spawn };
  })();
  window.Confetti = Confetti;

  // ============================================================
  // SPARKLES — cursor trail
  // ============================================================
  (() => {
    const canvas = $('sparkles');
    const ctx = canvas.getContext('2d');
    let parts = [];
    let raf = null;
    let lastX = 0, lastY = 0, lastT = 0;

    function resize() {
      canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
      canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    }
    resize();
    window.addEventListener('resize', resize);

    const COLORS = ['#FF2E93', '#1F6BFF', '#FFE94A', '#9CE53A', '#FFFFFF'];

    document.addEventListener('mousemove', (e) => {
      const now = performance.now();
      const dt = now - lastT;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const speed = Math.hypot(dx, dy) / Math.max(1, dt);
      lastT = now; lastX = e.clientX; lastY = e.clientY;
      const count = Math.min(3, Math.floor(speed * 2));
      for (let i = 0; i < count; i++) {
        parts.push({
          x: e.clientX + (Math.random()-0.5)*10,
          y: e.clientY + (Math.random()-0.5)*10,
          vx: (Math.random()-0.5) * 1.5,
          vy: (Math.random()-0.5) * 1.5 - 0.5,
          life: 1,
          size: 2 + Math.random() * 3,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random()-0.5) * 0.2
        });
      }
      if (!raf) loop();
    });

    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      parts.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.04;
        p.life -= 0.025;
        p.rot += p.vrot;
        if (p.life <= 0) return;
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        // four-pointed sparkle
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2;
          ctx.lineTo(Math.cos(a) * p.size, Math.sin(a) * p.size);
          ctx.lineTo(Math.cos(a + Math.PI/4) * p.size * 0.3, Math.sin(a + Math.PI/4) * p.size * 0.3);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
      parts = parts.filter(p => p.life > 0);
      if (parts.length) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = null;
      }
    }
  })();

  // ============================================================
  // EXPOSE for tweaks
  // ============================================================
  window.__card = {
    setRecipientName(name) {
      state.recipientName = name;
      $('letterName').textContent = name;
      $('cardName').textContent = name;
    },
    setFromName(name) {
      state.fromName = name;
      $('fromName').textContent = name;
    },
    setCandleCount(n) {
      state.candleCount = n;
      if (state.stage === 3) buildCandles();
    },
    setConfettiDensity(d) {
      state.confettiDensity = d;
    },
    burstConfetti(x, y, n) {
      Confetti.burst(x || window.innerWidth/2, y || window.innerHeight/2, n || 80);
    },
    state
  };

  // Apply initial tweak values
  window.__card.setRecipientName(state.recipientName);
  window.__card.setFromName(state.fromName);

})();
