import React, { useEffect, useRef, useState } from 'react';
import ParticleCanvas, { ParticleSettings } from './components/ParticleCanvas';
import MemberCard from './components/MemberCard';
import AudioController from './components/AudioController';
import { Member } from './types';

// Declare GSAP/Confetti for TypeScript
declare global {
    interface Window {
        gsap: any;
        ScrollTrigger: any;
        confetti: any;
        AudioContext: any;
        webkitAudioContext: any;
    }
}

const MEMBERS: Member[] = [
    { id: 1, name: "Nicolás Astorgano", role: "Bajo/Voz", instrumentIcon: "🎸", style: "Groove Elegante", influences: "Funk, Soul, Jazz", image: "/images/romanticos/nico.png" },
    { id: 2, name: "Juan José Ferreyra", role: "Voz", instrumentIcon: "🎙️", style: "Balada Pop", influences: "Balada Rock, Pop Latino, Bolero", image: "/images/romanticos/juan.png" },
    { id: 3, name: "Manuel Aguilar", role: "Voz", instrumentIcon: "🎤", style: "Caribe romántico", influences: "Salsa, Pop Latino, Bolero", image: "/images/romanticos/manu.png" },
    { id: 4, name: "Alan Vispo", role: "Guitarra", instrumentIcon: "🎸", style: "Solo & Textura", influences: "Jazz, Rock, Blues", image: "/images/romanticos/alan.png" },
    { id: 5, name: "Lautaro Parra", role: "Batería", instrumentIcon: "🥁", style: "El Corazón & Beat", influences: "Jazz, Rock, Pop", image: "/images/romanticos/lauti.png" }
];

