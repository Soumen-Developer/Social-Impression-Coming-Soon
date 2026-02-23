import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import IntlTelInput from 'intl-tel-input/reactWithUtils';
import 'intl-tel-input/styles';
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
    const [isPhoneValid, setIsPhoneValid] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const intlTelInputRef = useRef(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.name.trim()) {
            setStatus('error');
            setErrorMessage('Please enter your name.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(formData.email)) {
            setStatus('error');
            setErrorMessage('Please enter a valid email address.');
            return;
        }

        if (!formData.phone || !isPhoneValid) {
            setStatus('error');
            setErrorMessage('Please enter a valid phone number.');
            return;
        }

        setStatus('loading');
        setErrorMessage('');

        try {
            // DEV MODE: Mock submission because Vite cannot run PHP
            if (import.meta.env.DEV) {
                console.warn("DEV MODE: Mocking PHP submission. Real email sending requires a PHP server.");
                console.log("Form data:", formData);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay

                // Simulate success
                const result = { success: true, message: "Dev Mode: Success! (Email not sent)" };

                if (result.success) {
                    setStatus('success');
                    setFormData({ name: '', email: '', phone: '' });
                    setIsPhoneValid(false);
                    setTimeout(() => {
                        onClose();
                        setTimeout(() => setStatus('idle'), 500);
                    }, 3000);
                }
                return;
            }

            const apiUrl = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${apiUrl}/submit_contact.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone
                }),
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
                setIsPhoneValid(false);
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
                                    <div className="phone-input-wrapper">
                                        <IntlTelInput
                                            ref={intlTelInputRef}
                                            onChangeNumber={(number) => setFormData(prev => ({ ...prev, phone: number }))}
                                            onChangeValidity={setIsPhoneValid}
                                            initOptions={{
                                                initialCountry: "in",
                                                separateDialCode: true,
                                                countrySearch: true,
                                                containerClass: "iti--dark-theme",
                                            }}
                                            inputProps={{
                                                className: "form-input phone-input",
                                                placeholder: "98765 43210",
                                                required: true,
                                                disabled: status === 'loading',
                                            }}
                                            disabled={status === 'loading'}
                                        />
                                    </div>
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
                                        <div className="sending-animation-wrapper">
                                            <div className="music-notes-container">
                                                {/* note-1.svg */}
                                                <svg className="loading-music-note note-1" width="20" height="20" viewBox="0 0 36 36" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M31.68,6.16c-1.92-3.3-10.6-4-11.58-4.09L19,2V22.29a5.88,5.88,0,0,0-.81-.55,8.33,8.33,0,0,0-6.53-.41c-4.12,1.33-6.77,5.13-5.91,8.47a5.33,5.33,0,0,0,2.66,3.32,7.48,7.48,0,0,0,3.61.88A9.54,9.54,0,0,0,15,33.52c3.7-1.19,6.2-4.37,6.06-7.42,0,0,0,0,0,0V8.49c1,.12,2.37.33,3.82.64a11.17,11.17,0,0,1,4.06,1.46c1,.66.38,1.9.33,2a11.8,11.8,0,0,1-1.66,2,1,1,0,0,0,1.33,1.49C29.15,15.85,34.5,11,31.68,6.16Z" />
                                                </svg>
                                                {/* music-note2.svg */}
                                                <svg className="loading-music-note note-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M9 18V5l12-2v13" /><path d="m9 9 12-2" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                                                </svg>
                                                {/* note-last.svg (S-looking note) */}
                                                <svg className="loading-music-note note-3" width="16" height="17" viewBox="0 0 19 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12.5469 15.9125L13.9869 11.5657L16.3343 4.47264L17.6712 3.45898L14.5946 12.6872L13.0294 17.4471L12.5469 15.9125Z" />
                                                    <path d="M13.0285 17.4427C12.0991 18.4764 10.5278 19.1459 9.03769 19.4355C7.53166 19.7289 5.97403 19.7126 4.48166 19.3841C2.88913 19.0337 1.3444 18.2877 0.51286 17.0829C-0.462079 15.6699 0.00149169 14.0695 1.49235 13.0659C2.1107 12.6502 2.80264 12.3619 3.57728 12.192C5.56737 11.7538 7.62953 12.0716 9.37835 12.9543C10.7584 13.6595 11.8214 14.6707 12.5475 15.9081L13.0293 17.4427H13.0285Z" />
                                                    <path d="M16.3253 4.50034C15.2183 5.01752 14.0674 5.02002 12.8929 4.77679C11.7935 4.51789 10.9544 4.13926 9.80496 3.99571C8.06221 3.77818 6.31718 4.32168 5.47122 5.65066C4.95985 4.53733 5.06304 3.31868 6.17151 2.4981C7.27315 1.68254 8.7496 1.43805 10.201 1.46062C10.7116 1.46877 11.1942 1.51265 11.7017 1.55152L13.3967 1.68316C14.0507 1.69633 14.6721 1.65056 15.2874 1.47253C16.0567 1.23871 16.669 0.816819 17.1629 0.263914L18.8245 0L17.6621 3.48794L16.3253 4.5016V4.50034Z" />
                                                    <path d="M12.361 14.9749C12.3359 14.6045 12.342 14.2835 12.2525 13.935C11.999 12.9445 11.2487 12.29 10.2077 11.8011C9.67664 11.5516 9.1372 11.3547 8.56058 11.1811L6.34137 10.5116C5.61604 10.2928 4.94155 10.032 4.28982 9.69602C3.83308 9.46031 3.43628 9.19828 3.08803 8.85976C2.10019 7.9019 2.07743 6.66382 2.66315 5.5367C3.15783 4.58573 4.12291 3.64604 5.09405 2.95898C4.42942 4.13814 4.5144 5.43389 5.54776 6.40993C6.41041 7.24117 7.61827 7.75333 8.81324 8.19152C10.009 8.6297 11.2282 9.04971 12.1682 9.80823C13.804 11.1291 13.2244 12.8881 12.5757 14.4596L12.361 14.9743V14.9749Z" />
                                                </svg>
                                            </div>
                                            <span className="sending-text">SENDING...</span>
                                        </div>
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