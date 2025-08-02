"use client"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useState } from "react";

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for trying out WriteItOut",
      features: [
        "30 minutes of transcription",
        "Basic accuracy",
        "Standard support",
        "Export to TXT, DOCX"
      ],
      buttonText: "Get started",
      buttonVariant: "outline" as const,
      popular: false
    },
    {
      name: "Professional",
      monthlyPrice: 12,
      annualPrice: 9.6, // 20% discount
      description: "For content creators and professionals",
      features: [
        "10 hours of transcription",
        "99.9% accuracy",
        "Speaker identification",
        "Priority support",
        "Export to all formats",
        "Custom vocabulary"
      ],
      buttonText: "Start free trial",
      buttonVariant: "default" as const,
      popular: true
    },
    {
      name: "Business",
      monthlyPrice: 39,
      annualPrice: 31.2, // 20% discount
      description: "For teams and businesses",
      features: [
        "Unlimited transcription",
        "99.9% accuracy",
        "Advanced speaker ID",
        "24/7 premium support",
        "API access",
        "Team collaboration",
        "Custom integrations",
        "Advanced security"
      ],
      buttonText: "Contact sales",
      buttonVariant: "outline" as const,
      popular: false
    }
  ];

  return (
    <section id="pricing" className="px-6 py-12 bg-gradient-to-b from-amber-50/30 via-yellow-50/20 to-amber-50/25">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Choose the plan that&apos;s right for you. Upgrade or downgrade at any time.
          </p>
          
          {/* Pricing Toggle */}
          <div className="flex items-center justify-center mb-8">
            <span className={`mr-3 ${!isAnnual ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                isAnnual ? 'bg-amber-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`ml-3 ${isAnnual ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              Annual
            </span>
            <Badge className="ml-2 bg-amber-100 text-amber-800 hover:bg-amber-100">
              Save 20%
            </Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative hover:shadow-lg transition-shadow bg-white/95 backdrop-blur-sm border-white/50 flex flex-col ${plan.popular ? 'ring-2 ring-amber-500' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  {plan.name === "Starter" ? (
                    <span className="text-4xl font-bold text-gray-900">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-gray-900">
                        ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-gray-600">
                        /{isAnnual ? 'month' : 'month'}
                      </span>
                      {isAnnual && (
                        <div className="mt-1">
                          <span className="text-sm text-gray-500 line-through">
                            ${plan.monthlyPrice}/month
                          </span>
                          <span className="ml-2 text-sm text-green-600 font-medium">
                            20% off
                          </span>
                        </div>
                      )}
                      {isAnnual && plan.annualPrice !== undefined && (
                        <div className="text-xs text-gray-500 mt-1">
                          Billed annually (${(plan.annualPrice * 12).toFixed(0)}/year)
                        </div>
                      )}
                    </>
                  )}
                </div>
                <CardDescription className="mt-2">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                <ul className="space-y-3 mb-6 flex-grow">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  variant={plan.buttonVariant} 
                  className="w-full mt-auto"
                  size="lg"
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            All plans include a 14-day free trial.
          </p>
          {/* <p className="text-sm text-gray-500">
            Looking for enterprise solutions? <a href="#" className="text-blue-600 hover:underline">Contact our sales team</a>
          </p> */}
        </div>
      </div>
    </section>
  );
}