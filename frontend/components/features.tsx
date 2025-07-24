import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Captions, Mic, ArrowUpDown } from "lucide-react";

export default function Features() {
  return (
    <section id="features" className="px-6 py-12 bg-gradient-to-b from-pink-50 via-orange-50 to-yellow-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Everything you need for audio processing
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow bg-white/90 backdrop-blur-sm border-white/50">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Mic className="w-6 h-6 text-green-500" />
              </div>
              <CardTitle>Transcription</CardTitle>
              <CardDescription>
                Convert speech to text with speaker identification and timestamps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 font-medium">Speaker 1</span>
                  <span className="text-gray-400">00:24</span>
                </div>
                <p className="text-gray-700">Hey David, you better back up, we don&apos;t have enough tools to get up to BB.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-white/90 backdrop-blur-sm border-white/50">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Captions className="w-6 h-6 text-red-500" />
              </div>
              <CardTitle>Subtitles</CardTitle>
              <CardDescription>
                Generate perfect subtitles with timing and styling options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black rounded-lg p-4 relative">
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                    I am Groot
                  </div>
                </div>
                <div className="h-20 bg-gray-800 rounded"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow bg-white/90 backdrop-blur-sm border-white/50">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-purple-500" />
              </div>
              <CardTitle>Translation</CardTitle>
              <CardDescription>
                Translate your content into 100+ languages instantly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="outline" className="text-xs">English</Badge>
                  <span className="text-sm text-gray-600">I am Groot</span>
                </div>
                <div className="flex items-center justify-center">
                  <ArrowUpDown className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="outline" className="text-xs">Spanish</Badge>
                  <span className="text-sm text-gray-600">Yo soy Groot</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}