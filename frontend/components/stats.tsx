export default function Stats() {
  return (
    <section className="px-6 py-12 bg-gradient-to-b from-red-50 via-pink-50 to-purple-50">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-12">
          Built for performance and accuracy
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="text-3xl font-bold text-purple-600 mb-2">100+</div>
            <div className="text-gray-600">Languages supported</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600 mb-2">99.9%</div>
            <div className="text-gray-600">Accuracy rate</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600 mb-2">50%</div>
            <div className="text-gray-600">Cost savings</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600 mb-2">10x</div>
            <div className="text-gray-600">Faster processing</div>
          </div>
        </div>
      </div>
    </section>
  );
}