import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import './WaitlistForm.css';

interface JoinWaitlistFormProps {
    isOpen: boolean;
    onClose: () => void;
}

const JoinWaitlistForm = ({ isOpen, onClose }: JoinWaitlistFormProps) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.name.trim()) {
            setStatus('error');
            setErrorMessage('Please enter your name.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[\d\s+\-().]{10,}$/; // Permissive but requires at least 10 chars

        if (!emailRegex.test(formData.email)) {
            setStatus('error');
            setErrorMessage('Please enter a valid email address.');
            return;
        }

        if (!phoneRegex.test(formData.phone)) {
            setStatus('error');
            setErrorMessage('Please enter a valid phone number (min 10 digits).');
            return;
        }

        setStatus('loading');
        setErrorMessage('');

        try {
            // DEV MODE: Mock submission because Vite cannot run PHP
            if (import.meta.env.DEV) {
                console.warn("DEV MODE: Mocking PHP submission. Real email sending requires a PHP server.");
                await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay

                // Simulate success
                const result = { success: true, message: "Dev Mode: Success! (Email not sent)" };

                if (result.success) {
                    setStatus('success');
                    setFormData({ name: '', email: '', phone: '' });
                    setTimeout(() => {
                        onClose();
                        setTimeout(() => setStatus('idle'), 500);
                    }, 3000);
                }
                return;
            }

            const response = await fetch('/submit_contact.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            // Handle non-JSON responses (like 404 HTML pages) gracefully
            const text = await response.text();
            let result;
            try {
                result = JSON.parse(text);
            } catch {
                console.error("Failed to parse JSON response:", text);
                throw new Error("Invalid server response");
            }

            if (result.success) {
                setStatus('success');
                setFormData({ name: '', email: '', phone: '' });
                setTimeout(() => {
                    onClose();
                    // Reset status after closing so it's ready for next time
                    setTimeout(() => setStatus('idle'), 500);
                }, 3000);
            } else {
                setStatus('error');
                setErrorMessage(result.message || 'Something went wrong.');
            }
        } catch (error) {
            console.error("Submission error:", error);
            setStatus('error');
            setErrorMessage('Failed to connect. Please check your internet connection.');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-wrapper">
                    <motion.div
                        className="modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="modal-content"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                    >
                        {/* Gradient Bar */}
                        <div className="modal-gradient-bar" />

                        <button
                            onClick={onClose}
                            className="modal-close-btn"
                        >
                            ✕
                        </button>

                        <h2 className="modal-title">Secure Your Spot</h2>
                        <p className="modal-subtitle">Join our exclusive waitlist for early access.</p>

                        {status === 'success' ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="success-message"
                            >
                                <div className="success-icon">✓</div>
                                <h3 className="success-title">Thank You!</h3>
                                <p className="success-text">We've received your details.</p>
                            </motion.div>

                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-input"
                                        placeholder="Your Name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        disabled={status === 'loading'}
                                        maxLength={40}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        className="form-input"
                                        placeholder="you@company.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        disabled={status === 'loading'}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input
                                        type="tel"
                                        required
                                        className="form-input"
                                        placeholder="+91 9876543210"
                                        value={formData.phone}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            // Only allow numbers, spaces, +, -, (, )
                                            if (/^[0-9+\-()\s]*$/.test(val)) {
                                                setFormData({ ...formData, phone: val });
                                            }
                                        }}
                                        maxLength={15}
                                        disabled={status === 'loading'}
                                    />
                                </div>

                                {status === 'error' && (
                                    <div className="error-message">
                                        {errorMessage}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="submit-btn"
                                >
                                    {status === 'loading' ? (
                                        <span><span className="spinner"></span>Sending...</span>
                                    ) : (
                                        'Submit Application'
                                    )}
                                </button>
                            </form>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default JoinWaitlistForm;