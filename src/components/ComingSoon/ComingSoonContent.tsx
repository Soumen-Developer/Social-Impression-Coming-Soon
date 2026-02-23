import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import './ComingSoonContent.css';
import { detectGeo, type GeoData } from '../../utils/geoDetect';

import logo from '../../assets/logo.svg';
import logotext from '../../assets/logotext.svg';
import blurTop from '../../assets/refrence/blur-top.svg';
import blurBottom from '../../assets/refrence/blur-bottom.svg';

const GOOGLE_FORM_URL = import.meta.env.VITE_GOOGLE_FORM_URL || '';
const DISCOVERY_CALL_URL = import.meta.env.VITE_DISCOVERY_CALL_URL || '';
const GOOGLE_SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_URL || '';

interface ComingSoonContentProps {
    onSplashComplete?: () => void;
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.6 }
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.4 } }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

const ComingSoonContent = ({ onSplashComplete }: ComingSoonContentProps) => {
    const splashCalled = useRef(false);
    const hasSeenContent = sessionStorage.getItem('social_impression_content_shown');
    const [stage, setStage] = useState<'coming-soon' | 'content'>(hasSeenContent ? 'content' : 'coming-soon');

    // Form State
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [errors, setErrors] = useState({ name: false, email: false, phone: false });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showSubmitAnother, setShowSubmitAnother] = useState(false);
    const [geoData, setGeoData] = useState<GeoData | null>(null);
    const formRef = useRef<HTMLFormElement>(null);

    // Silently detect geo on mount (no popup, no alert)
    useEffect(() => {
        detectGeo().then(setGeoData);
    }, []);

    // Timer for Submit Another Response button
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (status === 'success') {
            timer = setTimeout(() => setShowSubmitAnother(true), 5000);
        } else {
            setShowSubmitAnother(false);
        }
        return () => clearTimeout(timer);
    }, [status]);

    useEffect(() => {
        if (stage === 'content') {
            if (onSplashComplete && !splashCalled.current) {
                splashCalled.current = true;
                onSplashComplete();
            }
            return;
        }
        const timer = setTimeout(() => {
            setStage('content');
            sessionStorage.setItem('social_impression_content_shown', 'true');
            if (onSplashComplete && !splashCalled.current) {
                splashCalled.current = true;
                onSplashComplete();
            }
        }, 4000);
        return () => clearTimeout(timer);
    }, [stage, onSplashComplete]);

    // Auto-dismiss toast after 4 seconds
    useEffect(() => {
        if (showToast) {
            const t = setTimeout(() => setShowToast(false), 4000);
            return () => clearTimeout(t);
        }
    }, [showToast]);

    // Lock body scroll when sidebar is open
    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [sidebarOpen]);

    const handleDiscoveryCall = () => {
        if (status === 'success') {
            // User already submitted — open calendar and log to sheet
            window.open(DISCOVERY_CALL_URL, '_blank');
            fetch(GOOGLE_SHEET_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name || 'Returning User',
                    email: formData.email || '-',
                    phone: formData.phone || '-',
                    country: geoData?.country || '',
                    meeting: 'Discovery Call Booked',
                    source: 'Sidebar - Discovery Call',
                    ip: geoData?.ip || '',
                    city: geoData?.city || '',
                    userAgent: navigator.userAgent,
                    referrer: document.referrer,
                })
            }).catch(() => { });
            setSidebarOpen(false);
        } else {
            // User hasn't submitted yet — show toast and scroll to form
            setSidebarOpen(false);
            setErrorMessage('Please fill in your details in the waitlist form first to schedule a call.');
            setShowToast(true);
            setTimeout(() => {
                formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors = { name: false, email: false, phone: false };
        let hasError = false;

        if (!formData.name.trim()) { newErrors.name = true; hasError = true; }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) { newErrors.email = true; hasError = true; }

        const phoneRegex = /^\+?[0-9\s\-().]{10,20}$/;
        if (!phoneRegex.test(formData.phone)) { newErrors.phone = true; hasError = true; }

        setErrors(newErrors);

        if (hasError) {
            setStatus('error');
            setErrorMessage('Please fix the highlighted fields.');
            setShowToast(true);
            return;
        }

        setStatus('loading');
        setErrorMessage('');

        try {
            // Create a timeout — if server doesn't respond in 3s, assume success
            // The PHP backend uses "Fire and Forget" so the email sends regardless
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const apiUrl = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${apiUrl}/submit_contact.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    country: geoData?.country || '',
                    city: geoData?.city || '',
                    region: geoData?.region || '',
                    ip: geoData?.ip || '',
                    geoRaw: geoData?.raw || {},
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const text = await response.text();
            let result: { success: boolean; message?: string };
            try { result = JSON.parse(text); }
            catch { throw new Error('Invalid server response'); }

            if (result.success) {
                setStatus('success');
            } else {
                setStatus('error');
                setErrorMessage(result.message || 'Something went wrong.');
                setShowToast(true);
            }
        } catch (error) {
            // If it timed out or network error, show success anyway
            // The backend already received the data and will process it
            if (error instanceof DOMException && error.name === 'AbortError') {
                setStatus('success');
            } else {
                console.error('Submission error:', error);
                setStatus('error');
                setErrorMessage('Failed to connect. Please try again.');
                setShowToast(true);
            }
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

            {/* Toast notification */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        className="error-toast"
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                    >
                        <span className="error-toast-icon">⚠️</span>
                        <span>{errorMessage}</span>
                        <button className="error-toast-close" onClick={() => setShowToast(false)}>✕</button>
                    </motion.div>
                )}
            </AnimatePresence>

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
                            <motion.div
                                className="header-actions"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.5 }}
                            >
                                <a
                                    href={GOOGLE_FORM_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="contact-button"
                                >
                                    CONTACT
                                </a>
                                <button
                                    className={`hamburger-menu ${sidebarOpen ? 'open' : ''}`}
                                    aria-label="Toggle menu"
                                    onClick={() => setSidebarOpen(!sidebarOpen)}
                                >
                                    <span></span>
                                    <span></span>
                                </button>
                            </motion.div>
                        </header>

                        <div className="content-wrapper">
                            <motion.h1
                                className="hero-title-1"
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
                                        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                                    >
                                        <div className="success-icon-wrapper">
                                            <svg viewBox="0 0 24 24" fill="none" className="success-svg">
                                                <motion.path
                                                    d="M4 12L9 17L20 6"
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
                                            Check your inbox - we've sent you a gift 🎵
                                        </p>
                                        <button
                                            className="success-back-btn"
                                            onClick={() => setSidebarOpen(true)}
                                        >
                                            Get in Touch With Us
                                        </button>

                                        <AnimatePresence>
                                            {showSubmitAnother && (
                                                <motion.button
                                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                                    animate={{ opacity: 1, height: 'auto', marginTop: 15 }}
                                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                                    className="submit-another-btn"
                                                    onClick={() => {
                                                        setStatus('idle');
                                                        setFormData({ name: '', email: '', phone: '' });
                                                        setErrors({ name: false, email: false, phone: false });
                                                    }}
                                                >
                                                    Submit Another Response
                                                </motion.button>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="form-container"
                                        className="glass-form-container"
                                        ref={formRef as React.Ref<HTMLDivElement>}
                                        variants={containerVariants}
                                        initial="hidden"
                                        animate="visible"
                                    >
                                        <motion.div className="input-group" variants={itemVariants}>
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
                                        </motion.div>

                                        <motion.div className="input-group" variants={itemVariants}>
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
                                        </motion.div>

                                        <motion.div className="input-group" variants={itemVariants}>
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
                                                    const val = e.target.value;
                                                    // Only allow digits, plus, hyphens, spaces, dots, and parentheses
                                                    const filtered = val.replace(/[^\d+\s\-().]/g, '');
                                                    setFormData({ ...formData, phone: filtered });
                                                    if (errors.phone) setErrors({ ...errors, phone: false });
                                                }}
                                                disabled={status === 'loading'}
                                                maxLength={20}
                                            />
                                        </motion.div>

                                        <motion.button
                                            onClick={handleSubmit}
                                            disabled={status === 'loading'}
                                            className={`join-waitlist-button ${status}`}
                                            variants={itemVariants}
                                        >
                                            {status === 'loading' ? (
                                                <div className="sending-animation-wrapper">
                                                    <div className="music-notes-container">
                                                        {/* note-1.svg */}
                                                        <svg className="loading-music-note note-1" width="24" height="24" viewBox="0 0 36 36" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M31.68,6.16c-1.92-3.3-10.6-4-11.58-4.09L19,2V22.29a5.88,5.88,0,0,0-.81-.55,8.33,8.33,0,0,0-6.53-.41c-4.12,1.33-6.77,5.13-5.91,8.47a5.33,5.33,0,0,0,2.66,3.32,7.48,7.48,0,0,0,3.61.88A9.54,9.54,0,0,0,15,33.52c3.7-1.19,6.2-4.37,6.06-7.42,0,0,0,0,0,0V8.49c1,.12,2.37.33,3.82.64a11.17,11.17,0,0,1,4.06,1.46c1,.66.38,1.9.33,2a11.8,11.8,0,0,1-1.66,2,1,1,0,0,0,1.33,1.49C29.15,15.85,34.5,11,31.68,6.16Z" />
                                                        </svg>
                                                        {/* music-note2.svg */}
                                                        <svg className="loading-music-note note-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M9 18V5l12-2v13" /><path d="m9 9 12-2" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                                                        </svg>
                                                        {/* note-last.svg (S-looking note) */}
                                                        <svg className="loading-music-note note-3" width="19" height="20" viewBox="0 0 19 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                            <path d="M12.5469 15.9125L13.9869 11.5657L16.3343 4.47264L17.6712 3.45898L14.5946 12.6872L13.0294 17.4471L12.5469 15.9125Z" />
                                                            <path d="M13.0285 17.4427C12.0991 18.4764 10.5278 19.1459 9.03769 19.4355C7.53166 19.7289 5.97403 19.7126 4.48166 19.3841C2.88913 19.0337 1.3444 18.2877 0.51286 17.0829C-0.462079 15.6699 0.00149169 14.0695 1.49235 13.0659C2.1107 12.6502 2.80264 12.3619 3.57728 12.192C5.56737 11.7538 7.62953 12.0716 9.37835 12.9543C10.7584 13.6595 11.8214 14.6707 12.5475 15.9081L13.0293 17.4427H13.0285Z" />
                                                            <path d="M16.3253 4.50034C15.2183 5.01752 14.0674 5.02002 12.8929 4.77679C11.7935 4.51789 10.9544 4.13926 9.80496 3.99571C8.06221 3.77818 6.31718 4.32168 5.47122 5.65066C4.95985 4.53733 5.06304 3.31868 6.17151 2.4981C7.27315 1.68254 8.7496 1.43805 10.201 1.46062C10.7116 1.46877 11.1942 1.51265 11.7017 1.55152L13.3967 1.68316C14.0507 1.69633 14.6721 1.65056 15.2874 1.47253C16.0567 1.23871 16.669 0.816819 17.1629 0.263914L18.8245 0L17.6621 3.48794L16.3253 4.5016V4.50034Z" />
                                                            <path d="M12.361 14.9749C12.3359 14.6045 12.342 14.2835 12.2525 13.935C11.999 12.9445 11.2487 12.29 10.2077 11.8011C9.67664 11.5516 9.1372 11.3547 8.56058 11.1811L6.34137 10.5116C5.61604 10.2928 4.94155 10.032 4.28982 9.69602C3.83308 9.46031 3.43628 9.19828 3.08803 8.85976C2.10019 7.9019 2.07743 6.66382 2.66315 5.5367C3.15783 4.58573 4.12291 3.64604 5.09405 2.95898C4.42942 4.13814 4.5144 5.43389 5.54776 6.40993C6.41041 7.24117 7.61827 7.75333 8.81324 8.19152C10.009 8.6297 11.2282 9.04971 12.1682 9.80823C13.804 11.1291 13.2244 12.8881 12.5757 14.4596L12.361 14.9743V14.9749Z" />
                                                        </svg>
                                                    </div>
                                                    <span className="sending-text">SENDING...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    JOIN THE WAITLIST NOW
                                                    <img src={logo} alt="" className="waitlist-icon" />
                                                </>
                                            )}
                                        </motion.button>
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

            {/* Sidebar Overlay + Panel */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            className="sidebar-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            onClick={() => setSidebarOpen(false)}
                        />
                        <motion.div
                            className="sidebar-panel"
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        >
                            <div className="sidebar-content">
                                <div className="sidebar-header">
                                    <h2 className="sidebar-title">Menu</h2>
                                    <button
                                        className="sidebar-close"
                                        onClick={() => setSidebarOpen(false)}
                                        aria-label="Close menu"
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                </div>

                                <nav className="sidebar-nav">
                                    <button
                                        className="sidebar-link discovery-call-link"
                                        onClick={handleDiscoveryCall}
                                    >
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        <span>Book a Discovery Call</span>
                                        <svg className="sidebar-link-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>
                                    </button>

                                    <a
                                        href={GOOGLE_FORM_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="sidebar-link"
                                    >
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                        </svg>
                                        <span>Contact Us</span>
                                        <svg className="sidebar-link-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>
                                    </a>
                                </nav>
                            </div>

                            <div className="sidebar-footer">
                                <div className="sidebar-footer-divider" />
                                <a href="mailto:connect@socialimpression.co" className="sidebar-email">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                    connect@socialimpression.co
                                </a>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ComingSoonContent;
