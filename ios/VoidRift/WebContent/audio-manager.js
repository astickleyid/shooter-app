/**
 * Audio Manager for VOID RIFT
 * Provides sound effects and background music using Web Audio API
 * Generates sounds procedurally for a space shooter aesthetic
 */

const AudioManager = (() => {
  // Audio context and state
  let audioCtx = null;
  let masterGain = null;
  let sfxGain = null;
  let musicGain = null;
  let isInitialized = false;
  let isMuted = false;
  
  // Volume levels (0-1)
  const volumes = {
    master: 0.7,
    sfx: 0.8,
    music: 0.5
  };
  
  // Save key for preferences
  const AUDIO_SAVE_KEY = 'void_rift_audio_prefs';
  
  // Music state
  let currentMusic = null;
  let musicPlaying = false;
  
  // Sound effect cooldowns to prevent audio spam
  const soundCooldowns = {};
  const COOLDOWN_MS = 50; // Minimum ms between same sound
  
  /**
   * Initialize the audio context (must be called after user interaction)
   */
  const init = () => {
    if (isInitialized) return true;
    
    try {
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        console.warn('Web Audio API not supported');
        return false;
      }
      
      audioCtx = new AudioContext();
      
      // Create gain nodes for volume control
      masterGain = audioCtx.createGain();
      sfxGain = audioCtx.createGain();
      musicGain = audioCtx.createGain();
      
      // Connect gain chain: sfx/music -> master -> destination
      sfxGain.connect(masterGain);
      musicGain.connect(masterGain);
      masterGain.connect(audioCtx.destination);
      
      // Load saved preferences
      loadPreferences();
      
      // Apply initial volumes
      updateVolumes();
      
      isInitialized = true;
      console.log('🔊 Audio Manager initialized');
      return true;
    } catch (err) {
      console.warn('Failed to initialize audio:', err);
      return false;
    }
  };
  
  /**
   * Resume audio context if suspended (needed for Chrome autoplay policy)
   */
  const resume = async () => {
    if (audioCtx && audioCtx.state === 'suspended') {
      try {
        await audioCtx.resume();
      } catch (err) {
        console.warn('Failed to resume audio context:', err);
      }
    }
  };
  
  /**
   * Load audio preferences from localStorage
   */
  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem(AUDIO_SAVE_KEY);
      if (saved) {
        const prefs = JSON.parse(saved);
        if (typeof prefs.master === 'number') volumes.master = prefs.master;
        if (typeof prefs.sfx === 'number') volumes.sfx = prefs.sfx;
        if (typeof prefs.music === 'number') volumes.music = prefs.music;
        if (typeof prefs.muted === 'boolean') isMuted = prefs.muted;
      }
    } catch (err) {
      console.warn('Failed to load audio preferences:', err);
    }
  };
  
  /**
   * Save audio preferences to localStorage
   */
  const savePreferences = () => {
    try {
      localStorage.setItem(AUDIO_SAVE_KEY, JSON.stringify({
        master: volumes.master,
        sfx: volumes.sfx,
        music: volumes.music,
        muted: isMuted
      }));
    } catch (err) {
      console.warn('Failed to save audio preferences:', err);
    }
  };
  
  /**
   * Update gain node volumes
   */
  const updateVolumes = () => {
    if (!isInitialized) return;
    
    const effectiveMaster = isMuted ? 0 : volumes.master;
    masterGain.gain.setValueAtTime(effectiveMaster, audioCtx.currentTime);
    sfxGain.gain.setValueAtTime(volumes.sfx, audioCtx.currentTime);
    musicGain.gain.setValueAtTime(volumes.music, audioCtx.currentTime);
  };
  
  /**
   * Set volume for a channel
   * @param {string} channel - 'master', 'sfx', or 'music'
   * @param {number} value - Volume 0-1
   */
  const setVolume = (channel, value) => {
    const v = Math.max(0, Math.min(1, value));
    if (volumes[channel] !== undefined) {
      volumes[channel] = v;
      updateVolumes();
      savePreferences();
    }
  };
  
  /**
   * Get current volume for a channel
   * @param {string} channel - 'master', 'sfx', or 'music'
   * @returns {number} Volume 0-1
   */
  const getVolume = (channel) => {
    return volumes[channel] !== undefined ? volumes[channel] : 0;
  };
  
  /**
   * Toggle mute
   * @returns {boolean} New mute state
   */
  const toggleMute = () => {
    isMuted = !isMuted;
    updateVolumes();
    savePreferences();
    return isMuted;
  };
  
  /**
   * Set mute state
   * @param {boolean} muted
   */
  const setMuted = (muted) => {
    isMuted = !!muted;
    updateVolumes();
    savePreferences();
  };
  
  /**
   * Get mute state
   * @returns {boolean}
   */
  const getMuted = () => isMuted;
  
  /**
   * Check if enough time has passed since last play of this sound
   * @param {string} soundId
   * @returns {boolean}
   */
  const checkCooldown = (soundId) => {
    const now = performance.now();
    const lastPlay = soundCooldowns[soundId] || 0;
    if (now - lastPlay < COOLDOWN_MS) return false;
    soundCooldowns[soundId] = now;
    return true;
  };
  
  // ==========================================
  // PROCEDURAL SOUND GENERATION
  // ==========================================
  
  /**
   * Create an oscillator with envelope
   * @param {object} options
   */
  const createTone = (options) => {
    const {
      frequency = 440,
      type = 'sine',
      duration = 0.1,
      attack = 0.01,
      decay = 0.1,
      sustain = 0.3,
      release = 0.1,
      volume = 0.5,
      detune = 0,
      pitchEnvelope = null // { start: Hz, end: Hz }
    } = options;
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = type;
    osc.detune.setValueAtTime(detune, audioCtx.currentTime);
    
    // Pitch envelope - use pitchEnvelope if provided, otherwise use frequency
    if (pitchEnvelope) {
      osc.frequency.setValueAtTime(pitchEnvelope.start, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, pitchEnvelope.end),
        audioCtx.currentTime + duration
      );
    } else {
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    }
    
    // Volume envelope (ADSR) - simplified for short sound effects
    // Attack -> Decay -> Sustain (held) -> Release
    const now = audioCtx.currentTime;
    const sustainLevel = volume * sustain;
    const sustainEnd = now + duration - release;
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + attack);
    gainNode.gain.linearRampToValueAtTime(sustainLevel, now + attack + decay);
    // Hold sustain level until release begins (no discontinuity)
    if (sustainEnd > now + attack + decay) {
      gainNode.gain.linearRampToValueAtTime(sustainLevel, sustainEnd);
    }
    gainNode.gain.linearRampToValueAtTime(0, now + duration);
    
    osc.connect(gainNode);
    gainNode.connect(sfxGain);
    
    osc.start(now);
    osc.stop(now + duration + 0.01);
    
    return { osc, gainNode };
  };
  
  /**
   * Create noise (white, pink, brown)
   * @param {string} type - 'white', 'pink', or 'brown'
   * @param {number} duration
   * @param {number} volume
   */
  const createNoise = (type = 'white', duration = 0.1, volume = 0.3) => {
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    
    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'pink' || type === 'brown') {
      // Pink/brown noise using simple filtering
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }
    
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    source.connect(gainNode);
    gainNode.connect(sfxGain);
    
    source.start();
    source.stop(audioCtx.currentTime + duration + 0.01);
    
    return { source, gainNode };
  };
  
  // ==========================================
  // SOUND EFFECTS
  // ==========================================
  
  /**
   * Play laser/pulse shot sound
   */
  const playShoot = () => {
    if (!isInitialized || !checkCooldown('shoot')) return;
    resume();
    
    // Quick laser zap
    createTone({
      frequency: 800,
      type: 'square',
      duration: 0.08,
      attack: 0.005,
      decay: 0.02,
      sustain: 0.2,
      release: 0.05,
      volume: 0.15,
      pitchEnvelope: { start: 1200, end: 400 }
    });
  };
  
  /**
   * Play scatter/shotgun shot sound
   */
  const playScatterShoot = () => {
    if (!isInitialized || !checkCooldown('scatter')) return;
    resume();
    
    createNoise('white', 0.06, 0.12);
    createTone({
      frequency: 600,
      type: 'sawtooth',
      duration: 0.05,
      attack: 0.002,
      decay: 0.03,
      sustain: 0.1,
      release: 0.02,
      volume: 0.1
    });
  };
  
  /**
   * Play rail/heavy shot sound
   */
  const playRailShoot = () => {
    if (!isInitialized || !checkCooldown('rail')) return;
    resume();
    
    // Deep powerful shot
    createTone({
      frequency: 150,
      type: 'sawtooth',
      duration: 0.2,
      attack: 0.01,
      decay: 0.05,
      sustain: 0.3,
      release: 0.15,
      volume: 0.2
    });
    createTone({
      frequency: 80,
      type: 'sine',
      duration: 0.3,
      attack: 0.02,
      decay: 0.1,
      sustain: 0.2,
      release: 0.2,
      volume: 0.15
    });
  };
  
  /**
   * Play enemy hit sound
   */
  const playHit = () => {
    if (!isInitialized || !checkCooldown('hit')) return;
    resume();
    
    createTone({
      frequency: 400,
      type: 'square',
      duration: 0.05,
      attack: 0.002,
      decay: 0.02,
      sustain: 0.2,
      release: 0.03,
      volume: 0.1,
      pitchEnvelope: { start: 600, end: 200 }
    });
  };
  
  /**
   * Play small explosion (enemy death)
   */
  const playExplosionSmall = () => {
    if (!isInitialized || !checkCooldown('explosionSmall')) return;
    resume();
    
    createNoise('brown', 0.15, 0.2);
    createTone({
      frequency: 100,
      type: 'sine',
      duration: 0.2,
      attack: 0.01,
      decay: 0.05,
      sustain: 0.2,
      release: 0.15,
      volume: 0.15,
      pitchEnvelope: { start: 200, end: 40 }
    });
  };
  
  /**
   * Play medium explosion (elite enemy death)
   */
  const playExplosionMedium = () => {
    if (!isInitialized || !checkCooldown('explosionMedium')) return;
    resume();
    
    createNoise('brown', 0.25, 0.3);
    createTone({
      frequency: 80,
      type: 'sine',
      duration: 0.35,
      attack: 0.01,
      decay: 0.1,
      sustain: 0.3,
      release: 0.25,
      volume: 0.2,
      pitchEnvelope: { start: 150, end: 30 }
    });
    createTone({
      frequency: 200,
      type: 'sawtooth',
      duration: 0.2,
      attack: 0.005,
      decay: 0.05,
      sustain: 0.2,
      release: 0.15,
      volume: 0.1
    });
  };
  
  /**
   * Play large explosion (boss death)
   */
  const playExplosionLarge = () => {
    if (!isInitialized || !checkCooldown('explosionLarge')) return;
    resume();
    
    // Multiple layered explosions
    createNoise('brown', 0.5, 0.4);
    createTone({
      frequency: 50,
      type: 'sine',
      duration: 0.6,
      attack: 0.02,
      decay: 0.15,
      sustain: 0.3,
      release: 0.45,
      volume: 0.25,
      pitchEnvelope: { start: 100, end: 20 }
    });
    createTone({
      frequency: 120,
      type: 'sawtooth',
      duration: 0.4,
      attack: 0.01,
      decay: 0.1,
      sustain: 0.2,
      release: 0.3,
      volume: 0.15
    });
    
    // Delayed secondary explosion
    setTimeout(() => {
      if (isInitialized) {
        createNoise('brown', 0.3, 0.25);
        createTone({
          frequency: 70,
          type: 'sine',
          duration: 0.35,
          attack: 0.01,
          decay: 0.1,
          sustain: 0.2,
          release: 0.25,
          volume: 0.15
        });
      }
    }, 100);
  };
  
  /**
   * Play coin pickup sound
   */
  const playCoinPickup = () => {
    if (!isInitialized || !checkCooldown('coin')) return;
    resume();
    
    // Ascending chime
    createTone({
      frequency: 800,
      type: 'sine',
      duration: 0.1,
      attack: 0.005,
      decay: 0.03,
      sustain: 0.3,
      release: 0.07,
      volume: 0.15
    });
    setTimeout(() => {
      if (isInitialized) {
        createTone({
          frequency: 1200,
          type: 'sine',
          duration: 0.12,
          attack: 0.005,
          decay: 0.04,
          sustain: 0.3,
          release: 0.08,
          volume: 0.12
        });
      }
    }, 50);
  };
  
  /**
   * Play supply crate pickup sound
   */
  const playSupplyPickup = () => {
    if (!isInitialized || !checkCooldown('supply')) return;
    resume();
    
    // Power-up sound
    createTone({
      frequency: 400,
      type: 'sine',
      duration: 0.2,
      attack: 0.01,
      decay: 0.05,
      sustain: 0.4,
      release: 0.15,
      volume: 0.2,
      pitchEnvelope: { start: 400, end: 800 }
    });
    createTone({
      frequency: 600,
      type: 'triangle',
      duration: 0.25,
      attack: 0.02,
      decay: 0.08,
      sustain: 0.3,
      release: 0.17,
      volume: 0.1,
      pitchEnvelope: { start: 600, end: 1200 }
    });
  };
  
  /**
   * Play player damage sound
   */
  const playPlayerDamage = () => {
    if (!isInitialized || !checkCooldown('playerDamage')) return;
    resume();
    
    // Impact and alarm
    createNoise('white', 0.08, 0.25);
    createTone({
      frequency: 200,
      type: 'sawtooth',
      duration: 0.15,
      attack: 0.005,
      decay: 0.05,
      sustain: 0.3,
      release: 0.1,
      volume: 0.2,
      pitchEnvelope: { start: 300, end: 100 }
    });
  };
  
  /**
   * Play level up sound
   */
  const playLevelUp = () => {
    if (!isInitialized || !checkCooldown('levelUp')) return;
    resume();
    
    // Triumphant ascending tones
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (isInitialized) {
          createTone({
            frequency: freq,
            type: 'sine',
            duration: 0.3 - i * 0.03,
            attack: 0.01,
            decay: 0.05,
            sustain: 0.4,
            release: 0.2,
            volume: 0.15
          });
          createTone({
            frequency: freq * 2,
            type: 'sine',
            duration: 0.25 - i * 0.03,
            attack: 0.02,
            decay: 0.05,
            sustain: 0.2,
            release: 0.18,
            volume: 0.08
          });
        }
      }, i * 100);
    });
  };
  
  /**
   * Play level advance sound
   */
  const playLevelAdvance = () => {
    if (!isInitialized || !checkCooldown('levelAdvance')) return;
    resume();
    
    // Quick fanfare
    createTone({
      frequency: 523,
      type: 'square',
      duration: 0.15,
      attack: 0.01,
      decay: 0.03,
      sustain: 0.5,
      release: 0.11,
      volume: 0.12
    });
    setTimeout(() => {
      if (isInitialized) {
        createTone({
          frequency: 659,
          type: 'square',
          duration: 0.15,
          attack: 0.01,
          decay: 0.03,
          sustain: 0.5,
          release: 0.11,
          volume: 0.12
        });
      }
    }, 100);
    setTimeout(() => {
      if (isInitialized) {
        createTone({
          frequency: 784,
          type: 'square',
          duration: 0.25,
          attack: 0.01,
          decay: 0.05,
          sustain: 0.5,
          release: 0.19,
          volume: 0.15
        });
      }
    }, 200);
  };
  
  /**
   * Play game over sound
   */
  const playGameOver = () => {
    if (!isInitialized || !checkCooldown('gameOver')) return;
    resume();
    
    // Descending doom
    const notes = [392, 349, 294, 262]; // G4, F4, D4, C4
    notes.forEach((freq, i) => {
      setTimeout(() => {
        if (isInitialized) {
          createTone({
            frequency: freq,
            type: 'sawtooth',
            duration: 0.4,
            attack: 0.02,
            decay: 0.1,
            sustain: 0.3,
            release: 0.28,
            volume: 0.15
          });
        }
      }, i * 200);
    });
    
    // Final impact
    setTimeout(() => {
      if (isInitialized) {
        createNoise('brown', 0.4, 0.3);
        createTone({
          frequency: 60,
          type: 'sine',
          duration: 0.6,
          attack: 0.02,
          decay: 0.15,
          sustain: 0.3,
          release: 0.45,
          volume: 0.2
        });
      }
    }, 800);
  };
  
  /**
   * Play boss spawn sound
   */
  const playBossSpawn = () => {
    if (!isInitialized || !checkCooldown('bossSpawn')) return;
    resume();
    
    // Ominous warning
    createTone({
      frequency: 80,
      type: 'sawtooth',
      duration: 0.8,
      attack: 0.1,
      decay: 0.2,
      sustain: 0.5,
      release: 0.5,
      volume: 0.25
    });
    createTone({
      frequency: 120,
      type: 'sine',
      duration: 1.0,
      attack: 0.2,
      decay: 0.3,
      sustain: 0.4,
      release: 0.5,
      volume: 0.15,
      pitchEnvelope: { start: 120, end: 60 }
    });
    
    // Warning beeps
    [0, 300, 600].forEach((delay) => {
      setTimeout(() => {
        if (isInitialized) {
          createTone({
            frequency: 440,
            type: 'square',
            duration: 0.1,
            attack: 0.005,
            decay: 0.02,
            sustain: 0.5,
            release: 0.075,
            volume: 0.15
          });
        }
      }, delay);
    });
  };
  
  /**
   * Play ultimate ability activation sound
   */
  const playUltimate = () => {
    if (!isInitialized || !checkCooldown('ultimate')) return;
    resume();
    
    // Power surge
    createTone({
      frequency: 100,
      type: 'sine',
      duration: 0.5,
      attack: 0.05,
      decay: 0.1,
      sustain: 0.5,
      release: 0.35,
      volume: 0.25,
      pitchEnvelope: { start: 100, end: 400 }
    });
    createNoise('white', 0.3, 0.2);
    createTone({
      frequency: 200,
      type: 'sawtooth',
      duration: 0.6,
      attack: 0.1,
      decay: 0.15,
      sustain: 0.4,
      release: 0.35,
      volume: 0.15,
      pitchEnvelope: { start: 200, end: 800 }
    });
  };
  
  /**
   * Play secondary weapon (nova bomb) sound
   */
  const playSecondary = () => {
    if (!isInitialized || !checkCooldown('secondary')) return;
    resume();
    
    // Launching whoosh
    createNoise('pink', 0.2, 0.2);
    createTone({
      frequency: 150,
      type: 'sine',
      duration: 0.3,
      attack: 0.02,
      decay: 0.08,
      sustain: 0.3,
      release: 0.2,
      volume: 0.2,
      pitchEnvelope: { start: 150, end: 400 }
    });
  };
  
  /**
   * Play defense shield activation sound
   */
  const playShield = () => {
    if (!isInitialized || !checkCooldown('shield')) return;
    resume();
    
    // Energy shield hum
    createTone({
      frequency: 300,
      type: 'sine',
      duration: 0.3,
      attack: 0.05,
      decay: 0.1,
      sustain: 0.5,
      release: 0.15,
      volume: 0.15
    });
    createTone({
      frequency: 450,
      type: 'triangle',
      duration: 0.25,
      attack: 0.03,
      decay: 0.07,
      sustain: 0.4,
      release: 0.15,
      volume: 0.1
    });
  };
  
  /**
   * Play boost activation sound
   */
  const playBoost = () => {
    if (!isInitialized || !checkCooldown('boost')) return;
    resume();
    
    // Thruster burst
    createNoise('white', 0.15, 0.15);
    createTone({
      frequency: 200,
      type: 'sawtooth',
      duration: 0.2,
      attack: 0.01,
      decay: 0.05,
      sustain: 0.3,
      release: 0.14,
      volume: 0.12,
      pitchEnvelope: { start: 200, end: 400 }
    });
  };
  
  /**
   * Play UI click sound
   */
  const playClick = () => {
    if (!isInitialized || !checkCooldown('click')) return;
    resume();
    
    createTone({
      frequency: 1000,
      type: 'sine',
      duration: 0.05,
      attack: 0.002,
      decay: 0.02,
      sustain: 0.2,
      release: 0.03,
      volume: 0.1
    });
  };
  
  /**
   * Play combo milestone sound
   */
  const playComboMilestone = () => {
    if (!isInitialized || !checkCooldown('combo')) return;
    resume();
    
    // Quick ascending arpeggio
    [600, 800, 1000].forEach((freq, i) => {
      setTimeout(() => {
        if (isInitialized) {
          createTone({
            frequency: freq,
            type: 'triangle',
            duration: 0.1,
            attack: 0.005,
            decay: 0.03,
            sustain: 0.3,
            release: 0.065,
            volume: 0.12
          });
        }
      }, i * 50);
    });
  };
  
  // ==========================================
  // BACKGROUND MUSIC
  // ==========================================
  
  /**
   * Generate and play background music loop
   * Uses simple procedural synthesis for an ambient space feel
   */
  const startMusic = () => {
    if (!isInitialized || musicPlaying) return;
    resume();
    
    musicPlaying = true;
    playMusicLoop();
  };
  
  /**
   * Internal music loop player
   */
  const playMusicLoop = () => {
    if (!isInitialized || !musicPlaying) return;
    
    // Create a simple ambient pad
    const playPad = (freq, duration, delay = 0) => {
      setTimeout(() => {
        if (!musicPlaying || !isInitialized) return;
        
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc2.frequency.setValueAtTime(freq * 1.002, audioCtx.currentTime); // Slight detune
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, audioCtx.currentTime);
        
        // Slow fade in/out
        const now = audioCtx.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.08, now + duration * 0.3);
        gainNode.gain.setValueAtTime(0.08, now + duration * 0.7);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);
        
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(musicGain);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + duration + 0.1);
        osc2.stop(now + duration + 0.1);
      }, delay);
    };
    
    // Play ambient chord progression
    const chords = [
      [130.81, 164.81, 196.00], // C3, E3, G3
      [146.83, 174.61, 220.00], // D3, F3, A3
      [123.47, 155.56, 185.00], // B2, Eb3, F#3
      [130.81, 155.56, 196.00]  // C3, Eb3, G3
    ];
    
    const chordDuration = 4000; // 4 seconds per chord
    const loopDuration = chords.length * chordDuration;
    
    chords.forEach((chord, chordIndex) => {
      chord.forEach((freq) => {
        playPad(freq, chordDuration / 1000, chordIndex * chordDuration);
      });
    });
    
    // Schedule next loop
    currentMusic = setTimeout(() => {
      if (musicPlaying) {
        playMusicLoop();
      }
    }, loopDuration);
  };
  
  /**
   * Stop background music
   */
  const stopMusic = () => {
    musicPlaying = false;
    if (currentMusic) {
      clearTimeout(currentMusic);
      currentMusic = null;
    }
  };
  
  /**
   * Check if music is playing
   * @returns {boolean}
   */
  const isMusicPlaying = () => musicPlaying;
  
  // ==========================================
  // PUBLIC API
  // ==========================================
  
  return {
    // Core
    init,
    resume,
    
    // Volume control
    setVolume,
    getVolume,
    toggleMute,
    setMuted,
    getMuted,
    
    // Sound effects
    playShoot,
    playScatterShoot,
    playRailShoot,
    playHit,
    playExplosionSmall,
    playExplosionMedium,
    playExplosionLarge,
    playCoinPickup,
    playSupplyPickup,
    playPlayerDamage,
    playLevelUp,
    playLevelAdvance,
    playGameOver,
    playBossSpawn,
    playUltimate,
    playSecondary,
    playShield,
    playBoost,
    playClick,
    playComboMilestone,
    
    // Music
    startMusic,
    stopMusic,
    isMusicPlaying,
    
    // Utility
    isInitialized: () => isInitialized
  };
})();
