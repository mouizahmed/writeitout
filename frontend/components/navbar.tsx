import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 p-4">
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl mx-auto max-w-7xl">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <Image 
                src="/logo2.svg" 
                alt="WriteItOut Logo" 
                width={50} 
                height={50}
                className="w-12 h-12 border border-gray-200 rounded-xl"
              />
              <span className="text-2xl font-bold text-gray-900 tracking-tight font-serif hidden md:flex">WriteItOut</span>
            </Link>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden lg:flex items-center space-x-8">
              {/* Features */}
              <a href="#features" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                Features
              </a>

              {/* Use cases */}
              <a href="#use-cases" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                Use cases
              </a>

              {/* FAQ */}
              <a href="#faq" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                FAQ
              </a>
            </div>

            {/* Mobile & Desktop Right side */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Log in - Always visible beside Try for free */}
              <Link href="/login" className="text-gray-700 hover:text-gray-900 font-medium transition-colors text-sm">
                Log in
              </Link>

              {/* Try for free button - Always visible */}
              <Link href="/signup">
                <Button 
                  className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-3 sm:px-6 py-2 rounded-lg transition-colors shadow-md text-sm"
                >
                  Try for free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}