"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import * as THREE from "three";
import Lenis from "lenis";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const splitChars = (text: string, className = "") =>
  text.split("").map((char, i) => (
    <span key={i} className={`inline-block ${className}`} style={{ opacity: 0, transform: "translateY(100%)" }}>
      {char === " " ? "\u00A0" : char}
    </span>
  ));

const splitWords = (text: string, className = "") =>
  text.split(" ").map((word, i) => (
    <span key={i} className={`inline-block mr-[1.5vw] overflow-hidden leading-[1.1] pb-2`}>
      <span className={`inline-block ${className}`} style={{ transform: "translateY(100%) rotateX(-45deg)", opacity: 0 }}>
        {word}
      </span>
    </span>
  ));

export default function BEAPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroCanvasRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorLabelRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });

  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. BUTTERY SMOOTH SCROLLING (Tuned for maximum fluidity)
    const lenis = new Lenis({
      lerp: 0.05, 
      smoothWheel: true,
      wheelMultiplier: 1.1,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // 2. PREMIUM CUSTOM CURSOR & MOUSE TRACKING
    const cursor = cursorRef.current;
    const cursorLabel = cursorLabelRef.current;
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.15, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.15, ease: "power3" });

    window.addEventListener("mousemove", (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
      // Normalized coordinates for Three.js parallax
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    const magnetics = document.querySelectorAll(".magnetic");
    magnetics.forEach((elem) => {
      const el = elem as HTMLElement;
      const inner = el.querySelector(".magnetic-inner") as HTMLElement;
      
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        gsap.to(el, { x: x * 0.3, y: y * 0.3, duration: 0.4, ease: "power2.out", overwrite: "auto" });
        if(inner) gsap.to(inner, { x: x * 0.15, y: y * 0.15, duration: 0.4, ease: "power2.out", overwrite: "auto" });
        gsap.to(cursor, { scale: 0, opacity: 0, duration: 0.2, overwrite: "auto" }); 
      });
      el.addEventListener("mouseleave", () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.3)", overwrite: "auto" });
        if(inner) gsap.to(inner, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.3)", overwrite: "auto" });
        gsap.to(cursor, { scale: 1, opacity: 1, duration: 0.2, overwrite: "auto" });
      });
    });

    const interactiveHover = document.querySelectorAll(".interactive-hover");
    interactiveHover.forEach((el) => {
      el.addEventListener("mouseenter", () => {
        gsap.to(cursor, { scale: 5, mixBlendMode: "normal", backgroundColor: "#FF3300", duration: 0.3 });
        if(cursorLabel) cursorLabel.innerHTML = el.getAttribute("data-cursor") || "";
      });
      el.addEventListener("mouseleave", () => {
        gsap.to(cursor, { scale: 1, mixBlendMode: "difference", backgroundColor: "#FFFFFF", duration: 0.3 });
        if(cursorLabel) cursorLabel.innerHTML = "";
      });
    });

    // 3. THREE.JS HERO SCENE (Interactive Parallax Ring)
    const heroScene = new THREE.Scene();
    const heroCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const heroRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    if (heroCanvasRef.current) {
      heroRenderer.setSize(window.innerWidth, window.innerHeight);
      heroCanvasRef.current.appendChild(heroRenderer.domElement);
    }

    const ringGeo = new THREE.TorusGeometry(12, 0.6, 128, 200);
    const ringMat = new THREE.MeshPhysicalMaterial({
      color: 0x111111, metalness: 1.0, roughness: 0.2, clearcoat: 1.0, clearcoatRoughness: 0.1,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.z = -10;
    heroScene.add(ringMesh);
    
    heroScene.add(new THREE.AmbientLight(0xffffff, 0.2));
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 4);
    directionalLight1.position.set(10, 20, 15);
    heroScene.add(directionalLight1);
    const directionalLight2 = new THREE.DirectionalLight(0xFF3300, 6);
    directionalLight2.position.set(-15, -20, -15);
    heroScene.add(directionalLight2);
    
    heroCamera.position.z = 15;

    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      
      ringMesh.rotation.z = elapsedTime * 0.05;
      ringMesh.position.y = Math.sin(elapsedTime * 1.5) * 0.5;

      const targetRotationX = (Math.PI / 3) + (mousePos.current.y * 0.2);
      const targetRotationY = (Math.PI / 6) + (mousePos.current.x * 0.2);
      
      ringMesh.rotation.x += (targetRotationX - ringMesh.rotation.x) * 0.05;
      ringMesh.rotation.y += (targetRotationY - ringMesh.rotation.y) * 0.05;
      
      heroRenderer.render(heroScene, heroCamera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    // 4. GSAP MASTER TIMELINE & TRIGGERS
    let ctx = gsap.context(() => {
      
      const tlLoad = gsap.timeline();
      tlLoad
        .to(".transition-slice", { height: 0, duration: 1.2, ease: "power4.inOut", stagger: 0.08 })
        .fromTo("nav", { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out" }, "-=0.8")
        .fromTo(".hero-char", { opacity: 0, y: 150, rotationZ: 5 }, { opacity: 1, y: 0, rotationZ: 0, stagger: 0.03, duration: 1.4, ease: "power4.out" }, "-=1.2")
        .fromTo(".hero-sub", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }, "-=1.2")
        .set(".transition-wrap", { display: "none" });

      // Scale the ring violently as we scroll down
      gsap.to(ringMesh.scale, {
        x: 6, y: 6, z: 6,
        scrollTrigger: { trigger: "#problem-section", start: "top bottom", end: "top top", scrub: 1.5 }
      });

      // THE FLAWLESS CONTINUOUS THEME SHIFTING ENGINE
      ScrollTrigger.refresh();

      const themeWrap = document.querySelector(".theme-wrapper") as HTMLElement;
      const sections = gsap.utils.toArray("[data-bg]");

      sections.forEach((sec: any) => {
        const bg = sec.getAttribute("data-bg");
        const color = sec.getAttribute("data-text");
        
        ScrollTrigger.create({
          trigger: sec,
          start: "top 55%", 
          end: "bottom 55%",
          onEnter: () => gsap.to(themeWrap, { backgroundColor: bg, color: color, duration: 0.35, overwrite: "auto" }),
          onEnterBack: () => gsap.to(themeWrap, { backgroundColor: bg, color: color, duration: 0.35, overwrite: "auto" }),
        });
      });

      // Absolute fallback to return to black at the very top
      ScrollTrigger.create({
        trigger: "#problem-section",
        start: "top 60%",
        onLeaveBack: () => gsap.to(themeWrap, { backgroundColor: "#050505", color: "#FFFFFF", duration: 0.35, overwrite: "auto" })
      });

      // "WE HACKED IT" CINEMATIC PIN
      const quoteTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#quote-section",
          start: "top top",
          end: "+=200%",
          scrub: 1.5,
          pin: true,
        }
      });
      
      quoteTl
        .fromTo(".hack-line-1", { opacity: 0, y: 150 }, { opacity: 1, y: 0, duration: 1, ease: "power3.out" })
        .fromTo(".hack-line-2", { opacity: 0, y: 150 }, { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, "-=0.7")
        .to({}, { duration: 0.5 })
        .to([".hack-line-1", ".hack-line-2"], { scale: 0.4, opacity: 0, duration: 0.8, ease: "power4.in" })
        .fromTo(".hack-line-3", { scale: 6, opacity: 0, rotationX: 45 }, { scale: 1, opacity: 1, rotationX: 0, duration: 1.5, ease: "expo.out" }, "+=0.1");

      // ETHOS TEXT REVEAL
      gsap.to(".ethos-word", {
        opacity: 1, y: 0, rotationX: 0,
        stagger: 0.05,
        scrollTrigger: { trigger: "#ethos-section", start: "top 75%", end: "bottom 60%", scrub: 1.2 }
      });

      // GENESIS HORIZONTAL SCROLL
      const genesisPanels = gsap.utils.toArray(".genesis-panel");
      gsap.to(genesisPanels, {
        xPercent: -100 * (genesisPanels.length - 1),
        ease: "none",
        scrollTrigger: {
          trigger: "#genesis-section",
          pin: true,
          scrub: 1.5,
          end: () => "+=" + (document.querySelector("#genesis-section") as HTMLElement).offsetWidth * 2
        }
      });

      // STORY TEXT MASK REVEAL
      gsap.utils.toArray<HTMLElement>(".story-reveal").forEach((line) => {
        gsap.fromTo(line, 
          { y: "100%", opacity: 0 }, 
          { y: "0%", opacity: 1, duration: 1.2, ease: "power4.out", scrollTrigger: { trigger: line, start: "top 85%" } }
        );
      });

      // BENTO GRID ENTRANCE
      gsap.fromTo(".bento-card",
        { y: 100, scale: 0.95, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, stagger: 0.1, duration: 1.2, ease: "power4.out", scrollTrigger: { trigger: "#bento-section", start: "top 75%" } }
      );

      // STORE ROWS REVEAL
      gsap.fromTo(".store-row", 
        { opacity: 0, x: -50 },
        { opacity: 1, x: 0, stagger: 0.1, duration: 1, ease: "power3.out", scrollTrigger: { trigger: "#stores-section", start: "top 75%" } }
      );

      // PARALLAX ELEMENTS
      gsap.utils.toArray<HTMLElement>(".parallax-item").forEach((layer) => {
        const speed = layer.getAttribute("data-speed") || "1";
        gsap.to(layer, {
          y: () => -(window.innerHeight * parseFloat(speed)),
          ease: "none",
          scrollTrigger: { trigger: layer, start: "top bottom", end: "bottom top", scrub: 1.2 }
        });
      });

      // HORIZONTAL DRAW LINES
      gsap.utils.toArray<HTMLElement>(".draw-line").forEach((line) => {
        gsap.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 1.5, ease: "expo.inOut", scrollTrigger: { trigger: line } });
      });

    }, containerRef);

    const handleResize = () => {
      heroCamera.aspect = window.innerWidth / window.innerHeight;
      heroCamera.updateProjectionMatrix();
      heroRenderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", () => {});
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
      ctx.revert();
      heroRenderer.dispose();
    };
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      gsap.fromTo(formRef.current, { x: -15 }, { x: 15, duration: 0.08, yoyo: true, repeat: 5, onComplete: () => gsap.set(formRef.current, { x: 0 }) });
      return;
    }
    setIsSubmitted(true);
  };

  return (
    <div ref={containerRef} className="theme-wrapper min-h-screen overflow-hidden selection:bg-[#FF3300] selection:text-white" style={{ backgroundColor: "#050505", color: "#FFFFFF", transition: "background-color 0.8s cubic-bezier(0.83, 0, 0.17, 1), color 0.8s cubic-bezier(0.83, 0, 0.17, 1)" }}>
      
      {/* PREMIUM TYPOGRAPHY */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Manrope:wght@400;500;600&display=swap');

        body { margin: 0; cursor: none; }
        
        h1, h2, h3, h4, .font-heading { 
          font-family: 'Clash Display', sans-serif; 
          text-transform: uppercase;
        }

        .font-brutal {
          font-family: 'Bebas Neue', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        
        p, span, input, button, .font-body { 
          font-family: 'Manrope', sans-serif; 
        }

        /* Fluid Hover Marquee for Links */
        .hover-marquee {
          display: inline-flex;
          flex-direction: column;
          overflow: hidden;
          height: 1.2em;
        }
        .hover-marquee span {
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .group:hover .hover-marquee span {
          transform: translateY(-100%);
        }

        .custom-cursor {
          position: fixed; top: 0; left: 0; width: 14px; height: 14px; border-radius: 50%;
          background: #FFFFFF; pointer-events: none; z-index: 10000;
          transform: translate(-50%, -50%); transition: width 0.3s, height 0.3s, background-color 0.3s;
          mix-blend-mode: difference; display: flex; align-items: center; justify-content: center;
          font-family: 'Clash Display', sans-serif; font-size: 10px; font-weight: 700; color: white; letter-spacing: 1px;
        }

        .draw-line {
          height: 1.5px; width: 100%;
          background: currentColor; opacity: 0.2;
          transform-origin: left;
        }

        /* Hoverable Bento Cards with inner scale */
        .bento-card {
          border: 1px solid rgba(150, 150, 150, 0.15);
          border-radius: 16px;
          padding: 3rem;
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.5s, background-color 0.5s, color 0.5s;
          overflow: hidden;
        }
        .bento-inner {
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .bento-card:hover {
          transform: scale(0.98);
          border-color: currentColor;
        }
        .bento-card:hover .bento-inner {
          transform: scale(1.05);
        }
        
        .text-outline {
          color: transparent;
          -webkit-text-stroke: 1.5px currentColor;
        }

        iframe { background: transparent; pointer-events: auto; }

        .store-row {
          border-bottom: 1px solid rgba(150, 150, 150, 0.2);
        }
        .store-row:first-child {
          border-top: 1px solid rgba(150, 150, 150, 0.2);
        }
      `}} />

      <div ref={cursorRef} className="custom-cursor hidden md:flex">
        <span ref={cursorLabelRef}></span>
      </div>

      {/* TOP NAVIGATION BAR */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 py-6 mix-blend-difference text-white pointer-events-none">
        
        {/* NEW CUSTOM CRAZY SVG LOGO (Architectural "B" with HUD features) */}
        <div className="flex items-center gap-4">
          <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="group overflow-visible">
            {/* Background HUD circle */}
            <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" />
            <circle cx="50" cy="50" r="42" stroke="#FF3300" strokeWidth="2" strokeLinecap="round" className="hud-spin" />
            
            {/* Targeting Brackets */}
            <path d="M 30 10 L 20 10 L 20 20" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M 70 10 L 80 10 L 80 20" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M 30 90 L 20 90 L 20 80" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M 70 90 L 80 90 L 80 80" stroke="currentColor" strokeWidth="2" fill="none" />

            {/* The 'B' Shape (Modular) */}
            <path d="M 35 25 L 35 75" stroke="currentColor" strokeWidth="6" strokeLinecap="square" />
            <path d="M 35 25 H 55 L 65 35 V 45 L 55 50 H 35" stroke="currentColor" strokeWidth="6" strokeLinejoin="miter" fill="none" />
            <path d="M 35 50 H 60 L 70 60 V 70 L 60 75 H 35" stroke="currentColor" strokeWidth="6" strokeLinejoin="miter" fill="none" />
            
            {/* Animated Internal Data Flow Line */}
            <path d="M 35 25 H 55 L 65 35 V 45 L 55 50 H 60 L 70 60 V 70 L 60 75 H 35" stroke="#FF3300" strokeWidth="2" fill="none" className="data-flow" />

            {/* Magnetic Snaps / Nodes */}
            <circle cx="35" cy="50" r="4" fill="#FF3300" className="animate-pulse" />
            <rect x="62" y="37" width="6" height="6" fill="currentColor" />
            <rect x="67" y="62" width="6" height="6" fill="currentColor" />

            <style>{`
              .hud-spin {
                stroke-dasharray: 40 224;
                transform-origin: 50px 50px;
                animation: spin 4s linear infinite;
              }
              .data-flow {
                stroke-dasharray: 20 150;
                animation: flow 2s linear infinite;
              }
              @keyframes spin {
                100% { transform: rotate(360deg); }
              }
              @keyframes flow {
                0% { stroke-dashoffset: 170; }
                100% { stroke-dashoffset: 0; }
              }
            `}</style>
          </svg>
          <div className="font-heading text-xl md:text-3xl font-bold tracking-widest mt-1">BAG 'EM ALL</div>
        </div>

      </nav>

      {/* STAGGERED PAGE LOAD OVERLAY */}
      <div className="transition-wrap fixed inset-0 z-[9999] flex pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="transition-slice h-full w-1/6 bg-[#FF3300] origin-bottom"></div>
        ))}
      </div>

      {/* 1. HERO SECTION */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,_rgba(255,51,0,0.18)_0%,_rgba(5,5,5,1)_80%)]">
        
        {/* 3D Canvas Background */}
        <div ref={heroCanvasRef} className="absolute inset-0 z-0 pointer-events-none opacity-90" />
        
        <div className="relative z-10 flex flex-col items-center text-center px-6 pointer-events-none">
          <h1 className="font-heading text-[12vw] md:text-[11rem] font-bold leading-[0.85] tracking-tight flex flex-col items-center drop-shadow-2xl">
            <span className="overflow-hidden pb-4 block">{splitChars("ONE BAG.", "hero-char")}</span>
            <span className="overflow-hidden block">{splitChars("EVERY DAY.", "hero-char text-[#FF3300]")}</span>
          </h1>
          <p className="hero-sub font-body text-lg md:text-2xl mt-12 max-w-2xl opacity-70 font-medium">
            The ultimate modular tech-wear ecosystem.
          </p>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-50 interactive-hover pointer-events-auto" data-cursor="SCROLL">
           <div className="w-[1px] h-16 bg-white overflow-hidden">
              <div className="w-full h-full bg-[#FF3300] animate-[slideDown_2s_ease-in-out_infinite]"></div>
           </div>
           <span className="font-body text-xs tracking-[0.3em] uppercase">Initiate Sequence</span>
        </div>
      </section>

      {/* 2. PROBLEM SECTION (WHITE THEME) */}
      <section id="problem-section" data-bg="#FFFFFF" data-text="#000000" className="py-40 px-6 md:px-12 flex flex-col items-center justify-center min-h-screen relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-brutal text-7xl md:text-[9rem] font-bold leading-[0.85] tracking-tight mb-12 parallax-item" data-speed="0.1">
            YOU ARE CARRYING <br/> TOO MUCH.
          </h2>
          <div className="font-brutal text-5xl md:text-7xl text-outline opacity-30 mb-12 parallax-item" data-speed="0.05">
            LAPTOP BAGS. GYM DUFFELS. CAMERA CUBES.
          </div>
          <div className="draw-line mx-auto max-w-md my-16"></div>
          <p className="font-body text-2xl md:text-4xl max-w-4xl mx-auto opacity-90 font-medium leading-tight">
            We stripped away the clutter. A single, unified chassis that adapts instantly via magnetic payloads.
          </p>
        </div>
      </section>

      {/* 3. THE "HACKED" CINEMATIC PIN (ORANGE THEME) */}
      <section id="quote-section" data-bg="#FF3300" data-text="#000000" className="h-[200vh] w-full relative z-10">
        <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden px-6">
          <div className="hack-line-1 font-heading text-[7vw] md:text-[5vw] font-bold leading-[1.1] tracking-tight w-full text-center">
            WE DIDN'T REINVENT
          </div>
          <div className="hack-line-2 font-heading text-[7vw] md:text-[5vw] font-bold leading-[1.1] tracking-tight w-full text-center text-outline">
            THE BAG.
          </div>
          <div className="hack-line-3 font-brutal text-[22vw] md:text-[18vw] leading-[0.8] tracking-tight mt-6 w-full text-center text-black absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            WE HACKED IT.
          </div>
        </div>
      </section>

      {/* 4. ETHOS (LIGHT GREY THEME) */}
      <section id="ethos-section" data-bg="#F4F4F4" data-text="#000000" className="py-40 px-6 md:px-12 max-w-[1400px] mx-auto min-h-[60vh] flex items-center">
        <div className="max-w-5xl">
          <span className="font-body text-xs tracking-[0.3em] text-[#FF3300] uppercase mb-12 block font-bold">The Ethos</span>
          <h2 className="font-heading text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight flex flex-wrap">
            {splitWords("We exist at the intersection of aerospace engineering and daily utility.", "ethos-word")}
            {splitWords("Engineered for those who refuse to compromise.", "ethos-word text-[#FF3300]")}
          </h2>
        </div>
      </section>

      {/* 5. THE GENESIS (BLACK THEME) */}
      <section id="genesis-section" data-bg="#050505" data-text="#FFFFFF" className="h-screen w-full relative z-10 overflow-hidden">
         <div className="absolute top-12 left-6 md:left-12 font-body text-xs tracking-[0.3em] text-[#FF3300] uppercase font-bold z-20">The Genesis</div>
         
         <div className="genesis-track flex w-[400vw] h-full">
            
            <div className="genesis-panel w-screen h-full flex flex-col justify-center px-6 md:px-24">
               <h2 className="font-brutal text-[10vw] leading-[0.85] text-outline text-white/30">
                 IT STARTED WITH <br/> <span className="text-white">FOUR STUDENTS.</span>
               </h2>
               <div className="overflow-hidden pb-2 mt-12 max-w-2xl">
                 <p className="story-reveal font-body text-2xl md:text-4xl opacity-80 border-l-4 border-[#FF3300] pl-6">
                   Operating out of a cramped dorm room, we were drowning in hardware.
                 </p>
               </div>
            </div>

            <div className="genesis-panel w-screen h-full flex flex-col justify-center px-6 md:px-24">
               <h2 className="font-brutal text-[10vw] leading-[0.85]">
                 <span className="text-[#FF3300]">ZERO</span> ADAPTABILITY.
               </h2>
               <div className="overflow-hidden pb-2 mt-12 max-w-2xl">
                 <p className="story-reveal font-body text-2xl md:text-4xl opacity-80">
                   Every morning meant packing a laptop bag for lectures, a duffel for the campus gym, and a hardcase for project drones. Big brands were selling stagnant designs wrapped in different colored nylon.
                 </p>
               </div>
            </div>

            <div className="genesis-panel w-screen h-full flex flex-col justify-center px-6 md:px-24">
               <h2 className="font-brutal text-[10vw] leading-[0.85]">
                 BORN FROM <br/> <span className="text-outline">FRUSTRATION.</span>
               </h2>
               <div className="overflow-hidden pb-2 mt-12 max-w-2xl">
                 <p className="story-reveal font-body text-2xl md:text-4xl opacity-80">
                   So we stopped complaining and started building. We salvaged aerospace-grade magnetic hardware and engineered a modular chassis from the ground up.
                 </p>
               </div>
            </div>

            <div className="genesis-panel w-screen h-full flex flex-col justify-center items-center text-center px-6 md:px-24">
               <h2 className="font-heading text-5xl md:text-8xl font-bold leading-[1.1] tracking-tight">
                 THIS IS NOT A BAG. <br/> IT'S AN <span className="text-[#FF3300]">ECOSYSTEM.</span>
               </h2>
            </div>

         </div>
      </section>

      {/* 6. PRODUCT SHOWCASE (DARK SLATE THEME) */}
      <section id="product-section" data-bg="#111111" data-text="#FFFFFF" className="py-20 px-6 md:px-12 max-w-[1400px] mx-auto border-t border-white/10 pt-40">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col justify-center order-2 md:order-1">
            <span className="font-body font-bold text-[#FF3300] tracking-[0.3em] text-xs mb-8 uppercase">Architecture</span>
            <h2 className="font-brutal text-7xl md:text-[9rem] font-bold mb-12 leading-[0.85] tracking-tight">TITANIUM <br/> GRADE.</h2>
            <div className="space-y-10 font-body">
              {[
                { title: "Magnetic Docking", desc: "Attach and detach payloads blindly in 0.5 seconds." },
                { title: "Ballistic Shell", desc: "Matte polycarbonate structure that absorbs impact." },
                { title: "Anti-Gravity", desc: "Ergonomic harness distributing weight flawlessly." }
              ].map((item, i) => (
                <div key={i} className="group flex flex-col border-b border-current pb-6 cursor-pointer overflow-hidden">
                  <div className="text-3xl md:text-4xl font-heading font-bold tracking-tight flex justify-between items-center">
                    <div className="hover-marquee">
                      <span>{item.title}</span>
                      <span className="text-[#FF3300]">{item.title}</span>
                    </div>
                    <span className="text-[#FF3300] opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
                  </div>
                  <div className="opacity-60 mt-4 text-lg">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="h-[600px] md:h-[800px] w-full rounded-2xl bg-black relative overflow-hidden order-1 md:order-2 interactive-hover group border border-white/10" data-cursor="SPIN">
             <iframe 
                title="Backpack with laptop compartment" 
                frameBorder="0" 
                allowFullScreen 
                allow="autoplay; fullscreen; xr-spatial-tracking" 
                src="https://sketchfab.com/models/2a73a254a73c48b9b936894f08bbdc2c/embed?autostart=1&ui_controls=0&ui_infos=0&ui_watermark=0&transparent=1&ui_theme=dark&dnt=1"
                className="absolute inset-0 w-full h-full scale-[1.05] pointer-events-auto"
             ></iframe>
             <div className="absolute top-8 right-8 flex gap-3 items-center z-10 pointer-events-none">
                <div className="w-3 h-3 rounded-full bg-[#FF3300] animate-pulse"></div>
                <span className="font-body text-xs opacity-50 tracking-[0.2em] uppercase font-bold text-white group-hover:opacity-100 transition-opacity">Live 3D Render</span>
             </div>
             <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.8)]"></div>
          </div>
        </div>
      </section>

      {/* 7. PAYLOAD ECOSYSTEM (WHITE THEME) */}
      <section id="bento-section" data-bg="#FFFFFF" data-text="#000000" className="py-40 px-6 md:px-12 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-6">
          <h2 className="font-brutal text-7xl md:text-[10rem] leading-[0.8] tracking-tight">PAYLOAD<br/>ECOSYSTEM</h2>
          <span className="font-body opacity-50 mb-4 text-xl max-w-sm font-medium">Modules snap on seamlessly to adapt to your life.</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[350px] md:auto-rows-[400px]">
          
          <div className="bento-card md:col-span-2 group bg-[#111] text-white hover:bg-[#1A1A1A] border-white/10 relative">
            <div className="bento-inner h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="font-body text-xs border border-white/30 px-4 py-2 rounded-full uppercase tracking-[0.2em] font-bold">Module_01</span>
                <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-y-4 group-hover:translate-y-0 text-3xl font-light">&rarr;</div>
              </div>
              <div>
                <h3 className="font-heading text-5xl md:text-6xl font-bold mb-4 tracking-tight">TECH / WORK</h3>
                <p className="font-body opacity-70 max-w-lg text-lg md:text-xl">Padded 16" laptop sleeve, integrated cable routing, and hidden RFID shielding.</p>
              </div>
            </div>
          </div>
          
          <div className="bento-card group bg-white text-black hover:bg-[#FF3300] hover:text-black border-black/10">
             <div className="bento-inner h-full flex flex-col justify-between">
               <span className="font-body text-xs border border-black/30 px-4 py-2 rounded-full w-fit uppercase tracking-[0.2em] font-bold">Module_02</span>
               <h3 className="font-heading text-5xl md:text-6xl font-bold tracking-tight leading-[0.9]">GYM / ACTIVE</h3>
             </div>
          </div>

          <div className="bento-card group bg-[#111] text-white hover:bg-white hover:text-black border-white/10">
             <div className="bento-inner h-full flex flex-col justify-between">
               <span className="font-body text-xs border border-current px-4 py-2 rounded-full w-fit uppercase tracking-[0.2em] font-bold">Module_03</span>
               <h3 className="font-heading text-5xl md:text-6xl font-bold tracking-tight leading-[0.9]">PHOTO / FILM</h3>
             </div>
          </div>

          <div className="bento-card md:col-span-2 overflow-hidden relative group bg-[#111] text-white border-white/10">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#FF3300]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
             <div className="bento-inner h-full flex flex-col justify-between relative z-10">
               <span className="font-body text-xs border border-white/30 px-4 py-2 rounded-full w-fit uppercase tracking-[0.2em] font-bold">Base_Chassis</span>
               <div>
                 <h3 className="font-heading text-5xl md:text-6xl font-bold mb-4 tracking-tight">THE CORE</h3>
                 <p className="font-body opacity-70 text-lg md:text-xl">Buy the chassis once. Upgrade the payloads forever.</p>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* 8. GLOBAL OUTPOSTS (Triggers White Theme continued) */}
      <section id="stores-section" data-bg="#F4F4F4" data-text="#000000" className="py-40 px-6 md:px-12 max-w-[1400px] mx-auto">
        <span className="font-body font-bold text-[#FF3300] tracking-[0.3em] text-xs mb-8 uppercase block">Stockists</span>
        <h2 className="font-brutal text-7xl md:text-[9rem] font-bold leading-[0.8] tracking-tight mb-20">GLOBAL<br/>OUTPOSTS</h2>
        
        <div className="flex flex-col w-full font-heading">
          {[
            { city: "KALYAN", desc: "FLAGSHIP HQ" },
            { city: "MUMBAI", desc: "BANDRA WEST" },
            { city: "BENGALURU", desc: "INDIRANAGAR" },
            { city: "NEW DELHI", desc: "CONNAUGHT PLACE" }
          ].map((store, i) => (
            <div key={i} className="store-row py-8 md:py-12 flex justify-between items-center group hover:bg-[#FF3300] hover:text-black transition-colors duration-500 px-6 cursor-pointer interactive-hover" data-cursor="VISIT">
              <h3 className="text-4xl md:text-7xl font-bold tracking-tight group-hover:translate-x-6 transition-transform duration-500">{store.city}</h3>
              <span className="font-body text-sm md:text-lg font-bold tracking-[0.2em] opacity-50 group-hover:opacity-100 uppercase">{store.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 9. IMMERSIVE FOOTER & LEAD CAPTURE (Triggers Deep Black Theme) */}
      <footer data-bg="#050505" data-text="#FFFFFF" className="pt-40 pb-12 px-6 border-t border-current mt-20 relative overflow-hidden bg-[#050505] text-white">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FF3300] to-transparent opacity-50"></div>
        
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 relative z-10">
          <div className="parallax-item" data-speed="-0.05">
            <h2 className="font-heading text-6xl md:text-[7rem] font-bold mb-8 leading-[0.9] tracking-tight">ACCESS <br/> THE BETA.</h2>
            <p className="font-body text-xl md:text-2xl opacity-70 mb-16 max-w-lg leading-relaxed">Join the private network. Early adopters receive the Tech Module completely free.</p>
            
            <form ref={formRef} onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-6 relative">
              <input 
                type="email" 
                placeholder="ENTER EMAIL" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitted}
                className="flex-1 bg-transparent border-b-2 border-current py-6 font-heading font-bold text-2xl focus:outline-none focus:border-[#FF3300] transition-colors placeholder:opacity-40 rounded-none uppercase text-white"
              />
              <button 
                type="submit" 
                disabled={isSubmitted}
                className="magnetic submit-btn bg-white text-black px-12 py-6 rounded-full whitespace-nowrap transition-transform flex items-center justify-center overflow-hidden cursor-none"
              >
                <span className="magnetic-inner font-body text-lg font-bold tracking-[0.2em] uppercase mt-1">
                  {isSubmitted ? "CONFIRMED ✔" : "REQUEST INVITE"}
                </span>
              </button>
            </form>
          </div>
          
         <div className="flex flex-col justify-between items-start lg:items-end font-body parallax-item" data-speed="0.05">
  <div className="font-brutal text-[10rem] md:text-[14rem] tracking-tight leading-[0.7] mb-12 lg:mb-0 text-outline hover:text-[#FF3300] transition-colors duration-500 cursor-none group">
    <div className="hover-marquee h-[0.8em]">
      <span>BAG 'EM ALL.</span>
      <span className="text-[#FF3300] text-outline-none">BAG 'EM ALL.</span>
    </div>
  </div>
  <div className="flex gap-10 text-xs md:text-sm uppercase tracking-[0.2em] font-bold opacity-60 mt-12">
    {/* Update your Instagram Link below */}
    <a href="https://www.instagram.com/bag.em_all?igsh=ZzM1Z3I2ejFwZnQ0" target="_blank" rel="noopener noreferrer" className="group overflow-hidden">
      <div className="hover-marquee">
        <span>Instagram</span>
        <span className="text-[#FF3300]">Instagram</span>
      </div>
    </a>

    {/* Update your Youtube Link below */}
    <a href="https://www.youtube.com/@bag.em_all" target="_blank" rel="noopener noreferrer" className="group overflow-hidden">
      <div className="hover-marquee">
        <span>Youtube</span>
        <span className="text-[#FF3300]">Youtube</span>
      </div>
    </a>

    <a href="mailto:contact@bagemall.com" className="group overflow-hidden">
      <div className="hover-marquee">
        <span>Contact</span>
        <span className="text-[#FF3300]">Contact</span>
      </div>
    </a>
  </div>
</div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideDown {
          0% { transform: translateY(-100%); }
          50% { transform: translateY(0%); }
          100% { transform: translateY(100%); }
        }
      `}} />
    </div>
  );
}