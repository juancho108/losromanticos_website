import React, { useEffect, useRef, useCallback } from 'react';

interface AudioControllerProps {
    isPlaying: boolean;
    setPlaying: (v: boolean) => void;
    isMuted: boolean;
}

const AudioController: React.FC<AudioControllerProps> = ({ isPlaying, setPlaying, isMuted }) => {
    const audioCtx = useRef<AudioContext | null>(null);
    const isMutedRef = useRef(isMuted); // Ref to access inside event listeners
    
    // Nodes
    const oscLow = useRef<OscillatorNode | null>(null);
    const oscHigh = useRef<OscillatorNode | null>(null);
    const noiseNode = useRef<AudioBufferSourceNode | null>(null); // For "Click" texture
    const rhythmGain = useRef<GainNode | null>(null);
    const masterGain = useRef<GainNode | null>(null);
    
    const isInitialized = useRef(false);
    const nextNoteTime = useRef<number>(0);
    const timerID = useRef<number | null>(null);
    const tempoRef = useRef<number>(50); 

    // Sync Ref with Prop
    useEffect(() => {
        isMutedRef.current = isMuted;
        if (audioCtx.current && masterGain.current) {
            if (isMuted) {
                masterGain.current.gain.setTargetAtTime(0, audioCtx.current.currentTime, 0.1);
            } else {
                // Restore volume based on current scroll
                const docHeight = document.body.scrollHeight - window.innerHeight;
                const scrollY = window.scrollY;
                const progress = Math.min(scrollY / docHeight, 1);
                const targetVol = 0.15 + (progress * 0.4);
                masterGain.current.gain.setTargetAtTime(targetVol, audioCtx.current.currentTime, 0.1);
            }
        }
    }, [isMuted]);

    // Helper: Create White Noise Buffer for High-End "Click" (Mobile audible)
    const createNoiseBuffer = (ctx: AudioContext) => {
        const bufferSize = ctx.sampleRate * 2; // 2 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    };

    // Initialize Audio Engine
    const initAudio = useCallback(() => {
        if (isInitialized.current) return;
        
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtx.current = new Ctx();
        
        // 1. Master Volume
        masterGain.current = audioCtx.current!.createGain();
        masterGain.current.gain.value = isMutedRef.current ? 0 : 0.1; 
        masterGain.current.connect(audioCtx.current!.destination);

        // 2. Rhythm Gain (Envelope for the beat)
        rhythmGain.current = audioCtx.current!.createGain();
        rhythmGain.current.gain.value = 0;
        rhythmGain.current.connect(masterGain.current);

        // 3. Oscillator 1: Deep Bass (Body) - 50Hz
        oscLow.current = audioCtx.current!.createOscillator();
        oscLow.current.type = 'sine'; 
        oscLow.current.frequency.value = 50; 
        oscLow.current.connect(rhythmGain.current);

        // 4. Oscillator 2: Mid Bass (Harmonic) - 100Hz
        oscHigh.current = audioCtx.current!.createOscillator();
        oscHigh.current.type = 'triangle'; 
        oscHigh.current.frequency.value = 100;
        // Low mix for harmonic
        const highGain = audioCtx.current!.createGain();
        highGain.gain.value = 0.2; 
        oscHigh.current.connect(highGain);
        highGain.connect(rhythmGain.current);

        oscLow.current.start();
        oscHigh.current.start();

        isInitialized.current = true;
    }, []);

    // Explicit Unlock for iOS/Android
    const unlockAudioContext = () => {
        if (audioCtx.current && audioCtx.current.state === 'suspended') {
            audioCtx.current.resume();
            // Play a silent buffer to force the audio engine to wake up
            const buffer = audioCtx.current.createBuffer(1, 1, 22050);
            const source = audioCtx.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioCtx.current.destination);
            source.start(0);
        }
    };

    const scheduleBeat = useCallback(() => {
        if (!audioCtx.current || !rhythmGain.current || !oscLow.current) return;

        const secondsPerBeat = 60.0 / tempoRef.current;
        const currentTime = audioCtx.current.currentTime;

        if (nextNoteTime.current < currentTime) {
            nextNoteTime.current = currentTime;
        }

        // Schedule upcoming beats
        while (nextNoteTime.current < currentTime + 0.1) {
            const t = nextNoteTime.current;
            
            // Only schedule audible changes if not muted, or keep scheduling silently to maintain rhythm
            // We schedule anyway, masterGain handles the silence.
            
            // --- Envelope (ADSR) ---
            // Sharp Attack for percussive feel
            rhythmGain.current.gain.cancelScheduledValues(t);
            rhythmGain.current.gain.setValueAtTime(0, t);
            rhythmGain.current.gain.linearRampToValueAtTime(1, t + 0.01); 
            rhythmGain.current.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

            // --- Pitch Kick Effect ---
            const currentFreq = oscLow.current.frequency.value;
            oscLow.current.frequency.setValueAtTime(currentFreq + 40, t);
            oscLow.current.frequency.exponentialRampToValueAtTime(currentFreq, t + 0.1);

            // --- Transient Noise (The "Click" for Phones) ---
            // Create a short burst of noise for high-frequency definition
            const noise = audioCtx.current.createBufferSource();
            noise.buffer = createNoiseBuffer(audioCtx.current);
            const noiseEnvelope = audioCtx.current.createGain();
            noise.connect(noiseEnvelope);
            noiseEnvelope.connect(masterGain.current!); // Direct to master
            
            noiseEnvelope.gain.setValueAtTime(0.05, t);
            noiseEnvelope.gain.exponentialRampToValueAtTime(0.001, t + 0.05); // Very short click
            
            noise.start(t);
            noise.stop(t + 0.05);

            nextNoteTime.current += secondsPerBeat;
        }

        timerID.current = requestAnimationFrame(scheduleBeat);
    }, []);

    // Scroll Logic
    useEffect(() => {
        const handleScroll = () => {
            if (!isInitialized.current || !masterGain.current || !oscLow.current || !audioCtx.current) return;
            
            // If muted, we don't update volume, but we still update tempo/pitch for when it's unmuted
            const scrollY = window.scrollY;
            const docHeight = document.body.scrollHeight - window.innerHeight;
            const progress = Math.min(scrollY / docHeight, 1);
            
            // Fade out at very end
            if (scrollY > docHeight - 50) {
                 // Even if not muted, fade out at end
                masterGain.current.gain.setTargetAtTime(0, audioCtx.current.currentTime, 0.2);
                return;
            }

            // Volume Increase (Only apply if NOT muted)
            if (!isMutedRef.current) {
                const targetVol = 0.15 + (progress * 0.4);
                masterGain.current.gain.setTargetAtTime(targetVol, audioCtx.current.currentTime, 0.1);
            }

            // Pitch Rise (Tension)
            const targetFreq = 50 + (progress * 40);
            oscLow.current.frequency.setTargetAtTime(targetFreq, audioCtx.current.currentTime, 0.1);

            // Tempo Acceleration: 50 BPM -> 150 BPM
            tempoRef.current = 50 + (progress * 100);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Toggle Logic
    useEffect(() => {
        if (isPlaying) {
            if (!isInitialized.current) initAudio();
            unlockAudioContext();
            
            nextNoteTime.current = audioCtx.current!.currentTime + 0.1;
            scheduleBeat();
        } else {
            if (timerID.current) cancelAnimationFrame(timerID.current);
            if (audioCtx.current) audioCtx.current.suspend();
        }

        return () => {
            if (timerID.current) cancelAnimationFrame(timerID.current);
        };
    }, [isPlaying, initAudio, scheduleBeat]);

    return null;
};

export default AudioController;