import Navbar from "@/components/landing/navbar";
import Hero from "@/components/landing/hero";
import Features from "@/components/landing/features";
import UseCases from "@/components/landing/use-cases";
import Stats from "@/components/landing/stats";
import Pricing from "@/components/landing/pricing";
import FAQ from "@/components/landing/faq";
// import CTA from "@/components/landing/cta";
import Footer from "@/components/landing/footer";

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
