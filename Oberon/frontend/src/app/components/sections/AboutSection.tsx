// app/components/sections/AboutSection.tsx
import { Shield, Brain, TrendingUp } from 'lucide-react';

export default function AboutSection() {
  return (
    <section className="relative py-20 text-white">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Your AI Financial Assistant
          </h2>
          <p className="text-xl text-gray-400 leading-relaxed max-w-3xl mx-auto">
            Quo uses advanced AI to analyze your spending patterns, identify savings opportunities, 
            and help you make smarter financial decisions — all while keeping your data secure.
          </p>
        </div>
        
        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="text-center group">
            <div className="w-20 h-20 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600/30 transition-colors">
              <Brain className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">AI-Powered Analysis</h3>
            <p className="text-gray-400">
              Our algorithms analyze thousands of data points to provide personalized insights unique to your financial behavior
            </p>
          </div>

          
          <div className="text-center group">
            <div className="w-20 h-20 bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-600/30 transition-colors">
              <TrendingUp className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Real Results</h3>
            <p className="text-gray-400">
             Analyzes your personal banking data so you don't have to! 
            </p>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-20 pt-12 border-t border-gray-800">
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏦</span>
              <span>Connected to 150+ banks</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
