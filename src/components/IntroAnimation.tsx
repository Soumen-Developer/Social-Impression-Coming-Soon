import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import logo from '../assets/logo.svg';
import './IntroAnimation.css';

interface IntroAnimationProps {
    onComplete: () => void;
    moveToHeader: boolean;
}

const IntroAnimation = ({ onComplete, moveToHeader }: IntroAnimationProps) => {
    // Check session flags ONCE on mount
    const hasSeenIntro = useRef(!!sessionStorage.getItem('social_impression_intro_shown')).current;
    const hasSeenContent = useRef(!!sessionStorage.getItem('social_impression_content_shown')).current;

    // Determine initial step
    const getInitialStep = () => {
        if (hasSeenContent) return 4; // Already seen everything -> header mode
        if (hasSeenIntro) return 3;   // Seen intro, at splash phase
        return 0;                      // Fresh start
    };

    const [step, setStep] = useState(getInitialStep);
    const hasCalledComplete = useRef(false);

    // Handle prop-driven move to header
    useEffect(() => {
        if (moveToHeader && step !== 4) {
            if (!hasSeenIntro) {
                sessionStorage.setItem('social_impression_intro_shown', 'true');
            }
            setStep(4);
        }
    }, [moveToHeader, step, hasSeenIntro]);

    // Run animation sequence ONLY if starting fresh (step 0)
    useEffect(() => {
        // If already past intro, notify parent immediately (once)
        if ((step === 3 || step === 4) && !hasCalledComplete.current) {
            hasCalledComplete.current = true;
            onComplete();
            return;
        }

        // Only run timers if we're in the intro sequence (step 0)
        if (step !== 0) return;

        // Premium elegant timing
        const timer1 = setTimeout(() => setStep(1), 600);   // Fade in logo slowly
        const timer2 = setTimeout(() => setStep(2), 2200);  // Slide text elegantly
        const timer3 = setTimeout(() => {
            if (!hasSeenIntro) {
                sessionStorage.setItem('social_impression_intro_shown', 'true');
            }
            setStep(3);
            hasCalledComplete.current = true;
            onComplete();
        }, 4500); // Hold for reading then dismiss

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isHeaderMode = step >= 3;

    return (
        <motion.div
            className={`intro-container ${isHeaderMode ? 'header-mode' : ''}`}
            initial={false}
            animate={{
                backgroundColor: isHeaderMode ? 'transparent' : 'var(--base-dark)',
            }}
            exit={{
                opacity: 0,
                filter: 'blur(20px)',
                transition: { duration: 0.8, ease: "easeInOut" }
            }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} // Smooth ease out
        >
            <motion.div
                className="logo-wrapper"
                layout
                animate={{
                    scale: isHeaderMode ? 0.6 : 1,
                    y: isHeaderMode ? -20 : 0
                }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            >
                <motion.img
                    src={logo}
                    alt="Social Impression Logo"
                    className="intro-logo"
                    initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                    animate={{
                        opacity: step >= 1 ? 1 : 0,
                        scale: step >= 1 ? 1 : 0.9,
                        filter: step >= 1 ? 'blur(0px)' : 'blur(10px)'
                    }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                />

                <motion.div
                    className="intro-text"
                    initial={{ width: 0, opacity: 0 }}
                    animate={step >= 2 ? { width: 'auto', opacity: 1 } : { width: 0, opacity: 0 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                >
                    <h1 className="brand-name">
                        SOCIAL <span className="capital">IMPRESSION</span>
                    </h1>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default IntroAnimation;
