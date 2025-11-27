/**
 * Music Radio for VOID RIFT
 * Provides modern, trendy procedurally-generated music "stations" for gameplay
 * Uses Web Audio API for dynamic music generation
 */

const MusicRadio = (() => {
  // Audio context and state (shared with AudioManager if available)
  let audioCtx = null;
  let masterGain = null;
  let radioGain = null;
  let isInitialized = false;
  let isPlaying = false;
  let currentStation = null;
  let currentScheduler = null;
  let schedulerInterval = null;
  
  // Volume (0-1)
  let radioVolume = 0.5;
  
  // Save key for preferences
  const RADIO_SAVE_KEY = 'void_rift_radio_prefs';
  
  // BPM and timing utilities
  const bpmToMs = (bpm, beats = 1) => (60000 / bpm) * beats;
  
  // Music generation state
  let currentBeat = 0;
  let measureCount = 0;
  let lastBeatTime = 0;
  
  // Station definitions with their musical characteristics
  const STATIONS = {
    synthwave: {
      id: 'synthwave',
      name: 'Synthwave FM',
      desc: 'Retro 80s vibes with pulsing synths',
      icon: '🌆',
      bpm: 118,
      key: 'Am',
      color: '#ff6b9d'
    },
    techno: {
      id: 'techno',
      name: 'Techno Drive',
      desc: 'Hard-hitting beats for intense action',
      icon: '⚡',
      bpm: 135,
      key: 'Dm',
      color: '#00ff88'
    },
    lofi: {
      id: 'lofi',
      name: 'Lo-Fi Chill',
      desc: 'Relaxed beats to focus and game',
      icon: '☕',
      bpm: 85,
      key: 'Cmaj7',
      color: '#9b59b6'
    },
    dnb: {
      id: 'dnb',
      name: 'Drum & Bass',
      desc: 'High-energy breakbeats',
      icon: '🔊',
      bpm: 174,
      key: 'Em',
      color: '#e74c3c'
    },
    ambient: {
      id: 'ambient',
      name: 'Space Ambient',
      desc: 'Atmospheric soundscapes',
      icon: '🌌',
      bpm: 70,
      key: 'Fm',
      color: '#3498db'
    },
    house: {
      id: 'house',
      name: 'House Party',
      desc: 'Groovy four-on-the-floor beats',
      icon: '🎵',
      bpm: 124,
      key: 'Gm',
      color: '#f39c12'
    }
  };
  
  // Musical scales and frequencies
  const NOTES = {
    'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
    'Db3': 138.59, 'Eb3': 155.56, 'Gb3': 185.00, 'Ab3': 207.65, 'Bb3': 233.08,
    'Db4': 277.18, 'Eb4': 311.13, 'Gb4': 369.99, 'Ab4': 415.30, 'Bb4': 466.16,
    'Db5': 554.37, 'Eb5': 622.25, 'Gb5': 739.99, 'Ab5': 830.61, 'Bb5': 932.33
  };
  
  // Scale patterns for different keys
  const SCALES = {
    'Am': ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'],
    'Dm': ['D3', 'E3', 'F3', 'G3', 'A3', 'Bb3', 'C4', 'D4'],
    'Em': ['E3', 'Gb3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4'],
    'Fm': ['F3', 'G3', 'Ab3', 'Bb3', 'C4', 'Db4', 'Eb4', 'F4'],
    'Gm': ['G3', 'A3', 'Bb3', 'C4', 'D4', 'Eb4', 'F4', 'G4'],
    'Cmaj7': ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']
  };
  
  // Chord progressions for each station type
  const PROGRESSIONS = {
    synthwave: [
      ['A3', 'C4', 'E4'],      // Am
      ['F3', 'A3', 'C4'],      // F
      ['C3', 'E3', 'G3'],      // C
      ['G3', 'B3', 'D4']       // G
    ],
    techno: [
      ['D3', 'F3', 'A3'],      // Dm
      ['A3', 'C4', 'E4'],      // Am
      ['Bb3', 'D4', 'F4'],     // Bb
      ['C4', 'E4', 'G4']       // C
    ],
    lofi: [
      ['C4', 'E4', 'G4', 'B4'], // Cmaj7
      ['A3', 'C4', 'E4', 'G4'], // Am7
      ['F3', 'A3', 'C4', 'E4'], // Fmaj7
      ['G3', 'B3', 'D4', 'F4']  // G7
    ],
    dnb: [
      ['E3', 'G3', 'B3'],      // Em
      ['C3', 'E3', 'G3'],      // C
      ['D3', 'Gb3', 'A3'],     // D
      ['B3', 'D4', 'Gb4']      // Bm
    ],
    ambient: [
      ['F3', 'Ab3', 'C4'],     // Fm
      ['Db3', 'F3', 'Ab3'],    // Db
      ['Ab3', 'C4', 'Eb4'],    // Ab
      ['Eb3', 'G3', 'Bb3']     // Eb
    ],
    house: [
      ['G3', 'Bb3', 'D4'],     // Gm
      ['Eb3', 'G3', 'Bb3'],    // Eb
      ['F3', 'A3', 'C4'],      // F
      ['D3', 'Gb3', 'A3']      // D
    ]
  };
  
  /**
   * Initialize the radio (can share AudioContext with AudioManager)
   */
  const init = (sharedAudioCtx = null) => {
    if (isInitialized) return true;
    
    try {
      if (sharedAudioCtx) {
        audioCtx = sharedAudioCtx;
      } else {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
          console.warn('Web Audio API not supported');
          return false;
        }
        audioCtx = new AudioContext();
      }
      
      // Create gain nodes
      masterGain = audioCtx.createGain();
      radioGain = audioCtx.createGain();
      
      radioGain.connect(masterGain);
      masterGain.connect(audioCtx.destination);
      
      // Load preferences
      loadPreferences();
      updateVolume();
      
      isInitialized = true;
      return true;
    } catch (err) {
      console.warn('Failed to initialize MusicRadio:', err);
      return false;
    }
  };
  
  /**
   * Resume audio context if suspended
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
   * Load preferences from localStorage
   */
  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem(RADIO_SAVE_KEY);
      if (saved) {
        const prefs = JSON.parse(saved);
        if (typeof prefs.volume === 'number') radioVolume = prefs.volume;
        if (typeof prefs.station === 'string' && STATIONS[prefs.station]) {
          currentStation = prefs.station;
        }
      }
    } catch (err) {
      console.warn('Failed to load radio preferences:', err);
    }
  };
  
  /**
   * Save preferences to localStorage
   */
  const savePreferences = () => {
    try {
      localStorage.setItem(RADIO_SAVE_KEY, JSON.stringify({
        volume: radioVolume,
        station: currentStation
      }));
    } catch (err) {
      console.warn('Failed to save radio preferences:', err);
    }
  };
  
  /**
   * Update the gain node volume
   */
  const updateVolume = () => {
    if (!isInitialized || !radioGain) return;
    radioGain.gain.setValueAtTime(radioVolume, audioCtx.currentTime);
  };
  
  /**
   * Set radio volume
   * @param {number} value - Volume 0-1
   */
  const setVolume = (value) => {
    radioVolume = Math.max(0, Math.min(1, value));
    updateVolume();
    savePreferences();
  };
  
  /**
   * Get radio volume
   * @returns {number}
   */
  const getVolume = () => radioVolume;
  
  /**
   * Get all available stations
   * @returns {Object}
   */
  const getStations = () => ({ ...STATIONS });
  
  /**
   * Get current station info
   * @returns {Object|null}
   */
  const getCurrentStation = () => currentStation ? STATIONS[currentStation] : null;
  
  // ==========================================
  // SOUND GENERATION UTILITIES
  // ==========================================
  
  /**
   * Create a basic oscillator with envelope
   */
  const createOsc = (options = {}) => {
    const {
      freq = 440,
      type = 'sine',
      duration = 0.5,
      attack = 0.01,
      decay = 0.1,
      sustain = 0.5,
      release = 0.2,
      volume = 0.3,
      detune = 0,
      delay = 0
    } = options;
    
    const startTime = audioCtx.currentTime + delay;
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    osc.detune.setValueAtTime(detune, startTime);
    
    // ADSR envelope
    const attackEnd = startTime + attack;
    const decayEnd = attackEnd + decay;
    const sustainEnd = startTime + duration - release;
    const releaseEnd = startTime + duration;
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, attackEnd);
    gainNode.gain.linearRampToValueAtTime(volume * sustain, decayEnd);
    if (sustainEnd > decayEnd) {
      gainNode.gain.setValueAtTime(volume * sustain, sustainEnd);
    }
    gainNode.gain.linearRampToValueAtTime(0, releaseEnd);
    
    osc.connect(gainNode);
    gainNode.connect(radioGain);
    
    osc.start(startTime);
    osc.stop(releaseEnd + 0.01);
    
    return { osc, gainNode };
  };
  
  /**
   * Create noise buffer
   */
  const createNoise = (type = 'white', duration = 0.1, volume = 0.2, delay = 0) => {
    const startTime = audioCtx.currentTime + delay;
    const bufferSize = Math.floor(audioCtx.sampleRate * duration);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    
    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'pink') {
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
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(8000, startTime);
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(radioGain);
    
    source.start(startTime);
    source.stop(startTime + duration + 0.01);
    
    return { source, gainNode };
  };
  
  /**
   * Create a kick drum sound
   */
  const createKick = (delay = 0, volume = 0.5) => {
    const startTime = audioCtx.currentTime + delay;
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, startTime);
    osc.frequency.exponentialRampToValueAtTime(40, startTime + 0.15);
    
    gainNode.gain.setValueAtTime(volume, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
    
    osc.connect(gainNode);
    gainNode.connect(radioGain);
    
    osc.start(startTime);
    osc.stop(startTime + 0.35);
    
    // Click transient
    createNoise('white', 0.02, volume * 0.3, delay);
    
    return { osc, gainNode };
  };
  
  /**
   * Create a snare/clap sound
   */
  const createSnare = (delay = 0, volume = 0.4) => {
    const startTime = audioCtx.currentTime + delay;
    
    // Body
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, startTime);
    osc.frequency.exponentialRampToValueAtTime(100, startTime + 0.1);
    oscGain.gain.setValueAtTime(volume * 0.5, startTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
    osc.connect(oscGain);
    oscGain.connect(radioGain);
    osc.start(startTime);
    osc.stop(startTime + 0.2);
    
    // Noise
    createNoise('white', 0.15, volume * 0.6, delay);
    
    return { osc, oscGain };
  };
  
  /**
   * Create hi-hat sound
   */
  const createHihat = (open = false, delay = 0, volume = 0.2) => {
    const duration = open ? 0.3 : 0.08;
    createNoise('white', duration, volume, delay);
  };
  
  /**
   * Create bass note
   */
  const createBass = (note, duration = 0.25, delay = 0, volume = 0.35) => {
    const freq = NOTES[note] || 110;
    
    createOsc({
      freq: freq / 2,  // One octave down
      type: 'sawtooth',
      duration,
      attack: 0.01,
      decay: 0.1,
      sustain: 0.6,
      release: 0.05,
      volume,
      delay
    });
    
    // Sub bass layer
    createOsc({
      freq: freq / 4,
      type: 'sine',
      duration,
      attack: 0.02,
      decay: 0.1,
      sustain: 0.7,
      release: 0.05,
      volume: volume * 0.6,
      delay
    });
  };
  
  /**
   * Create pad/chord sound
   */
  const createPad = (notes, duration = 2, delay = 0, volume = 0.15, type = 'sine') => {
    notes.forEach((note, i) => {
      const freq = NOTES[note] || 220;
      
      createOsc({
        freq,
        type,
        duration,
        attack: 0.3,
        decay: 0.5,
        sustain: 0.6,
        release: 0.5,
        volume: volume / notes.length,
        detune: (i - notes.length / 2) * 5, // Slight detuning for richness
        delay
      });
      
      // Add shimmer
      if (type === 'sine') {
        createOsc({
          freq: freq * 2,
          type: 'sine',
          duration,
          attack: 0.4,
          decay: 0.6,
          sustain: 0.3,
          release: 0.6,
          volume: (volume / notes.length) * 0.15,
          delay
        });
      }
    });
  };
  
  /**
   * Create lead/arpeggio note
   */
  const createLead = (note, duration = 0.15, delay = 0, volume = 0.2, type = 'square') => {
    const freq = NOTES[note] || 440;
    
    createOsc({
      freq,
      type,
      duration,
      attack: 0.01,
      decay: 0.05,
      sustain: 0.4,
      release: 0.1,
      volume,
      delay
    });
    
    // Detuned layer for thickness
    createOsc({
      freq,
      type,
      duration,
      attack: 0.01,
      decay: 0.05,
      sustain: 0.4,
      release: 0.1,
      volume: volume * 0.3,
      detune: 7,
      delay
    });
  };
  
  // ==========================================
  // STATION-SPECIFIC GENERATORS
  // ==========================================
  
  /**
   * Generate Synthwave pattern
   */
  const playSynthwave = (beatDelay, beat, measure) => {
    const station = STATIONS.synthwave;
    const beatMs = bpmToMs(station.bpm);
    const progression = PROGRESSIONS.synthwave;
    const chordIndex = measure % progression.length;
    const chord = progression[chordIndex];
    const scale = SCALES[station.key];
    
    // 4/4 beat pattern
    const beatInMeasure = beat % 4;
    
    // Kick on 1 and 3
    if (beatInMeasure === 0 || beatInMeasure === 2) {
      createKick(beatDelay, 0.45);
    }
    
    // Snare on 2 and 4
    if (beatInMeasure === 1 || beatInMeasure === 3) {
      createSnare(beatDelay, 0.35);
    }
    
    // Hi-hats on every 8th note
    createHihat(false, beatDelay, 0.15);
    createHihat(false, beatDelay + beatMs / 2 / 1000, 0.1);
    
    // Bass on 1 and 3
    if (beatInMeasure === 0) {
      createBass(chord[0], beatMs * 2 / 1000, beatDelay, 0.3);
    }
    
    // Pad chord changes every measure
    if (beatInMeasure === 0) {
      createPad(chord, beatMs * 4 / 1000, beatDelay, 0.18, 'sawtooth');
    }
    
    // Arpeggio pattern
    if (beat % 2 === 0) {
      const arpNotes = [...chord, scale[Math.floor(Math.random() * scale.length)]];
      arpNotes.forEach((note, i) => {
        createLead(note, 0.12, beatDelay + (i * beatMs / 4) / 1000, 0.12, 'square');
      });
    }
  };
  
  /**
   * Generate Techno pattern
   */
  const playTechno = (beatDelay, beat, measure) => {
    const station = STATIONS.techno;
    const beatMs = bpmToMs(station.bpm);
    const progression = PROGRESSIONS.techno;
    const chordIndex = Math.floor(measure / 2) % progression.length;
    const chord = progression[chordIndex];
    
    const beatInMeasure = beat % 4;
    
    // Four on the floor kick
    createKick(beatDelay, 0.55);
    
    // Snare/clap on 2 and 4
    if (beatInMeasure === 1 || beatInMeasure === 3) {
      createSnare(beatDelay, 0.4);
    }
    
    // Off-beat hi-hats
    createHihat(false, beatDelay + beatMs / 2 / 1000, 0.2);
    
    // Open hi-hat on 4+
    if (beatInMeasure === 3) {
      createHihat(true, beatDelay + beatMs / 2 / 1000, 0.15);
    }
    
    // Driving bass
    if (beatInMeasure === 0 || beatInMeasure === 2) {
      createBass(chord[0], beatMs / 1000, beatDelay, 0.4);
    }
    
    // Stab chords
    if (beat % 8 === 4) {
      createPad(chord, 0.1, beatDelay, 0.25, 'square');
    }
  };
  
  /**
   * Generate Lo-Fi pattern
   */
  const playLofi = (beatDelay, beat, measure) => {
    const station = STATIONS.lofi;
    const beatMs = bpmToMs(station.bpm);
    const progression = PROGRESSIONS.lofi;
    const chordIndex = Math.floor(measure / 2) % progression.length;
    const chord = progression[chordIndex];
    const scale = SCALES[station.key];
    
    const beatInMeasure = beat % 4;
    
    // Laid back kick
    if (beatInMeasure === 0 || beatInMeasure === 2) {
      createKick(beatDelay + 0.02, 0.35); // Slightly late for swing
    }
    
    // Rim shot style snare
    if (beatInMeasure === 1 || beatInMeasure === 3) {
      createSnare(beatDelay, 0.2);
    }
    
    // Gentle hi-hats with swing
    const swing = beatInMeasure % 2 === 1 ? 0.03 : 0;
    createHihat(false, beatDelay + swing, 0.12);
    createHihat(false, beatDelay + beatMs / 2 / 1000, 0.08);
    
    // Warm pad
    if (beatInMeasure === 0) {
      createPad(chord, beatMs * 8 / 1000, beatDelay, 0.12, 'sine');
    }
    
    // Mellow bass
    if (beatInMeasure === 0) {
      createBass(chord[0], beatMs * 2 / 1000, beatDelay, 0.25);
    }
    
    // Random melodic notes
    if (Math.random() > 0.7 && beatInMeasure === 2) {
      const randomNote = scale[Math.floor(Math.random() * scale.length)];
      createLead(randomNote, 0.3, beatDelay, 0.1, 'sine');
    }
  };
  
  /**
   * Generate Drum & Bass pattern
   */
  const playDnb = (beatDelay, beat, measure) => {
    const station = STATIONS.dnb;
    const beatMs = bpmToMs(station.bpm);
    const progression = PROGRESSIONS.dnb;
    const chordIndex = Math.floor(measure / 4) % progression.length;
    const chord = progression[chordIndex];
    
    const beatInMeasure = beat % 4;
    
    // Classic 2-step pattern
    if (beatInMeasure === 0) {
      createKick(beatDelay, 0.5);
    }
    if (beatInMeasure === 2) {
      createKick(beatDelay + beatMs / 4 / 1000, 0.45);
    }
    
    // Snare on 2 and 4
    if (beatInMeasure === 1 || beatInMeasure === 3) {
      createSnare(beatDelay, 0.45);
    }
    
    // Fast hi-hats
    for (let i = 0; i < 4; i++) {
      createHihat(false, beatDelay + (i * beatMs / 4) / 1000, 0.1 + Math.random() * 0.05);
    }
    
    // Rolling bass
    if (beatInMeasure === 0 || beatInMeasure === 2) {
      createBass(chord[0], beatMs / 1000, beatDelay, 0.35);
    }
    
    // Pad every 4 measures
    if (beat % 16 === 0) {
      createPad(chord, beatMs * 16 / 1000, beatDelay, 0.15, 'sawtooth');
    }
  };
  
  /**
   * Generate Ambient pattern
   */
  const playAmbient = (beatDelay, beat, measure) => {
    const station = STATIONS.ambient;
    const beatMs = bpmToMs(station.bpm);
    const progression = PROGRESSIONS.ambient;
    const chordIndex = Math.floor(measure / 8) % progression.length;
    const chord = progression[chordIndex];
    const scale = SCALES[station.key];
    
    // Very sparse rhythm
    if (beat % 16 === 0) {
      createPad(chord, beatMs * 16 / 1000, beatDelay, 0.2, 'sine');
    }
    
    // Occasional bass drone
    if (beat % 32 === 0) {
      createBass(chord[0], beatMs * 8 / 1000, beatDelay, 0.15);
    }
    
    // Random atmospheric notes
    if (Math.random() > 0.85) {
      const randomNote = scale[Math.floor(Math.random() * scale.length)];
      createLead(randomNote, 1.5, beatDelay + Math.random() * 0.5, 0.08, 'sine');
    }
    
    // Subtle texture
    if (beat % 8 === 4) {
      createNoise('pink', 0.5, 0.03, beatDelay);
    }
  };
  
  /**
   * Generate House pattern
   */
  const playHouse = (beatDelay, beat, measure) => {
    const station = STATIONS.house;
    const beatMs = bpmToMs(station.bpm);
    const progression = PROGRESSIONS.house;
    const chordIndex = Math.floor(measure / 2) % progression.length;
    const chord = progression[chordIndex];
    const scale = SCALES[station.key];
    
    const beatInMeasure = beat % 4;
    
    // Four on the floor
    createKick(beatDelay, 0.5);
    
    // Clap on 2 and 4
    if (beatInMeasure === 1 || beatInMeasure === 3) {
      createSnare(beatDelay, 0.35);
    }
    
    // Shaker/hi-hat pattern
    createHihat(false, beatDelay, 0.15);
    createHihat(false, beatDelay + beatMs / 2 / 1000, 0.18);
    
    // Open hat on upbeats occasionally
    if (beatInMeasure === 3 && measure % 2 === 1) {
      createHihat(true, beatDelay + beatMs / 2 / 1000, 0.12);
    }
    
    // Funky bass
    if (beatInMeasure === 0) {
      createBass(chord[0], beatMs * 1.5 / 1000, beatDelay, 0.35);
    }
    if (beatInMeasure === 2) {
      createBass(chord[0], beatMs / 2 / 1000, beatDelay + beatMs / 2 / 1000, 0.25);
    }
    
    // Chord stabs
    if (beat % 4 === 1 || beat % 8 === 6) {
      createPad(chord, 0.15, beatDelay, 0.2, 'square');
    }
    
    // Piano-style lead
    if (beat % 8 === 0) {
      chord.forEach((note, i) => {
        createLead(note, 0.25, beatDelay + (i * 0.05), 0.1, 'triangle');
      });
    }
  };
  
  // ==========================================
  // PLAYBACK CONTROL
  // ==========================================
  
  /**
   * Main scheduler that plays beats
   */
  const scheduler = () => {
    if (!isPlaying || !currentStation) return;
    
    const station = STATIONS[currentStation];
    const beatMs = bpmToMs(station.bpm);
    const now = performance.now();
    
    // Schedule ahead slightly for smooth playback
    const scheduleAhead = 0.05; // 50ms ahead
    const beatDelay = scheduleAhead;
    
    // Play the appropriate station pattern
    switch (currentStation) {
      case 'synthwave':
        playSynthwave(beatDelay, currentBeat, measureCount);
        break;
      case 'techno':
        playTechno(beatDelay, currentBeat, measureCount);
        break;
      case 'lofi':
        playLofi(beatDelay, currentBeat, measureCount);
        break;
      case 'dnb':
        playDnb(beatDelay, currentBeat, measureCount);
        break;
      case 'ambient':
        playAmbient(beatDelay, currentBeat, measureCount);
        break;
      case 'house':
        playHouse(beatDelay, currentBeat, measureCount);
        break;
    }
    
    // Advance beat counter
    currentBeat++;
    if (currentBeat % 4 === 0) {
      measureCount++;
    }
    
    lastBeatTime = now;
  };
  
  /**
   * Start playing a station
   * @param {string} stationId - Station ID to play
   */
  const play = (stationId = 'synthwave') => {
    if (!isInitialized) {
      if (!init()) return false;
    }
    
    if (!STATIONS[stationId]) {
      console.warn(`Unknown station: ${stationId}`);
      return false;
    }
    
    // Stop current playback if any
    stop();
    
    resume();
    
    currentStation = stationId;
    isPlaying = true;
    currentBeat = 0;
    measureCount = 0;
    lastBeatTime = performance.now();
    
    const station = STATIONS[stationId];
    const beatMs = bpmToMs(station.bpm);
    
    // Start the scheduler interval
    schedulerInterval = setInterval(scheduler, beatMs);
    
    savePreferences();
    
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('radioStateChange', {
      detail: { playing: true, station: STATIONS[stationId] }
    }));
    
    return true;
  };
  
  /**
   * Stop playback
   */
  const stop = () => {
    isPlaying = false;
    
    if (schedulerInterval) {
      clearInterval(schedulerInterval);
      schedulerInterval = null;
    }
    
    currentBeat = 0;
    measureCount = 0;
    
    // Dispatch event for UI updates
    window.dispatchEvent(new CustomEvent('radioStateChange', {
      detail: { playing: false, station: null }
    }));
  };
  
  /**
   * Toggle playback
   */
  const toggle = () => {
    if (isPlaying) {
      stop();
    } else {
      play(currentStation || 'synthwave');
    }
    return isPlaying;
  };
  
  /**
   * Switch to next station
   */
  const nextStation = () => {
    const stationIds = Object.keys(STATIONS);
    const currentIndex = stationIds.indexOf(currentStation);
    const nextIndex = (currentIndex + 1) % stationIds.length;
    const nextStationId = stationIds[nextIndex];
    
    if (isPlaying) {
      play(nextStationId);
    } else {
      currentStation = nextStationId;
      savePreferences();
    }
    
    return STATIONS[nextStationId];
  };
  
  /**
   * Switch to previous station
   */
  const prevStation = () => {
    const stationIds = Object.keys(STATIONS);
    const currentIndex = stationIds.indexOf(currentStation);
    const prevIndex = (currentIndex - 1 + stationIds.length) % stationIds.length;
    const prevStationId = stationIds[prevIndex];
    
    if (isPlaying) {
      play(prevStationId);
    } else {
      currentStation = prevStationId;
      savePreferences();
    }
    
    return STATIONS[prevStationId];
  };
  
  /**
   * Check if radio is playing
   * @returns {boolean}
   */
  const isRadioPlaying = () => isPlaying;
  
  // ==========================================
  // PUBLIC API
  // ==========================================
  
  return {
    // Core
    init,
    resume,
    
    // Playback
    play,
    stop,
    toggle,
    nextStation,
    prevStation,
    
    // State
    isPlaying: isRadioPlaying,
    getCurrentStation,
    getStations,
    
    // Volume
    setVolume,
    getVolume
  };
})();
