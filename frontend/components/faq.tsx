"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  const faqs = [
    {
      question: "How accurate is WriteItOut's transcription?",
      answer: "WriteItOut delivers industry-leading accuracy of 99.9% for clear audio recordings. Our advanced AI models are trained on diverse datasets and continuously improved to handle various accents, background noise, and speaking styles."
    },
    {
      question: "What audio formats do you support?",
      answer: "We support all major audio and video formats including MP3, WAV, M4A, FLAC, MP4, MOV, AVI, and more. You can upload files up to 2GB in size on paid plans."
    },
    {
      question: "Can WriteItOut identify different speakers?",
      answer: "Yes! Our Professional and Business plans include advanced speaker identification that can distinguish between multiple speakers and label them accordingly in your transcript."
    },
    {
      question: "How long does transcription take?",
      answer: "Most transcriptions are completed in under 5 minutes, regardless of audio length. Processing time depends on file size and current queue, but we prioritize speed without compromising accuracy."
    },
    {
      question: "Is my data secure and private?",
      answer: "Absolutely. We use enterprise-grade encryption for all data transmission and storage. Your files are automatically deleted from our servers after processing, and we never share or use your content for training purposes."
    },
    {
      question: "Can I export my transcripts?",
      answer: "Yes! You can export your transcripts in multiple formats including TXT, DOCX, PDF, SRT (subtitles), and VTT. All plans include basic export options, with advanced formatting available on paid plans."
    },
    {
      question: "Do you offer API access?",
      answer: "API access is available with our Business plan, allowing you to integrate WriteItOut's transcription capabilities directly into your applications and workflows."
    },
    {
      question: "What languages do you support?",
      answer: "WriteItOut supports over 90 languages and dialects, including English, Spanish, French, German, Chinese, Japanese, and many more. Language detection is automatic for most supported languages."
    }
  ];

  return (
    <section id="faq" className="px-6 py-12 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about WriteItOut
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-lg font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center mt-12">
          <p className="text-gray-600">
            Still have questions?{" "}
            <a href="#" className="text-blue-600 hover:underline font-medium">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}