import { BrainIcon, PaletteIcon, LayersIcon } from 'lucide-react';

export const featuresData = [
    {
        icon: <BrainIcon className="w-6 h-6" />,
        title: 'Smart Analysis',
        desc: 'Our AI analyzes your video content to suggest the most clickable thumbnail concepts.'
    },
    {
        icon: <PaletteIcon className="w-6 h-6" />,
        title: 'Eye-Catching Designs',
        desc: 'Generate vibrant, high-contrast thumbnails that stand out instantly in crowded feeds.'
    },
    {
        icon: <LayersIcon className="w-6 h-6" />,
        title: 'Fully Editable',
        desc: 'Get fully layered thumbnails that you can customize and tweak to perfection anytime.'
    }
];

export const plansData = [
  {
    "id": "starter",
    "name": "Starter",
    "price": "Rs 499",
    "credits": "50 credits",
    "billing": "One-time",
    "desc": "Perfect for new creators testing AI thumbnails.",
    "features": [
      "50 AI-generated thumbnails",
      "Smart thumbnail analysis",
      "High-contrast, click-optimized designs",
      "Basic editing tools",
      "1 export size",
      "Email support"
    ]
  },
  {
    "id": "pro",
    "name": "Growth",
    "price": "Rs 1,499",
    "credits": "300 credits",
    "billing": "Monthly",
    "desc": "Ideal for growing YouTubers and content creators.",
    "popular": true,
    "features": [
      "Everything in Starter",
      "300 AI-generated thumbnails per month",
      "Advanced AI concept suggestions",
      "Fully editable layered designs",
      "Multiple export sizes",
      "Priority email support"
    ]
  },
  {
    "id": "ultra",
    "name": "Scale",
    "price": "Rs 3,999",
    "credits": "1000 credits",
    "billing": "Custom",
    "desc": "Built for agencies and brands scaling fast.",
    "features": [
      "Everything in Growth",
      "Unlimited AI thumbnail generation",
      "Brand kits (fonts, colors, styles)",
      "Bulk thumbnail generation",
      "Team collaboration",
      "Chat + Email support"
    ]
  }
]


export const faqData = [
    {
        question: 'What services does your agency provide?',
        answer: 'We offer end-to-end digital services including brand strategy, UI/UX design, web and app development and growth-focused marketing solutions.'
    },
    {
        question: 'Do you work with startups or only large companies?',
        answer: 'We work with startups, growing businesses and established brands. Our process is flexible and tailored to match your goals and scale.'
    },
    {
        question: 'How long does a typical project take?',
        answer: 'Project timelines vary by scope, but most projects take between 2–6 weeks. We provide a clear timeline after the discovery phase.'
    },
    {
        question: 'Do you offer ongoing support after launch?',
        answer: 'Yes. We offer maintenance, optimization and growth support packages to ensure your product continues to perform and evolve.'
    }
];

export const footerLinks = [
    {
        title: "Company",
        links: [
            { name: "Home", url: "#" },
            { name: "Services", url: "#" },
            { name: "Work", url: "#" },
            { name: "Contact", url: "#" }
        ]
    },
    {
        title: "Legal",
        links: [
            { name: "Privacy Policy", url: "#" },
            { name: "Terms of Service", url: "#" }
        ]
    },
    {
        title: "Connect",
        links: [
            { name: "Twitter", url: "#" },
            { name: "LinkedIn", url: "#" },
            { name: "GitHub", url: "#" }
        ]
    }
];