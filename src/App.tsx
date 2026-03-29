import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import CartoonBackground from './components/CartoonBackground';
import WelcomeFlow from './components/WelcomeFlow';
import Navbar from './components/Navbar';
import LiveSportsSlots from './features/LiveSportsSlots';
import MITVoice from './features/MITVoice';
import QuickLinks from './features/QuickLinks';
import UpcomingEvents from './features/UpcomingEvents';
import ImportantContacts from './features/ImportantContacts';
import LostFound from './features/LostFound';
import PYQsNotes from './features/PYQsNotes';
import AdminPortal from './features/AdminPortal';
import PersonalizedSpace from './features/PersonalizedSpace';

import type { TabId } from './types';

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('sports');

  // MITVoice state is now managed directly by MITVoice.tsx via backend API

  const renderFeature = () => {
    switch (activeTab) {
      case 'sports':   return <LiveSportsSlots />;
      case 'voice':    return <MITVoice />;
      case 'quicklinks': return <QuickLinks />;
      case 'events':   return <UpcomingEvents />;
      case 'contacts': return <ImportantContacts />;
      case 'lostfound':return <LostFound />;
      case 'pyqs':     return <PYQsNotes />;
      case 'personalized': return <PersonalizedSpace />;
      case 'admin':    return <AdminPortal />;
    }
  };

  return (
    <>
      {/* Fixed cartoon background — always behind everything */}
      <CartoonBackground />

      {/* Welcome Flow — renders on top when active */}
      <AnimatePresence>
        {showWelcome && (
          <WelcomeFlow onComplete={() => setShowWelcome(false)} />
        )}
      </AnimatePresence>

      {/* Main App Shell */}
      <AnimatePresence>
        {!showWelcome && (
          <motion.div
            key="app-shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col"
            style={{ height: '100dvh', overflow: 'hidden' }}
          >
            {/* Sticky Navbar */}
            <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Scrollable content area */}
            <main
              className="flex-1 overflow-y-auto"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  {renderFeature()}
                </motion.div>
              </AnimatePresence>

              {/* Bottom safe-area padding for mobile */}
              <div className="pb-6" />
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
