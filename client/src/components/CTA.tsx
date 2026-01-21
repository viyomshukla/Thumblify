import { ArrowRightIcon } from 'lucide-react';
import { PrimaryButton } from './Buttons';
import { motion } from 'framer-motion';



export default function CTA() {
    return (
        <section className="py-20 2xl:pb-32 px-4">
            <div className="container mx-auto max-w-3xl">
                <div className="rounded-3xl bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-pink-900/20 border-2 border-indigo-500/30 p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10" />
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5" />
                    <div className="relative z-10">
                        <motion.h2 className="text-3xl sm:text-5xl font-extrabold mb-6"
                            initial={{ y: 60, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
                        >
                            Ready to go viral?
                        </motion.h2>
                        <motion.p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto"
                            initial={{ y: 60, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.2 }}
                        >
                            Join thousands of creators using AI to boost their CTR and grow faster.
                        </motion.p>
                        <motion.div
                            initial={{ y: 60, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.3 }}
                        >
                            <a href="/generate">
                                <PrimaryButton className="px-10 py-4 text-base font-semibold gap-2">
                                    Get Started <ArrowRightIcon size={20}  />
                                </PrimaryButton>
                            </a>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
};