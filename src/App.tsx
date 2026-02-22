import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import './App.css';
import IntroAnimation from './components/Intro/IntroAnimation';
import ComingSoonContent from './components/ComingSoon/ComingSoonContent';

function App() {
  // Initialize state from session storage
  const [introComplete, setIntroComplete] = useState(() => {
    return !!sessionStorage.getItem('social_impression_intro_shown');
  });

  const [moveLogoToHeader, setMoveLogoToHeader] = useState(() => {
    return !!sessionStorage.getItem('social_impression_content_shown');
  });

  return (
    <>
      <AnimatePresence>
        {!moveLogoToHeader && (
          <IntroAnimation
            onComplete={() => setIntroComplete(true)}
            moveToHeader={moveLogoToHeader}
          />
        )}
      </AnimatePresence>

      {introComplete && (
        <ComingSoonContent
          onSplashComplete={() => setMoveLogoToHeader(true)}
        />
      )}
    </>
  );
}

export default App;
