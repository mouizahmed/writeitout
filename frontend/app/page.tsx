import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import Features from "@/components/features";
import UseCases from "@/components/use-cases";
import Stats from "@/components/stats";
import Pricing from "@/components/pricing";
import FAQ from "@/components/faq";
import CTA from "@/components/cta";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div>
        <Hero />
        <Features />
        <UseCases />
        <Stats />
        <Pricing />
        <FAQ />
        {/* <CTA /> */}
        <Footer />
      </div>
    </div>
  );
}
