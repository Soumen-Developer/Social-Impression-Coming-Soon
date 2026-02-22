import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import './ComingSoonContent.css';
import JoinWaitlistForm from './form';

import logo from '../assets/logo.svg';
import logotext from '../assets/logotext.svg';
import blurTop from '../assets/refrence/blur-top.svg';
import blurBottom from '../assets/refrence/blur-bottom.svg';

interface ComingSoonContentProps {
    onSplashComplete?: () => void;
}

const ComingSoonContent = ({ onSplashComplete }: ComingSoonContentProps) => {
    const hasSeenContent = sessionStorage.getItem('social_impression_content_shown');
    const [stage, setStage] = useState<'coming-soon' | 'content'>(hasSeenContent ? 'content' : 'coming-soon');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [errors, setErrors] = useState({ name: false, email: false, phone: false });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (stage === 'content') {
            if (onSplashComplete) onSplashComplete();
            return;
        }

        const timer = setTimeout(() => {
            setStage('content');
            sessionStorage.setItem('social_impression_content_shown', 'true');
            if (onSplashComplete) onSplashComplete();
        }, 8000);
        return () => clearTimeout(timer);
    }, [stage, onSplashComplete]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Reset errors
        const newErrors = { name: false, email: false, phone: false };
        let hasError = false;

        // Robust Validation
        if (!formData.name.trim()) {
            newErrors.name = true;
            hasError = true;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            newErrors.email = true;
            hasError = true;
        }

        // International phone regex: allows +, spaces, hyphens, parentheses and 10-20 digits
        const phoneRegex = /^\+?[\d\s\-().]{10,20}$/;
        if (!phoneRegex.test(formData.phone)) {
            newErrors.phone = true;
            hasError = true;
        }

        setErrors(newErrors);

        if (hasError) {
            setStatus('error');
            setErrorMessage('Please fix the highlighted fields.');
            return;
        }

        setStatus('loading');
        setErrorMessage('');

        try {
            const response = await fetch('/submit_contact.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                setStatus('success');
                // Don't reset form immediately so user doesn't see empty fields in success flash
            } else {
                setStatus('error');
                setErrorMessage(result.message || 'Something went wrong.');
            }
        } catch (error) {
            console.error("Submission error:", error);
            setStatus('error');
            setErrorMessage('Failed to connect. Please try again.');
        }
    };

    return (
        <div className="page-wrapper">
            <div className={`dynamic-background ${stage}-bg`}>
                <motion.div
                    className="blur-asset-top"
                    initial={{ opacity: 0, x: -100, y: -100 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
                >
                    <img src={blurTop} alt="" className="blur-asset breathing-top" />
                </motion.div>
                <motion.div
                    className="blur-asset-bottom"
                    initial={{ opacity: 0, x: 100, y: 100 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                >
                    <img src={blurBottom} alt="" className="blur-asset breathing-bottom" />
                </motion.div>
            </div>

            <AnimatePresence mode="wait">
                {stage === 'coming-soon' ? (
                    <motion.div
                        key="coming-soon-splash"
                        className="coming-soon-splash"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <h1 className="coming-soon-hero">COMING SOON</h1>
                        <motion.p
                            className="coming-soon-subhero"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.8 }}
                        >
                            Till then join the waitlist
                        </motion.p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="main-content"
                        className="coming-soon-container"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                    >
                        {/* Premium Header */}
                        <header className="premium-header">
                            <motion.div
                                className="header-logo-container"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.5 }}
                            >
                                <img src={logotext} alt="Social Impression" className="logotext-svg" />
                            </motion.div>
                            <div className="header-actions">
                                <button className="contact-button">CONTACT</button>
                                <div className="hamburger-menu">
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </header>

                        <div className="content-wrapper">
                            <motion.h1
                                className="hero-title"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                            >
                                Calling out all next-gen musicians!
                            </motion.h1>

                            <motion.p
                                className="hero-subtitle italic-text"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                            >
                                We know all the late nights, the endless edits.
                                Your Music deserves more. You deserve more
                            </motion.p>

                            <motion.p
                                className="hero-description"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.5 }}
                            >
                                We are building a platform<br />
                                to take your music to new highs.
                            </motion.p>

                            <AnimatePresence mode="wait">
                                {status === 'success' ? (
                                    <motion.div
                                        key="success-card"
                                        className="success-glass-card"
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ type: "spring", stiffness: 100, damping: 15 }}
                                    >
                                        <div className="success-icon-wrapper">
                                            <svg viewBox="0 0 24 24" fill="none" className="success-svg">
                                                <motion.path
                                                    d="M20 6L9 17L4 12"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    initial={{ pathLength: 0 }}
                                                    animate={{ pathLength: 1 }}
                                                    transition={{ duration: 0.8, delay: 0.2 }}
                                                />
                                            </svg>
                                        </div>
                                        <h3 className="success-glass-title">Welcome Aboard!</h3>
                                        <p className="success-glass-text">
                                            You've secured your spot on the exclusive waitlist.<br />
                                            We'll be in touch soon with your early access.
                                        </p>
                                        <button
                                            className="success-back-btn"
                                            onClick={() => {
                                                setStatus('idle');
                                                setFormData({ name: '', email: '', phone: '' });
                                                setErrors({ name: false, email: false, phone: false });
                                            }}
                                        >
                                            Done
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="form-container"
                                        className="glass-form-container"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                    >
                                        <div className="input-group">
                                            <div className="input-icon">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M20 21C20 18.2386 16.4183 16 12 16C7.58172 16 4 18.2386 4 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Name"
                                                className={`glass-input ${errors.name ? 'input-error' : ''}`}
                                                value={formData.name}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, name: e.target.value });
                                                    if (errors.name) setErrors({ ...errors, name: false });
                                                }}
                                                disabled={status === 'loading'}
                                                maxLength={50}
                                            />
                                        </div>
                                        <div className="input-group">
                                            <div className="input-icon">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                className={`glass-input ${errors.email ? 'input-error' : ''}`}
                                                value={formData.email}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, email: e.target.value });
                                                    if (errors.email) setErrors({ ...errors, email: false });
                                                }}
                                                disabled={status === 'loading'}
                                                maxLength={100}
                                            />
                                        </div>
                                        <div className="input-group">
                                            <div className="input-icon">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M22 16.92V19.92C22 20.4723 21.5523 20.92 21 20.92C12.1634 20.92 5 13.7566 5 4.92001C5 4.36772 5.44772 3.92001 6 3.92001H9C9.55228 3.92001 10 4.36772 10 4.92001C10 6.00001 10.17 7.04001 10.48 8.01001C10.59 8.35001 10.51 8.73001 10.26 8.98001L8.41 10.83C9.69 13.11 11.58 15 13.86 16.29L15.71 14.44C15.96 14.19 16.34 14.11 16.68 14.22C17.65 14.54 18.69 14.71 19.77 14.71C20.3223 14.71 20.77 15.1577 20.77 15.71V16.92V16.92Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <input
                                                type="tel"
                                                placeholder="Phone"
                                                className={`glass-input ${errors.phone ? 'input-error' : ''}`}
                                                value={formData.phone}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, phone: e.target.value });
                                                    if (errors.phone) setErrors({ ...errors, phone: false });
                                                }}
                                                disabled={status === 'loading'}
                                                maxLength={20}
                                            />
                                        </div>

                                        <button
                                            onClick={handleSubmit}
                                            disabled={status === 'loading'}
                                            className={`join-waitlist-button ${status}`}
                                        >
                                            {status === 'loading' ? 'SENDING...' : 'JOIN THE WAITLIST'}
                                            <img src={logo} alt="" className="waitlist-icon" />
                                        </button>

                                        {status === 'error' && <p className="form-error-msg">{errorMessage}</p>}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <motion.div
                            className="simple-footer"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.8 }}
                        >
                            <p>
                                Sign up today to get early access and be part of the
                                Social Impression community before the app goes live.
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <JoinWaitlistForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};

export default ComingSoonContent;
