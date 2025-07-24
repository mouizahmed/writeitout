import { Button } from "@/components/ui/button";

export default function CTA() {
  return (
    <section className="px-6 py-20 bg-gradient-to-br from-blue-50 via-blue-500 to-purple-600">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-6">
          Ready to transform your video content?
        </h2>
        <p className="text-xl text-blue-100 mb-8">
          Join thousands of creators who trust WriteItOut for their transcription needs.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="secondary">
            Start free trial
          </Button>
          <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
            Contact sales
          </Button>
        </div>
      </div>
    </section>
  );
}