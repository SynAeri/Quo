'use client';

import { useEffect } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    tsParticles: any;
  }
}

const ParticlesBackground = () => {
  const initParticles = () => {
    if (typeof window !== 'undefined' && window.tsParticles) {
      const tsParticles = window.tsParticles;
      
      // Create financial network preset
      tsParticles.addPreset("financial-network", {
        fullScreen: {
          enable: false
        },
        background: {
          color: {
            value: "transparent"
          }
        },
        fpsLimit: 120,
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "grab",
            },
          },
          modes: {
            push: {
              quantity: 2,
            },
            grab: {
              distance: 200,
              links: {
                opacity: 0.8,
                color: "#3b82f6"
              }
            },
          },
        },
        particles: {
          color: {
            value: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"]
          },
          links: {
            color: {
              value: "#3b82f6"
            },
            distance: 240,
            enable: true,
            opacity: 0.3,
            width: 1.5,
          },
          move: {
            direction: "none",
            enable: true,
            outModes: {
              default: "bounce",
            },
            random: true,
            speed: 0.8,
            straight: false,
          },
          number: {
            density: {
              enable: true,
              area: 1000,
            },
            value: 40,
          },
          opacity: {
            value: 0,
            random: {
              enable: true,
              minimumValue: 0.3
            },
            animation: {
              enable: true,
              speed: 1,
              minimumValue: 0.3,
              sync: false,
            },
          },
          shape: {
            type: "circle",
          },
          size: {
            value: { min: 3, max: 8 },
            random: {
              enable: true,
              minimumValue: 3
            },
            animation: {
              enable: true,
              speed: 2,
              minimumValue: 3,
              sync: false,
            },
          },
          stroke: {
            width: 1,
            color: {
              value: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"]
            }
          }
        },
        detectRetina: true,
      });

      // Load particles with the network preset
      tsParticles.load({
        id: "tsparticles",
        options: {
          preset: "financial-network"
        }
      }).then(() => {
        console.log("Financial Network loaded successfully!");
      }).catch((error: any) => {
        console.error("Error loading particles:", error);
      });
    }
  };

  return (
    <>
      {/* Load TSParticles from CDN using Next.js Script component */}
      <Script
        src="https://cdn.jsdelivr.net/npm/@tsparticles/engine@3.0.3/tsparticles.engine.min.js"
        strategy="lazyOnload"
        onLoad={() => {
          console.log("TSParticles engine loaded");
        }}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/@tsparticles/slim@3.0.3/tsparticles.slim.bundle.min.js"
        strategy="lazyOnload"
        onLoad={initParticles}
      />
      
      {/* Particles container */}
      <div
        id="tsparticles"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
    </>
  );
};

export default ParticlesBackground;
