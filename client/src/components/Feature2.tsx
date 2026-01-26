import { motion } from 'framer-motion';
import { 
  DollarSign, 
  MessageCircle, 
  Bot, 
  Palette, 
  Maximize2, 
  Youtube, 
  Sparkles,
  Zap,
  Star,
  CheckCircle2
} from 'lucide-react';

export default function Features2() {
  const features = [

    {
      icon: Sparkles,
      title: 'AI From Scratch',
      description: 'Describe your idea and watch AI create stunning thumbnails from text in seconds.',
      color: 'from-yellow-400 to-orange-600',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      highlights: [
        'Text-to-image generation',
        'Creative AI suggestions',
        'Unlimited revisions'
      ]
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp AI Bot',
      description: 'Generate thumbnails on-the-go directly from WhatsApp. Available 24/7 anywhere.',
      color: 'from-green-400 to-green-600',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      highlights: [
        'Works from your phone',
        'No app installation needed',
        'Instant delivery to WhatsApp'
      ]
    },
    {
      icon: Bot,
      title: 'AI Powered Chatbot',
      description: 'You describe your thumbnail idea and our AI creates it for you.',
      color: 'from-purple-400 to-pink-600',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      highlights: [
        'Smart AI conversations',
        'Understands your vision',
        'Personalized recommendations'
      ]
    },
    {
      icon: Youtube,
      title: 'YouTube Thumbnail Recreator',
      description: 'Upload any YouTube URL and our AI will analyze and improve the existing thumbnail.',
      color: 'from-red-400 to-red-600',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      highlights: [
        'Analyze existing thumbnails',
        'AI-powered improvements',
        'Keep your brand style'
      ]
    },
        {
      icon: DollarSign,
      title: 'Affordable Pricing',
      description: 'Get professional thumbnails without breaking the bank. Pay only for what you use.',
      color: 'from-green-400 to-emerald-600',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      highlights: [
        'Starting at just 5 credits',
        'Premium quality for 10 credits',
        'No hidden fees'
      ]
    },
    
    {
      icon: Palette,
      title: 'Custom Color Schemes',
      description: 'Choose from vibrant color palettes or let AI suggest the perfect colors for your brand.',
      color: 'from-pink-400 to-rose-600',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20',
      highlights: [
        '10+ preset color schemes',
        'Brand color matching',
        'AI color suggestions'
      ]
    },
    {
      icon: Maximize2,
      title: 'Multiple Aspect Ratios',
      description: 'Create thumbnails in any size - YouTube (16:9), Instagram (1:1), or TikTok (9:16).',
      color: 'from-blue-400 to-cyan-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      highlights: [
        'YouTube: 16:9 perfect fit',
        'Instagram: 1:1 square',
        'TikTok/Shorts: 9:16 vertical'
      ]
    },
    
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Get your thumbnails in 10-20 seconds. No waiting, no delays, just instant results.',
      color: 'from-indigo-400 to-purple-600',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      highlights: [
        'Basic: 10 seconds',
        'Premium: 15-20 seconds',
        'Real-time preview'
      ]
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  return (
    <section id="features" className="relative py-20 md:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-4"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-gray-300">Powerful Features</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6">
            Everything You Need to Create
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Stunning Thumbnails
            </span>
          </h2>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
            From AI-powered generation to WhatsApp automation, we've packed everything 
            you need to create professional thumbnails in seconds.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.05, 
                  y: -10,
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                }}
                className="group relative"
              >
                {/* Card */}
                <div className={`
                  relative h-full p-6 rounded-2xl border-2 ${feature.borderColor} ${feature.bgColor}
                  backdrop-blur-sm transition-all duration-300
                  hover:shadow-2xl hover:shadow-purple-500/10
                  overflow-hidden
                `}>
                  {/* Animated background gradient */}
                  <div className={`
                    absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 
                    group-hover:opacity-10 transition-opacity duration-500
                  `} />

                  {/* Icon */}
                  <div className={`
                    relative w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} 
                    flex items-center justify-center mb-4
                    transform group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300
                  `}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all duration-300">
                    {feature.title}
                  </h3>

                  <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Highlights */}
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight, i) => (
                      <motion.li
                        key={i}
                        className="flex items-start gap-2 text-xs text-gray-300"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 * i }}
                      >
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 bg-gradient-to-br ${feature.color} bg-clip-text text-transparent`} />
                        <span>{highlight}</span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* Hover effect shine */}
                  <div className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-x-16 -translate-y-16 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div 
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          
        </motion.div>
      </div>

      {/* Decorative elements */}
      {/* <div className="absolute top-1/4 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" /> */}
    </section>
  );
}