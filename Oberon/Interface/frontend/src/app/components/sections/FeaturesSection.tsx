// app/components/sections/FeaturesSection.tsx
import { BarChart3, PiggyBank, TrendingUp, Shield, Zap, Users } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Smart Spending Analysis",
      description: "AI categorizes and analyzes your spending patterns to identify areas for improvement",
      color: "text-blue-600"
    },
    {
      icon: <PiggyBank className="w-8 h-8" />,
      title: "Personalized Savings Tips",
      description: "Get actionable recommendations based on your unique financial behavior",
      color: "text-green-600"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Predictive Insights",
      description: "Forecast future spending and receive alerts before you exceed your budget",
      color: "text-purple-600"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secured data",
      description: "Your data is encrypted and secured with continuously improved upon security practices",
      color: "text-red-600"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Real-Time Sync",
      description: "Instant updates from your bank accounts for always-current insights",
      color: "text-yellow-600"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Multi-Account Support",
      description: "Connect all your accounts for a complete financial picture",
      color: "text-indigo-600"
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything you need to master your money
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Quo uses AI techniques to provide insight on your general banking. 
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`mb-4 ${feature.color}`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <p className="text-lg text-gray-600 mb-6">
            Interested in trying?
          </p>
          <a 
            href="/signup" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try for free 
            <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
