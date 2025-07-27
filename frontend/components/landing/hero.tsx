import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Upload, Link } from "lucide-react";

export default function Hero() {
  return (
    <section className="px-6 pt-40 text-center bg-gradient-to-b from-amber-50/50 via-yellow-50/30 to-amber-50/40">
      <div className="max-w-4xl mx-auto">
        <Badge className="mb-6 bg-amber-100 text-amber-800 hover:bg-amber-200">
          ✨ AI-Powered Transcription Service
        </Badge>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Transform any video into
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"> perfect text</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Upload files or paste any video link from the internet. Get accurate transcriptions, subtitles, and translations from YouTube, Vimeo, or any video URL.
          Faster and more affordable than the competition.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-3 sm:px-6 py-2 rounded-lg transition-colors shadow-md text-sm">
            <Upload className="mr-2 h-5 w-5" />
            Upload File
          </Button>
          <Button variant="outline" size="lg" className="border-amber-200 text-amber-700 hover:bg-amber-50">
            <Link className="mr-2 h-5 w-5" />
            Paste Video Link
          </Button>
        </div>
        <div className="text-sm text-gray-500">
          Supports YouTube, Vimeo, TikTok, and any public video URL
        </div>
      </div>
    </section>
  );
}