type ViewState = 'home' | 'construction';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewState>('home');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [showIntro, setShowIntro] = useState(false); // Init false for fade-in
    const [isMuted, setIsMuted] = useState(false);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const heroRef = useRef<HTMLDivElement>(null);
    const teamRef = useRef<HTMLDivElement>(null);
    const footerRef = useRef<HTMLDivElement>(null);
    const waButtonRef = useRef<HTMLButtonElement>(null);

    // Particle Config Ref
    const particleSettings = useRef<ParticleSettings>({
        speedMultiplier: 0.5,
        colorMode: 'yellow',
        densityMultiplier: 1.0
    });

    // Audio Singleton
    const audioCtxRef = useRef<AudioContext | null>(null);

    // --- FIX: INTRO FADE-IN ---
    useEffect(() => {
        const timer = setTimeout(() => setShowIntro(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // --- LOCK SCROLL LOGIC ---
    useEffect(() => {
        const body = document.body;
        // Lock scroll if not started OR if menu is open
        if (!hasStarted || isMobileMenuOpen) {
            body.style.overflow = 'hidden';
        } else {
            body.style.overflow = '';
            body.style.overflowX = 'hidden';
        }
    }, [hasStarted, isMobileMenuOpen]);

    // --- AUDIO ENGINE ---
    const playSound = (soundFn: (ctx: AudioContext, t: number) => void) => {
        try {
            const ctx = audioCtxRef.current;
            if (!ctx || ctx.state === 'closed') return;
            soundFn(ctx, ctx.currentTime);
        } catch (e) {
            console.warn("Audio error", e);
        }
    };

    const initAudioContext = async () => {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;

        const ctx = new Ctx();
        audioCtxRef.current = ctx;
        if (ctx.state === 'suspended') await ctx.resume();

        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);

        playEtherealSwoosh();
        setHasStarted(true);
    };

    // --- ASMR EFFECTS FOR TOGGLE ---
    const playReverseImpact = () => {
        playSound((ctx, t) => {
            // "Power Down" / Suction effect
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            // Pitch drop (Suction)
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(10, t + 0.6);

            // Volume suck out
            gain.gain.setValueAtTime(0.5, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.6);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.6);

            // Filtered Noise closing down
            const bufferSize = ctx.sampleRate * 0.6;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1000, t);
            filter.frequency.exponentialRampToValueAtTime(10, t + 0.5);

            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.3, t);
            noiseGain.gain.linearRampToValueAtTime(0, t + 0.5);

            noise.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(ctx.destination);
            noise.start(t);
        });
    };

    const playForwardImpact = () => {
        playSound((ctx, t) => {
            // Clean, heavy cinematic boom
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.frequency.setValueAtTime(80, t);
            osc.frequency.exponentialRampToValueAtTime(1, t + 0.5);

            gain.gain.setValueAtTime(0.8, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.5);
        });
    };

    const toggleSound = () => {
        const nextState = !isMuted;
        setIsMuted(nextState);

        if (nextState) {
            // Muting: Play reverse suction
            playReverseImpact();
        } else {
            // Unmuting: Play forward impact
            playForwardImpact();
        }
    };

    const playDeepSwoosh = () => {
        playSound((ctx, t) => {
            // Deep, cinematic impact/swoosh for final button
            const bufferSize = ctx.sampleRate * 4;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            // Low pass filter sweeping down aggressively
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, t);
            filter.frequency.exponentialRampToValueAtTime(40, t + 2);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(1.0, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 3);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            noise.start(t);

            // Sub-bass layer
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(50, t);
            osc.frequency.exponentialRampToValueAtTime(10, t + 2);

            const oscGain = ctx.createGain();
            oscGain.gain.setValueAtTime(0.6, t);
            oscGain.gain.exponentialRampToValueAtTime(0.001, t + 2);

            osc.connect(oscGain);
            oscGain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 2);
        });
    };

    const playEtherealSwoosh = () => {
        playSound((ctx, t) => {
            const bufferSize = ctx.sampleRate * 2;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, t);
            filter.frequency.exponentialRampToValueAtTime(1200, t + 1.5);

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.3, t + 0.5);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 2);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            noise.start(t);
        });
    };

    const playFlipSound = () => {
        playSound((ctx, t) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(2000, t);
            osc.frequency.exponentialRampToValueAtTime(500, t + 0.05);
            gain.gain.setValueAtTime(0.05, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.1);
        });
    };

    const playJazzChord = () => {
        playSound((ctx, t) => {
            const gain = ctx.createGain();
            gain.connect(ctx.destination);
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.1, t + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 3);
            const freqs = [174.61, 220.00, 261.63, 329.63, 392.00];
            freqs.forEach(f => {
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = f;
                osc.connect(gain);
                osc.start(t);
                osc.stop(t + 3);
            });
        });
    };

    const playPartyKick = () => {
        playSound((ctx, t) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(40, t + 0.1);
            gain.gain.setValueAtTime(0.8, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.3);
        });
    };

    const playImpactSound = () => {
        playSound((ctx, t) => {
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(120, t);
            osc.frequency.exponentialRampToValueAtTime(30, t + 0.8);
            oscGain.gain.setValueAtTime(1.0, t);
            oscGain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
            osc.connect(oscGain);
            oscGain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 2.5);

            const bufferSize = ctx.sampleRate * 2;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.setValueAtTime(800, t);
            noiseFilter.frequency.exponentialRampToValueAtTime(100, t + 1);
            const noiseGain = ctx.createGain();
            noiseGain.gain.setValueAtTime(0.8, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(ctx.destination);
            noise.start(t);
        });
    };

    // --- NAVIGATION LOGIC ---
    const handleNav = (action: string) => {
        // 1. Trigger Menu Close
        setIsMobileMenuOpen(false);

        if (['HISTORIA', 'RIDER', 'AGENDA'].includes(action)) {
            setCurrentView('construction');
            window.scrollTo(0, 0);
            return;
        }

        const runScroll = () => {
            // 3. Ensure GSAP has latest layout metrics
            if (window.ScrollTrigger) window.ScrollTrigger.refresh();

            let target: any = 0;

            if (action === 'INICIO') {
                target = 0;
            } else if (action === 'LA BANDA') {
                // Use selector string for ScrollToPlugin
                target = "#banda";
            } else if (action === 'CONTACTO') {
                // FIX: Look for the specific ID we assigned to the footer ScrollTrigger
                const st = window.ScrollTrigger.getById("footer-pin");
                if (st) {
                    // Scroll to the absolute END of the pinned section
                    // This forces the scrub animation to completion (everything visible)
                    target = st.end;
                } else {
                    // Fallback to simple anchor scroll
                    target = "#contacto";
                }
            }

            // 4. Use GSAP ScrollToPlugin for accurate travel
            if (window.gsap) {
                window.gsap.to(window, {
                    duration: 1.5,
                    scrollTo: { y: target, autoKill: false },
                    ease: "power3.inOut"
                });
            } else {
                // Fallback if plugin fails to load
                window.scrollTo({ top: typeof target === 'number' ? target : 0, behavior: 'smooth' });
            }
        };

        if (currentView !== 'home') {
            setCurrentView('home');
            setTimeout(runScroll, 200);
        } else {
            // 2. Wait for menu exit transition (approx 500ms) to finish and body scrollbar to reappear
            setTimeout(runScroll, 500);
        }
    };

    // --- ANIMATIONS ---
    useEffect(() => {
        if (!window.gsap || !window.ScrollTrigger || !hasStarted || currentView !== 'home') return;
        const gsap = window.gsap;
        const ScrollTrigger = window.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);

        // Refresh triggers on mount
        ScrollTrigger.refresh();

        const ctx = gsap.context(() => {
            gsap.utils.toArray('.scroll-reveal').forEach((el: any) => {
                gsap.fromTo(el,
                    { opacity: 0, y: 50 },
                    {
                        opacity: 1, y: 0, duration: 1, ease: "power2.out",
                        scrollTrigger: { trigger: el, start: "top 85%" }
                    }
                );
            });

            // Footer Pinning Timeline
            const masterTl = gsap.timeline({
                scrollTrigger: {
                    id: "footer-pin", // ASSIGN ID FOR NAVIGATION LOOKUP
                    trigger: footerRef.current,
                    start: "top top",
                    end: "+=300%",
                    scrub: 1,
                    pin: true,
                    onEnter: () => {
                        particleSettings.current = { speedMultiplier: 1.8, colorMode: 'multicolor', densityMultiplier: 3 };
                    },
                    onLeaveBack: () => {
                        particleSettings.current = { speedMultiplier: 2, colorMode: 'default', densityMultiplier: 1 };
                    }
                }
            });

            masterTl.fromTo("#footer-handwritten",
                { opacity: 0, scale: 0.8, y: 20 },
                { opacity: 1, scale: 1.2, y: 0, duration: 1.5, ease: "power2.out" }
            );

            masterTl.to("#footer-handwritten",
                { opacity: 0, scale: 2, filter: "blur(10px)", duration: 1 }
            );

            masterTl.fromTo("#hagamos-historia-bg",
                { opacity: 0, scale: 0.8, filter: "blur(20px)" },
                {
                    opacity: 0.4,
                    scale: 1.6,
                    filter: "blur(4px)",
                    duration: 2,
                    ease: "power2.inOut",
                    onStart: playImpactSound
                },
                "<"
            );

            masterTl.fromTo("#footer-glass-card",
                { opacity: 0, scale: 0.95, y: 30 },
                { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: "power2.out" },
                "-=0.5"
            );

            masterTl.fromTo("#footer-line-1",
                { y: 30, opacity: 0, scale: 0.9 },
                { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)", onStart: playEtherealSwoosh },
                "-=0.2"
            );

            masterTl.fromTo("#footer-line-2",
                { y: 30, opacity: 0, scale: 0.9 },
                { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)", onStart: playEtherealSwoosh },
                "+=0.1"
            );

            masterTl.fromTo("#footer-line-3",
                { y: 30, opacity: 0, scale: 0.9 },
                { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)", onStart: playEtherealSwoosh },
                "+=0.1"
            );

            masterTl.fromTo(".footer-icon-group",
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, stagger: 0.2, duration: 0.6, ease: "power2.out" },
                "+=0.2"
            );

            masterTl.fromTo("#footer-cta",
                { scale: 0.9, opacity: 0 },
                {
                    scale: 1,
                    opacity: 1,
                    duration: 1,
                    ease: "power2.out",
                    onStart: () => {
                        if (!isMuted) playDeepSwoosh();
                        if (window.confetti) {
                            window.confetti({ particleCount: 50, spread: 100, origin: { y: 0.9 }, colors: ['#D4AF37'], ticks: 200, gravity: 0.5 });
                        }
                    }
                },
                "+=0.2"
            );

            ScrollTrigger.create({
                trigger: "#phase-yellow",
                start: "top center",
                onEnter: () => {
                    particleSettings.current = { speedMultiplier: 3, colorMode: 'yellow', densityMultiplier: 1 };
                    if (!isMuted) playJazzChord();
                },
                onEnterBack: () => { particleSettings.current = { speedMultiplier: 3, colorMode: 'yellow', densityMultiplier: 1 }; }
            });

            ScrollTrigger.create({
                trigger: "#phase-blue",
                start: "top center",
                onEnter: () => {
                    particleSettings.current = { speedMultiplier: 1.5, colorMode: 'blue', densityMultiplier: 1 };
                    if (!isMuted) playEtherealSwoosh();
                },
                onEnterBack: () => { particleSettings.current = { speedMultiplier: 1.5, colorMode: 'blue', densityMultiplier: 1 }; }
            });

            ScrollTrigger.create({
                trigger: "#phase-pink",
                start: "top center",
                onEnter: () => {
                    particleSettings.current = { speedMultiplier: 5, colorMode: 'pink', densityMultiplier: 1.5 };
                    if (!isMuted) playPartyKick();
                },
                onEnterBack: () => { particleSettings.current = { speedMultiplier: 5, colorMode: 'pink', densityMultiplier: 1.5 }; }
            });

            ScrollTrigger.create({
                trigger: "#banda",
                start: "top center",
                onEnter: () => {
                    particleSettings.current = { speedMultiplier: 0, colorMode: 'default', densityMultiplier: 0 };
                }
            });

            if (heroRef.current) {
                const tlHero = gsap.timeline({ scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: true } });
                tlHero.to("#main-title", { y: -150, opacity: 0, scale: 0.9, filter: "blur(10px)" }, 0);
                tlHero.to("#sub-title", { y: -50, opacity: 0 }, 0);
            }
        }, containerRef);

        return () => {
            ctx.revert();
        };
    }, [currentView, hasStarted, isMuted]);

    return (
        <div ref={containerRef} className="bg-[#050505] min-h-screen text-white overflow-x-hidden selection:bg-[#E91E63] selection:text-white font-sans">
            <ParticleCanvas settingsRef={particleSettings} />

            {/* Navigation */}
            <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center mix-blend-difference">
                <div className="flex items-center gap-6">
                    <div className="font-['Anton'] text-2xl tracking-widest cursor-pointer select-none text-white" onClick={() => handleNav('INICIO')}>LR</div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Desktop Links */}
                    <div className="hidden md:flex gap-8 items-center">
                        {['INICIO', 'LA BANDA', 'HISTORIA', 'AGENDA', 'CONTACTO'].map(item => (
                            <button
                                key={item}
                                onClick={() => handleNav(item)}
                                className="font-['Montserrat'] text-[10px] font-bold tracking-[0.2em] text-white hover:text-[#D4AF37] transition-colors uppercase"
                            >
                                {item}
                            </button>
                        ))}
                    </div>

                    {/* Audio Toggle - Visible Mobile & Desktop */}
                    <button onClick={toggleSound} className="text-[10px] font-bold tracking-[0.2em] text-white/80 hover:text-[#E91E63] transition-colors uppercase flex items-center gap-2">
                        <span>{isMuted ? 'UNMUTE' : 'MUTE'}</span>
                        <span className="text-sm">{isMuted ? '🔇' : '🔊'}</span>
                    </button>

                    {/* Mobile Hamburger */}
                    <button className="md:hidden text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        <span className="font-['Montserrat'] text-[10px] font-bold tracking-widest">{isMobileMenuOpen ? 'CLOSE' : 'MENU'}</span>
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            <div className={`fixed inset-0 bg-black z-40 flex flex-col items-center justify-center gap-8 transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {['INICIO', 'LA BANDA', 'HISTORIA', 'AGENDA', 'CONTACTO'].map((item, i) => (
                    <button
                        key={item}
                        onClick={() => handleNav(item)}
                        className="font-['Anton'] text-5xl text-white hover:text-[#E91E63] transition-colors"
                        style={{ transitionDelay: `${i * 50}ms` }}
                    >
                        {item}
                    </button>
                ))}
            </div>

            <AudioController isPlaying={hasStarted} setPlaying={setHasStarted} isMuted={isMuted} />

            {/* Intro Overlay */}
            {!hasStarted && (
                <div className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center cursor-pointer" onClick={initAudioContext}>
                    <div className={`text-center transition-all duration-1000 transform ${showIntro ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <p className="font-['Montserrat'] text-[#D4AF37] text-[10px] tracking-[0.6em] mb-6 uppercase animate-pulse">Experiencia Inmersiva</p>
                        <h1 className="font-['Anton'] text-7xl md:text-9xl text-white mb-10 tracking-tighter leading-none">LOS<br />ROMÁNTICOS</h1>
                        <div className="inline-flex items-center gap-4 group">
                            <div className="h-[1px] w-12 bg-white/20 group-hover:w-20 transition-all duration-500"></div>
                            <span className="font-['Montserrat'] text-[10px] tracking-[0.4em] text-white group-hover:text-[#E91E63] transition-colors">ENTRAR</span>
                            <div className="h-[1px] w-12 bg-white/20 group-hover:w-20 transition-all duration-500"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            {hasStarted && (
                <main className="relative z-10">
                    {currentView === 'home' && (
                        <div className="animate-fade-in">
                            <section id="hero" ref={heroRef} className="h-screen flex flex-col items-center justify-center text-center px-4 relative z-20 perspective-1000">
                                <div className="md:mb-20 mix-blend-screen skew-elem transform-style-3d flex flex-col items-center">
                                    <h1 id="main-title" className="font-['Anton'] text-[15vw] leading-[0.8] uppercase tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] flex flex-col gap-4 md:gap-8">
                                        <span>LOS</span>
                                        <span className="text-[#D4AF37] mt-2 md:mt-4">ROMÁNTICOS</span>
                                    </h1>
                                    <p id="sub-title" className="font-['Dancing_Script'] text-2xl md:text-4xl text-[#E91E63] mt-12 relative inline-block">
                                        Al corazón: Nostalgia y al alma: Fiesta
                                        <span className="absolute -bottom-2 left-0 w-full h-[1px] bg-[#E91E63] scale-x-0 transition-transform duration-1000 delay-500 origin-left animate-expand"></span>
                                    </p>
                                </div>

                                <div className="absolute bottom-12 flex flex-col items-center gap-4 opacity-50 animate-bounce">
                                    <span className="text-[9px] uppercase tracking-[0.6em] text-white/60">Descubre el Viaje</span>
                                    <div className="w-[1px] h-16 bg-gradient-to-b from-[#E91E63] to-transparent"></div>
                                </div>
                            </section>

                            <div className="py-20 relative z-20 space-y-32">
                                <div className="text-center mb-20 scroll-reveal">
                                    <p className="emotion-text text-[#E91E63] font-black uppercase tracking-[0.4em] text-xs mb-4">El Concepto</p>
                                    <h2 className="emotion-text font-['Anton'] text-5xl md:text-7xl leading-tight text-white">
                                        NO ES SOLO UN SHOW. <br />
                                        ES UN <span className="text-[#D4AF37] italic">VIAJE</span>.
                                    </h2>
                                </div>

                                {/* PHOTO GRIDS */}
                                <section id="phase-yellow" className="max-w-7xl mx-auto px-6">
                                    <div className="flex flex-col items-center mb-12 scroll-reveal">
                                        <div className="bg-black border border-[#D4AF37] shadow-[0_0_15px_#D4AF37] w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6 relative z-10 animate-float">🎷</div>
                                        <h3 className="phase-title font-['Anton'] text-6xl md:text-8xl text-[#D4AF37] uppercase tracking-tighter text-center">CÓCTEL</h3>
                                        <p className="text-gray-400 mt-4 text-center max-w-lg">Jazz, instrumental y entrada en calor con unos tragos.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {[
                                            { img: "/images/polaroid/c-jazz_chill.png?auto=format&fit=crop&q=80&w=600", txt: "Jazz & Chill" },
                                            { img: "/images/polaroid/c-primeros_momentos.png?auto=format&fit=crop&q=80&w=600", txt: "Ideal para esos primeros momentos..." },
                                            { img: "/images/polaroid/c-instrumental_calidad.png?auto=format&fit=crop&q=80&w=600", txt: "Instrumental de Calidad" }
                                        ].map((item, i) => (
                                            <div key={i} className="scroll-reveal">''
                                                <div className={`polaroid-item bg-white p-3 pb-12 shadow-2xl transform ${i % 2 === 0 ? '-rotate-2' : 'rotate-2'} hover:rotate-0 transition-transform duration-500 animate-float`} style={{ animationDelay: `${i * 0.5}s` }}>
                                                    <div className="aspect-square bg-gray-200 overflow-hidden mb-4 grayscale hover:grayscale-0 transition-all duration-700">
                                                        <img src={item.img} className="w-full h-full object-cover" alt="Moment" />
                                                    </div>
                                                    <p className="font-['Dancing_Script'] text-black text-2xl text-center">{item.txt}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section id="phase-blue" className="max-w-7xl mx-auto px-6">
                                    <div className="flex flex-col items-center mb-12 scroll-reveal">
                                        <div className="bg-black border border-[#00B4D8] shadow-[0_0_15px_#00B4D8] w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6 relative z-10 animate-float">💙</div>
                                        <h3 className="phase-title font-['Anton'] text-6xl md:text-8xl text-[#00B4D8] uppercase tracking-tighter text-center">ROMÁNTICOS</h3>
                                        <p className="text-gray-400 mt-4 text-center max-w-lg">Hits rejuvenecidos para evocar nostalgia y pura emoción.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {[
                                            { img: "/images/polaroid/r-al_corazon.png?auto=format&fit=crop&q=80&w=600", txt: "Al corazón" },
                                            { img: "/images/polaroid/r-canciones_de_amor.png?auto=format&fit=crop&q=80&w=600", txt: "Canciones de amor" },
                                            { img: "/images/polaroid/r-nostalgia_y_lentos.png?auto=format&fit=crop&q=80&w=600", txt: "Nostalgia pura" },
                                        ].map((item, i) => (
                                            <div key={i} className="scroll-reveal">
                                                <div className={`polaroid-item bg-white p-3 pb-12 shadow-2xl transform ${i % 2 === 0 ? 'rotate-1' : '-rotate-1'} hover:rotate-0 transition-transform duration-500 animate-float`} style={{ animationDelay: `${i * 0.5}s` }}>
                                                    <div className="aspect-square bg-gray-200 overflow-hidden mb-4 contrast-125 sepia-[.3]">
                                                        <img src={item.img} className="w-full h-full object-cover" alt="Moment" />
                                                    </div>
                                                    <p className="font-['Dancing_Script'] text-black text-2xl text-center">{item.txt}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section id="phase-pink" className="max-w-7xl mx-auto px-6">
                                    <div className="flex flex-col items-center mb-12 scroll-reveal">
                                        <div className="bg-black border border-[#E91E63] shadow-[0_0_15px_#E91E63] w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-6 relative z-10 animate-float">🔥</div>
                                        <h3 className="phase-title font-['Anton'] text-6xl md:text-8xl text-[#E91E63] uppercase tracking-tighter text-center">FIESTA</h3>
                                        <p className="text-gray-400 mt-4 text-center max-w-lg">Caribe, baile y pogo. ¡Nadie se queda sentado!</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {[
                                            { img: "/images/polaroid/f-euforia_total.png?auto=format&fit=crop&q=80&w=600", txt: "Euforia Total" },
                                            { img: "/images/polaroid/f-canto_y_fiesta.png?auto=format&fit=crop&q=80&w=600", txt: "Canto & Fiesta" },
                                            { img: "/images/polaroid/f-hasta_el_final.png?auto=format&fit=crop&q=80&w=600", txt: "Hasta el final" }
                                        ].map((item, i) => (
                                            <div key={i} className="scroll-reveal">
                                                <div className={`polaroid-item bg-white p-3 pb-12 shadow-2xl transform ${i % 2 === 0 ? '-rotate-3' : 'rotate-3'} hover:rotate-0 transition-transform duration-500 animate-float`} style={{ animationDelay: `${i * 0.5}s` }}>
                                                    <div className="aspect-square bg-gray-200 overflow-hidden mb-4 saturate-150 contrast-125">
                                                        <img src={item.img} className="w-full h-full object-cover" alt="Moment" />
                                                    </div>
                                                    <p className="font-['Dancing_Script'] text-black text-2xl text-center">{item.txt}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            <section id="banda" ref={teamRef} className="min-h-screen relative z-20 flex flex-col justify-center bg-[#050505] py-20">
                                <div id="team-title" className="team-title-group text-center mb-8 px-6 relative z-20 flex-shrink-0 scroll-reveal">
                                    <h2 className="font-['Anton'] text-[12vw] uppercase opacity-[0.03] absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-full pointer-events-none select-none">Talento</h2>
                                    <h2 className="font-['Anton'] text-6xl md:text-8xl uppercase relative z-10">
                                        El <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#FDB931]">Equipo</span>
                                    </h2>
                                </div>
                                <div className="handwritten-phrase text-center mb-16 scroll-reveal">
                                    <p className="font-['Dancing_Script'] text-2xl md:text-4xl text-[#E91E63] transform -rotate-2">Conocé a los pilotos de emociones...</p>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 px-4 max-w-6xl mx-auto w-full">
                                    {MEMBERS.map((member, i) => (
                                        <div key={member.id} className="member-card-wrapper scroll-reveal">
                                            <MemberCard member={member} onFlip={() => !isMuted && playFlipSound()} style={{ animationDelay: `${i * 0.3}s` }} />
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <footer id="contacto" ref={footerRef} className="h-screen flex flex-col items-center justify-center relative overflow-hidden bg-transparent">

                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                                    <h1 id="footer-handwritten" className="font-['Dancing_Script'] text-6xl md:text-8xl text-[#E91E63] absolute opacity-0 z-20 text-center">
                                        Hagamos<br />Historia
                                    </h1>
                                    <h1 id="hagamos-historia-bg" className="font-['Anton'] text-[20vw] leading-none text-[#E91E63] text-center opacity-0 whitespace-nowrap origin-center z-10 select-none pointer-events-none drop-shadow-[0_0_15px_rgba(233,30,99,0.8)]">
                                        HAGAMOS<br />HISTORIA
                                    </h1>
                                </div>

                                <div id="footer-initial-content" className="relative z-50 flex flex-col items-center w-full max-w-4xl mx-auto px-4 pb-20">
                                    <div id="footer-glass-card" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col items-center w-full opacity-0">

                                        <div className="flex flex-col items-center space-y-4 mb-12 w-full">
                                            <h2 id="footer-line-1" className="font-['Anton'] text-5xl md:text-7xl uppercase leading-none tracking-tighter text-[#00B4D8] drop-shadow-2xl opacity-0">TU EVENTO</h2>
                                            <h2 id="footer-line-2" className="font-['Anton'] text-5xl md:text-7xl uppercase leading-none tracking-tighter text-[#D4AF37] drop-shadow-2xl opacity-0">MERECE</h2>
                                            <h2 id="footer-line-3" className="font-['Anton'] text-5xl md:text-7xl uppercase leading-none tracking-tighter text-white drop-shadow-2xl opacity-0">ESTE NIVEL</h2>
                                        </div>

                                        <div className="flex items-center justify-center gap-6 md:gap-12 mb-16 w-full">
                                            <div className="footer-icon-group flex flex-col items-center gap-2 opacity-0 transform-gpu">
                                                <span className="font-['Anton'] text-[#D4AF37] text-sm md:text-lg tracking-widest uppercase">MÚSICA</span>
                                                <div className="text-4xl md:text-5xl my-2 filter drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]">🎷</div>
                                                <span className="font-['Montserrat'] text-white text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase">CALIDAD</span>
                                            </div>
                                            <div className="footer-icon-group h-16 w-[1px] bg-white/20 opacity-0"></div>
                                            <div className="footer-icon-group flex flex-col items-center gap-2 opacity-0 transform-gpu">
                                                <span className="font-['Anton'] text-[#D4AF37] text-sm md:text-lg tracking-widest uppercase">CORAZÓN</span>
                                                <div className="text-4xl md:text-5xl my-2 filter drop-shadow-[0_0_15px_rgba(0,180,216,0.5)]">💙</div>
                                                <span className="font-['Montserrat'] text-white text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase">NOSTALGIA</span>
                                            </div>
                                            <div className="footer-icon-group h-16 w-[1px] bg-white/20 opacity-0"></div>
                                            <div className="footer-icon-group flex flex-col items-center gap-2 opacity-0 transform-gpu">
                                                <span className="font-['Anton'] text-[#D4AF37] text-sm md:text-lg tracking-widest uppercase">ALMA</span>
                                                <div className="text-4xl md:text-5xl my-2 filter drop-shadow-[0_0_15px_rgba(233,30,99,0.5)]">🥳</div>
                                                <span className="font-['Montserrat'] text-white text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase">FIESTA</span>
                                            </div>
                                        </div>

                                        <div id="footer-cta" className="opacity-0 pointer-events-auto animate-float">
                                            <button
                                                ref={waButtonRef}
                                                onClick={() => window.open('https://wa.link/4de2yk', '_blank')}
                                                className="group relative border border-[#D4AF37] backdrop-blur-sm bg-black/30 py-4 px-12 md:px-16 overflow-hidden transition-all duration-500 hover:border-[#E91E63]"
                                            >
                                                <div className="absolute inset-0 bg-[#D4AF37] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out"></div>
                                                <span className="relative z-10 flex items-center justify-center gap-4">
                                                    <span className="font-['Montserrat'] text-[#D4AF37] group-hover:text-black font-bold uppercase tracking-[0.3em] text-xs transition-colors duration-500">Contactar por WhatsApp</span>
                                                    <span className="text-lg group-hover:text-black transition-colors duration-500">→</span>
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[120%] h-[60vh] bg-gradient-to-t from-[#E91E63]/20 to-transparent blur-[120px] pointer-events-none z-0"></div>

                                {/* PREMIUM FOOTER BAR - REFACTORED */}
                                <div className="absolute bottom-0 left-0 w-full z-20 bg-gradient-to-t from-black via-black/90 to-transparent pb-6 pt-12">
                                    <div className="max-w-7xl mx-auto px-6 flex flex-row items-center justify-center gap-4 md:gap-8">

                                        <a href="https://www.instagram.com/losromanticos.oficial/" className="group">
                                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/70 group-hover:text-[#D4AF37] transition-colors font-['Montserrat']">Instagram</span>
                                        </a>

                                        <span className="text-[#D4AF37] text-xs">•</span>

                                        <span className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-['Montserrat'] hidden md:inline-block">© 2025 Los Románticos</span>
                                        <span className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-['Montserrat'] md:hidden">LR. '25</span>

                                        <span className="text-[#D4AF37] text-xs">•</span>

                                        <a href="mailto:losromanticosoficial@gmail.com" className="group">
                                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/70 group-hover:text-[#D4AF37] transition-colors font-['Montserrat']">Email</span>
                                        </a>

                                    </div>
                                </div>
                            </footer>
                        </div>
                    )}
                    {currentView === 'construction' && (
                        <div className="h-screen flex flex-col items-center justify-center text-center px-4 animate-fade-in relative z-20">
                            <h2 className="font-['Anton'] text-6xl md:text-8xl text-[#E91E63] mb-4">PRÓXIMAMENTE</h2>
                            <p className="font-['Dancing_Script'] text-3xl text-gray-400 mb-12">Estamos afinando los instrumentos...</p>
                            <button onClick={() => handleNav('INICIO')} className="group relative px-8 py-3 overflow-hidden border border-[#D4AF37]">
                                <div className="absolute inset-0 bg-[#D4AF37] translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                <span className="relative font-['Montserrat'] text-xs tracking-[0.3em] text-[#D4AF37] group-hover:text-black transition-colors">VOLVER AL SHOW</span>
                            </button>
                        </div>
                    )}
                </main>
            )}
        </div>
    );
};

export default App;
