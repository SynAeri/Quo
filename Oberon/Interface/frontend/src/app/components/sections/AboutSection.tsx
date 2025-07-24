export default function AboutSection() {
  return (
    <section className="relative py-20 text-white">
      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-6">About Quo</h2>
        <p className="text-lg text-gray-600 leading-relaxed">
          Quo uses AI-powered financial analysis to help you save better, securely connecting to your bank through Basiq.
        </p>
        
        {/* Feature grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Smart Analysis</h3>
            <p className="text-gray-600">AI-powered insights into your spending patterns</p>
          </div>
          <div className="p-6">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold mb-2">Bank-Level Security</h3>
            <p className="text-gray-600">Your data is encrypted and never shared</p>
          </div>
          <div className="p-6">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
            <p className="text-gray-600">Monitor your financial health over time</p>
          </div>
        </div>
      </div>
    </section>
  );
}
