import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import { PrimaryButton } from "./Buttons";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import heroImage from "../assets/hero_img.webp";
import { useRef } from "react";

// ✅ Import all thumbnail images
import thumb1 from "../assets/thumb_1.jpg";
import thumb2 from "../assets/thumb_2.jpg";
import thumb3 from "../assets/thumb_3.jpg";
import thumb4 from "../assets/thumb_4.jpg";
import thumb5 from "../assets/thumb_5.jpg";
import thumb6 from "../assets/thumb_6.jpg";
import thumb7 from "../assets/thumb_7.jpg";

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseYSpring = useSpring(y, { stiffness: 500, damping: 100 });

  const rotateX = useTransform(
    mouseYSpring,
    [-0.5, 0.5],
    ["7.5deg", "-7.5deg"],
  );
  const rotateY = useTransform(
    mouseXSpring,
    [-0.5, 0.5],
    ["-7.5deg", "7.5deg"],
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const trustedUserImages = [
    "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=50",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop",
  ];

  // ✅ Thumbnail marquee images with labels
  const thumbnailImages = [
    { src: thumb1, label: "Streamer" },
    { src: thumb2, label: "Content Creator" },
    { src: thumb3, label: "YouTuber" },
    { src: thumb4, label: "Video Maker" },
    { src: thumb5, label: "Influencer" },
    { src: thumb6, label: "Podcaster" },
    { src: thumb7, label: "Educator" },
  ];

  const trustedLogosText = [
    "YouTubers",
    "Streamers",
    "Content Creators",
    "Video Makers",
    "Social Media Managers",
  ];

  return (
    <>
      <section id="home" className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 min-h-screen max-md:w-screen max-md:overflow-hidden pt-32 md:pt-26 flex flex-col items-center justify-center">
          {/* Top Content */}
          <div className="text-center mb-12 md:mb-16 w-full max-w-4xl">
            <motion.a
              href="#features"
              className="inline-flex items-center gap-3 pl-3 pr-4 py-1.5 rounded-full bg-white/10 mb-6 justify-center"
              initial={{ y: 60, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                type: "spring",
                stiffness: 250,
                damping: 70,
                mass: 1,
              }}
            >
              <div className="flex -space-x-2">
                {trustedUserImages.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Creator ${i + 1}`}
                    className="size-6 rounded-full border border-black/50"
                    width={40}
                    height={40}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-200/90">
                Trusted by creators worldwide
              </span>
            </motion.a>

            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 mx-auto"
              initial={{ y: 60, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                type: "spring",
                stiffness: 250,
                damping: 70,
                mass: 1,
                delay: 0.1,
              }}
            >
              Create Thumbnails That Get Clicks — <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                Instantly with AI
              </span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed"
              initial={{ y: 60, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                type: "spring",
                stiffness: 250,
                damping: 70,
                mass: 1,
                delay: 0.2,
              }}
            >
              Create stunning thumbnails that grab attention and boost your
              click-through rate, without any design hassle.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
              initial={{ y: 60, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                type: "spring",
                stiffness: 250,
                damping: 70,
                mass: 1,
                delay: 0.3,
              }}
            >
              <a href="/generate" className="w-full sm:w-auto">
                <PrimaryButton className="max-sm:w-full py-4 px-8 text-base font-semibold">
                  Get Started
                  <ArrowRightIcon className="size-5" />
                </PrimaryButton>
              </a>
            </motion.div>

            <motion.div
              className="inline-flex items-center gap-2 text-sm text-gray-200 bg-white/10 rounded-full px-4 py-2"
              initial={{ y: 60, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                type: "spring",
                stiffness: 250,
                damping: 70,
                mass: 1,
                delay: 0.4,
              }}
            >
              <SparklesIcon className="size-4 text-yellow-400" />
              <span>
                AI-Powered • Instant Results • No Design Skills Needed
              </span>
            </motion.div>
          </div>

          {/* ✅ THUMBNAIL MARQUEE - Scrolling thumbnails like text below */}
          <motion.div
            className="w-full max-w-6xl mx-auto mb-12 overflow-hidden"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              type: "spring",
              stiffness: 250,
              damping: 70,
              mass: 1,
              delay: 0.5,
            }}
          >
            <div className="relative">
              {/* Gradient fade on edges */}
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-900 to-transparent z-10" />
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-900 to-transparent z-10" />

              <div className="flex gap-6 animate-marquee whitespace-nowrap py-4">
                {/* Duplicate the array for seamless loop */}
                {thumbnailImages.concat(thumbnailImages).map((thumb, i) => (
                  <div
                    key={i}
                    className="inline-block group relative flex-shrink-0"
                  >
                    <div className="relative rounded-xl overflow-hidden border-2 border-white/20 hover:border-white/40 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-2xl">
                      <img
                        src={thumb.src}
                        alt={`${thumb.label} example thumbnail`}
                        className="w-48 h-27 object-cover"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Label on hover */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <span className="text-xs font-bold text-white drop-shadow-lg">
                          {thumb.label}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Center: Hero Image with 3D Motion */}
          <motion.div
            ref={ref}
            className="w-full max-w-4xl mx-auto relative cursor-pointer"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              type: "spring",
              stiffness: 250,
              damping: 70,
              mass: 1,
              delay: 0.6,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              perspective: "1000px",
            }}
          >
            <motion.div
              className="relative"
              style={{
                transformStyle: "preserve-3d",
                rotateX,
                rotateY,
              }}
              whileHover={{
                scale: 1.05,
                transition: { duration: 0.3 },
              }}
            >
              <motion.div
                className="rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-gradient-to-b from-indigo-900/30 to-purple-900/30"
                style={{
                  transform: "translateZ(50px)",
                }}
              >
                <div className="relative aspect-video bg-gray-900">
                  <img
                    src={heroImage}
                    alt="Thumblify AI Thumbnail Generator Preview"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                  <motion.div
                    className="absolute left-6 top-6 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md text-sm font-semibold border border-white/20 shadow-lg"
                    style={{
                      transform: "translateZ(80px)",
                    }}
                  ></motion.div>

                  <motion.div
                    className="absolute bottom-6 left-6 right-6"
                    style={{
                      transform: "translateZ(80px)",
                    }}
                  ></motion.div>
                </div>
              </motion.div>

              {/* 3D Glow Effect */}
              <motion.div
                className="absolute inset-0 -z-10 blur-3xl opacity-30 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl"
                style={{
                  transform: "translateZ(-100px) scale(1.2)",
                }}
                animate={{
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* LOGO MARQUEE */}
      <motion.section
        className="border-y border-white/6 bg-white/1 max-md:mt-10"
        initial={{ y: 60, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
      >
        <div className="max-w-3xl mx-auto px-6">
          <div className="w-full overflow-hidden py-6 mt-30">
            <div className="flex gap-14 items-center justify-center animate-marquee whitespace-nowrap">
              {trustedLogosText.concat(trustedLogosText).map((logo, i) => (
                <span
                  key={i}
                  className="mx-6 text-sm md:text-base font-semibold text-gray-400 hover:text-gray-300 tracking-wide transition-colors"
                >
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.section>
    </>
  );
}
