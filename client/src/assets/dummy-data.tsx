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
    question: 'What is Thumbliy and how does it work?',
    answer: 'Thumbliy is an AI-powered thumbnail generation platform. You simply describe your idea or choose a style, and our AI generates 3-4 professional thumbnail variations for you in seconds — no design skills needed.'
},
{
    question: 'How many free credits do I get when I sign up?',
    answer: 'Every new user gets 30 free credits on signup — no payment required. Standard thumbnails cost 5 credits (2K quality) and premium thumbnails cost 10 credits (4K quality).'
},
{
    question: 'What credit plans are available if I run out of credits?',
    answer: 'We offer three affordable recharge plans — Starter (₹299 for 50 credits), Professional (₹499 for 75 credits), and Enterprise (₹899 for 100 credits). Payments are processed securely via Razorpay.'
},
{
    question: 'Can I generate thumbnails from my phone without installing any app?',
    answer: 'Yes! Thumbliy has a WhatsApp AI Bot powered by Twilio. Just message your thumbnail idea to our WhatsApp number and receive your generated thumbnail directly in your chat within seconds.'
},
{
    question: 'Can Thumbliy recreate or improve an existing YouTube thumbnail?',
    answer: 'Absolutely. Just paste any YouTube video URL into our YouTube Recreator and Thumbliy will automatically extract the existing thumbnail, analyze it, and generate an improved version using AI.'
},
{
    question: 'What platforms and sizes are supported for thumbnail generation?',
    answer: 'Thumbliy supports YouTube (16:9 · 1280×720), Instagram (1:1 · 1080×1080), and TikTok/Shorts (9:16 · 1080×1920). The AI automatically optimizes layout and composition for your selected platform.'
},
{
    question: 'When are credits deducted from my account?',
    answer: 'Credits are only deducted when you download a thumbnail — not when it is generated. This means you can preview all 3-4 variations first and only pay for the one you actually want.'
},
{
    question: 'What if I don\'t know how to describe my thumbnail idea?',
    answer: 'No problem! Our AI Chatbot powered by Google Gemini will guide you through a simple conversation — asking about your topic, mood, colors and style — and automatically build the perfect prompt for you.'
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