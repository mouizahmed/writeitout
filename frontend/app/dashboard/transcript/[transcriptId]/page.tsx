"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Download, Share2, Edit, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { AudioPlayer } from "@/components/transcript/audio-player";
import { TranscriptViewer } from "@/components/transcript/transcript-viewer";

// Dummy transcript data matching the Elon Musk video
const DUMMY_TRANSCRIPT_DATA = {
  id: "transcript-1",
  title: "Elon Musk: How to Build the Future",
  videoUrl: "/demo.mp4",
  duration: 348, // 5:48 minutes in seconds
  segments: [
    {
      id: "1",
      start: 0,
      end: 15,
      speaker: "Interviewer",
      text: "Welcome everyone to Y Combinator. Today we have Elon Musk with us. Elon, thanks for being here to talk about building the future."
    },
    {
      id: "2", 
      start: 15,
      end: 28,
      speaker: "Elon Musk",
      text: "Thanks for having me. It's great to be here to discuss entrepreneurship and innovation with the Y Combinator community."
    },
    {
      id: "3",
      start: 28,
      end: 45,
      speaker: "Interviewer", 
      text: "Let's start with SpaceX. What drove you to start a rocket company when you had no prior experience in aerospace?"
    },
    {
      id: "4",
      start: 45,
      end: 72,
      speaker: "Elon Musk",
      text: "I've always been fascinated by space exploration. When I looked at rocket costs, I realized they were way more expensive than necessary. Most cost is in materials and manufacturing, not fuel. So I thought, why not make rockets reusable?"
    },
    {
      id: "5",
      start: 72,
      end: 88,
      speaker: "Interviewer",
      text: "That seems incredibly risky. How did you convince investors and engineers to join such an ambitious venture?"
    },
    {
      id: "6",
      start: 88,
      end: 115,
      speaker: "Elon Musk", 
      text: "It was definitely challenging. Many thought we were crazy. But if you have a compelling vision and can show the physics works, you can attract amazing talent. We started small with passionate engineers."
    },
    {
      id: "7",
      start: 115,
      end: 132,
      speaker: "Interviewer",
      text: "Speaking of talent, what advice do you have for entrepreneurs when it comes to hiring and building teams?"
    },
    {
      id: "8",
      start: 132,
      end: 158,
      speaker: "Elon Musk",
      text: "Hire people better than you at what they do. Look for mission-driven people, not just paychecks. Work alongside them - don't just delegate and disappear. Lead by example."
    },
    {
      id: "9",
      start: 158,
      end: 175,
      speaker: "Interviewer",
      text: "You've started multiple companies - PayPal, Tesla, SpaceX, Neuralink. How do you manage your time across these ventures?"
    },
    {
      id: "10",
      start: 175,
      end: 198,
      speaker: "Elon Musk",
      text: "Time management is critical. I batch similar activities and focus on highest impact problems. I eliminate unnecessary meetings and spend maximum time on engineering and design."
    },
    {
      id: "11",
      start: 198,
      end: 215,
      speaker: "Interviewer",
      text: "What's your perspective on artificial intelligence? There's been much discussion about opportunities and risks."
    },
    {
      id: "12",
      start: 215,
      end: 245,
      speaker: "Elon Musk",
      text: "AI is perhaps our most important technology. It has tremendous potential to solve problems, but we must be careful. That's why I co-founded OpenAI and started Neuralink - to ensure AI benefits humanity."
    },
    {
      id: "13",
      start: 245,
      end: 262,
      speaker: "Interviewer",
      text: "For young entrepreneurs watching, what's the most important piece of advice you'd give them?"
    },
    {
      id: "14",
      start: 262,
      end: 295,
      speaker: "Elon Musk",
      text: "Don't be afraid to think big and take risks. The biggest risk is taking no risk. Start with problems you're passionate about solving. Don't worry if others think it's impossible - the best opportunities often seem impossible at first."
    },
    {
      id: "15",
      start: 295,
      end: 320,
      speaker: "Interviewer",
      text: "Any final thoughts for aspiring entrepreneurs and innovators in our audience today?"
    },
    {
      id: "16",
      start: 320,
      end: 348,
      speaker: "Elon Musk",
      text: "Focus on creating value for others. Work on things that matter. Be persistent - most overnight successes take years. And remember, the future depends on what we build today. Keep building the future, everyone."
    }
  ]
};

export default function TranscriptPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const params = useParams();
  const transcriptId = params.transcriptId as string;
  
  const [currentTime, setCurrentTime] = useState(0);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  // Find active segment based on current time
  useEffect(() => {
    const activeSegment = DUMMY_TRANSCRIPT_DATA.segments.find(
      segment => currentTime >= segment.start && currentTime < segment.end
    );
    setActiveSegmentId(activeSegment?.id || null);
  }, [currentTime]);

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/login');
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (isLoaded && !isSignedIn) {
    return null;
  }

  const handleSeekToTime = (time: number) => {
    setCurrentTime(time);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 h-screen">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
          <SidebarTrigger className="shrink-0" />
          
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Back to Dashboard</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-sm font-medium truncate">{DUMMY_TRANSCRIPT_DATA.title}</h1>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 relative">
        {/* Transcript Section - Full Width */}
        <div className="flex-1 flex flex-col">
          <TranscriptViewer
            segments={DUMMY_TRANSCRIPT_DATA.segments}
            activeSegmentId={activeSegmentId}
            onSegmentClick={handleSeekToTime}
          />
        </div>

        {/* Mini Video Player - Bottom Right */}
        <div className="fixed bottom-6 right-6 w-80 h-48 bg-black rounded-lg shadow-2xl border border-border z-50 overflow-hidden">
          <AudioPlayer
            videoUrl={DUMMY_TRANSCRIPT_DATA.videoUrl}
            duration={DUMMY_TRANSCRIPT_DATA.duration}
            onTimeUpdate={setCurrentTime}
            seekTime={currentTime}
            isMiniplayer={true}
          />
        </div>
      </main>
    </div>
  );
}