import Image from "next/image";

export default function Footer() {
  return (
    <footer className="px-6 py-12 bg-black text-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
         
              <Image 
                src="/logo2.svg" 
                alt="WriteItOut Logo" 
                width={50} 
                height={50}
                className="w-12 h-12 bg-white border-gray-200 rounded-xl"
              />
       
              <span className="font-bold text-white">WriteItOut</span>
            </div>
            <p className="text-sm">AI-powered transcription, subtitles, and translation for everyone.</p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3">Product</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="#use-cases" className="hover:text-white">Use Cases</a></li>
              <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              <li><a href="#faq" className="hover:text-white">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Contact</a></li>
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-sm">
          <p>&copy; 2025 WriteItOut. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}