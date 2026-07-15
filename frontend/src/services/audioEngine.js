// Web Audio API Engine for BASS PHONK
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.source = null;
    this.gainNode = null;
    this.bassFilter = null;
    this.eqFilters = [];
    this.panner = null;
    this.analyser = null;
    
    // Oscillation for 8D audio
    this.panAngle = 0;
    this.panDirection = 0.02;
    this.panInterval = null;
  }

  init(audioElement) {
    if (this.ctx) return; // Already initialized

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      // Create node source from HTML5 audio element
      this.source = this.ctx.createMediaElementSource(audioElement);
      
      // 0. Create Gain Node for volume boosting (supporting up to 1000% / 10.0 gain)
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 1.0;

      // 1. Equalizer Filters (10 Bands)
      const frequencies = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];
      this.eqFilters = frequencies.map((freq, idx) => {
        const filter = this.ctx.createBiquadFilter();
        if (idx === 0) {
          filter.type = 'lowshelf';
        } else if (idx === frequencies.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
        }
        filter.frequency.value = freq;
        filter.Q.value = 1.0;
        filter.gain.value = 0.0;
        return filter;
      });

      // 2. Bass Boost Filter (Lowshelf centered at 80Hz)
      this.bassFilter = this.ctx.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.value = 80;
      this.bassFilter.gain.value = 6.0; // Default moderate boost

      // 3. 8D Panner Node
      this.panner = this.ctx.createStereoPanner();
      this.panner.pan.value = 0.0;

      // 4. Analyser Node for Visualizers
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;

      // Connect Signal Chain: Source -> Gain Node -> EQ Filters -> Bass Boost -> 8D Panner -> Analyser -> Destination
      this.source.connect(this.gainNode);
      
      let lastNode = this.gainNode;
      this.eqFilters.forEach(filter => {
        lastNode.connect(filter);
        lastNode = filter;
      });
      
      lastNode.connect(this.bassFilter);
      this.bassFilter.connect(this.panner);
      this.panner.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    } catch (err) {
      console.warn("Web Audio API not supported or blocked in this browser:", err);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(value) {
    if (this.gainNode) {
      // value should be between 0.0 and 10.0 (1000%)
      this.gainNode.gain.setValueAtTime(value, this.ctx.currentTime);
    }
  }

  setBassBoost(value) {
    if (!this.bassFilter) return;
    // Map 0-100 slider to 0-15dB boost
    const gain = (value / 100) * 15;
    this.bassFilter.gain.value = gain;
  }

  setEqBand(index, dbValue) {
    if (this.eqFilters[index]) {
      // dbValue should be between -12 and +12
      this.eqFilters[index].gain.value = dbValue;
    }
  }

  set8D(enabled) {
    if (!this.panner) return;
    
    if (this.panInterval) {
      clearInterval(this.panInterval);
      this.panInterval = null;
    }
    
    if (enabled) {
      this.panInterval = setInterval(() => {
        this.panAngle += this.panDirection;
        if (this.panAngle >= 1.0 || this.panAngle <= -1.0) {
          this.panDirection *= -1; // Bounce back
        }
        this.panner.pan.value = this.panAngle;
      }, 50);
    } else {
      this.panner.pan.value = 0.0;
    }
  }

  getAnalyserData() {
    if (!this.analyser) return new Uint8Array(0);
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  getWaveformData() {
    if (!this.analyser) return new Uint8Array(0);
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }
}

export const audioEngine = new AudioEngine();
export default audioEngine;
