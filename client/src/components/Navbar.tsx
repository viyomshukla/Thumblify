import { MenuIcon, XIcon } from 'lucide-react';
import { PrimaryButton } from './Buttons';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.svg';
import AuthModal from './AuthModal';
import { useAuth } from '../contexts/AuthContext';


export default function Navbar() {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const handleFAQClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (location.pathname === '/') {
            // If already on home page, scroll to FAQ section
            const faqSection = document.getElementById('pricing');
            if (faqSection) {
                faqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            // Navigate to home page, then scroll to FAQ
            navigate('/');
            setTimeout(() => {
                const faqSection = document.getElementById('pricing');
                if (faqSection) {
                    faqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        }
        setIsOpen(false);
    };

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Generate', href: '/generate' },
        { name: 'My Generation', href: '/community' },
        { name: 'Pricing', href: '/#pricing', isFAQ: true },
        { name: 'User', href: '/about' },
    ];

    return (
        <motion.nav className='fixed top-5 left-0 right-0 z-50 px-4'
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
        >
            <div className='max-w-6xl mx-auto flex items-center justify-between bg-black/50 backdrop-blur-md border border-white/4 rounded-2xl p-3'>
                <Link to='/'>
                    <img src={logo} alt="Thumbify logo" className="h-8" />
                </Link>

                <div className='hidden md:flex items-center gap-8 text-sm font-medium text-gray-300'>
                    {navLinks.map((link) => (
                        link.isFAQ ? (
                            <a 
                                href="/#faq" 
                                key={link.name} 
                                onClick={handleFAQClick}
                                className="hover:text-white transition cursor-pointer"
                            >
                                {link.name}
                            </a>
                        ) : (
                            <Link 
                                to={link.href} 
                                key={link.name} 
                                className={`hover:text-white transition ${location.pathname === link.href ? 'text-white' : ''}`}
                            >
                                {link.name}
                            </Link>
                        )
                    ))}
                </div>

                <div className='hidden md:flex items-center gap-3'>
                    {user ? (
                        <>
                            {/* ✅ Enhanced credits display with animation */}
                            <div className='flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg'>
                                <span className='text-sm font-semibold text-yellow-400'>
                                    {user.credits} Credits
                                </span>
                            </div>
                            <button
                                onClick={logout}
                                className='text-sm font-medium text-gray-300 hover:text-white transition'
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className='text-sm font-medium text-gray-300 hover:text-white transition max-sm:hidden'
                            >
                                Sign in
                            </button>
                            <PrimaryButton
                                onClick={() => setIsAuthModalOpen(true)}
                                className='max-sm:text-xs hidden sm:inline-block'
                            >
                                Get Started
                            </PrimaryButton>
                        </>
                    )}
                </div>

                <button onClick={() => setIsOpen(!isOpen)} className='md:hidden'>
                    <MenuIcon className='size-6' />
                </button>
            </div>
            <div className={`flex flex-col items-center justify-center gap-6 text-lg font-medium fixed inset-0 bg-black/40 backdrop-blur-md z-50 transition-all duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
                {/* ✅ Show credits in mobile menu too */}
                {user && (
                    <div className='px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg'>
                        <span className='text-sm font-semibold text-yellow-400'>
                            {user.credits} Credits
                        </span>
                    </div>
                )}
                
                {navLinks.map((link) => (
                    link.isFAQ ? (
                        <a 
                            key={link.name} 
                            href="/#faq" 
                            onClick={handleFAQClick}
                            className="cursor-pointer"
                        >
                            {link.name}
                        </a>
                    ) : (
                        <Link key={link.name} to={link.href} onClick={() => setIsOpen(false)}>
                            {link.name}
                        </Link>
                    )
                ))}

                {user ? (
                    <button 
                        onClick={() => {
                            setIsOpen(false);
                            logout();
                        }} 
                        className='font-medium text-gray-300 hover:text-white transition'
                    >
                        Logout
                    </button>
                ) : (
                    <>
                        <button 
                            onClick={() => {
                                setIsOpen(false);
                                setIsAuthModalOpen(true);
                            }} 
                            className='font-medium text-gray-300 hover:text-white transition'
                        >
                            Sign in
                        </button>
                        <PrimaryButton 
                            onClick={() => {
                                setIsOpen(false);
                                setIsAuthModalOpen(true);
                            }}
                        >
                            Get Started
                        </PrimaryButton>
                    </>
                )}

                <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-md bg-white p-2 text-gray-800 ring-white active:ring-2"
                >
                    <XIcon />
                </button>
            </div>
            
            {/* Auth Modal */}
            <AuthModal 
                isOpen={isAuthModalOpen} 
                onClose={() => setIsAuthModalOpen(false)} 
            />
        </motion.nav>
    );
};