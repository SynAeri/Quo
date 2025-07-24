// ===== app/components/sections/HeroSection.tsx =====
'use client';

import { useState } from 'react';
import Typewriter from 'typewriter-effect';
import ButtonMain from '../ui/ButtonMain';
import LoginSignupModal from '../../basiqComponents/modal';

export default function HeroSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="py-8 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="min-h-[calc(100vh-200px)] flex flex-col justify-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-8">Quo</h1>
          
          <div className="text-2xl mb-12">
            <Typewriter
              options={{
                strings: "Attempt at saving better",
                autoStart: true,
                delay: 50,
              }}
            />
          </div>
          
          <ButtonMain onClick={() => setIsModalOpen(true)}>
            Sign Up
          </ButtonMain>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon="🔒"
              title="Secure"
              description="Bank-level encryption via Basiq"
            />
            <FeatureCard 
              icon="⚡"
              title="Fast"
              description="Connect in under 2 minutes"
            />
            <FeatureCard 
              icon="📊"
              title="Insights"
              description="AI-powered financial analysis"
            />
          </div>
        </div>
      </div>
      
      <LoginSignupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
