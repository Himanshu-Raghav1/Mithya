import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import { Bell, Wallet, Target, Lock, AlertCircle } from 'lucide-react';

export default function PersonalizedSpace() {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<'deadline' | 'ur_money' | 'develop_skill'>('deadline');
  const [showReminderPrompt, setShowReminderPrompt] = useState(false);

  // Ask for reminder permissions when they first log in and access this space
  useEffect(() => {
    if (user && !localStorage.getItem('reminders_prompted')) {
      const timer = setTimeout(() => setShowReminderPrompt(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleAllowReminder = () => {
    // In the future, this will trigger the Web Push API Notification.requestPermission()
    localStorage.setItem('reminders_prompted', 'true');
    setShowReminderPrompt(false);
    alert('Notifications enabled!');
  };

  const handleDenyReminder = () => {
    localStorage.setItem('reminders_prompted', 'true');
    setShowReminderPrompt(false);
  };

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto pb-24 relative">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} reason="to access your personalized space" />}

      {/* 🔒 Auth Lock Screen */}
      {!user && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
          <div className="glass-card p-8 max-w-sm w-full space-y-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto border-2 border-blue-500/30">
              <Lock className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-xl font-black text-white">Your Private Space 🔐</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Login to track your academic deadlines, manage your budget, and build skills.
            </p>
            <button
              onClick={() => setShowAuth(true)}
              className="w-full py-3 rounded-xl font-black text-sm text-black bg-blue-400 hover:bg-blue-300 transition-all"
            >
              Login to Access →
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {user && (
        <>
          {/* Header */}
          <div className="glass-card p-6 flex flex-col items-center justify-center text-center gap-2 border border-blue-500/20 bg-blue-500/5">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Your <span className="text-blue-400">Personalized Space</span>
            </h2>
            <p className="text-white/60 text-sm">Organize your assignments, money, and goals.</p>
          </div>

          {/* TABS */}
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 relative overflow-hidden">
            <button
              onClick={() => setActiveTab('deadline')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold z-10 transition-colors ${activeTab === 'deadline' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
            >
              <Bell className="w-4 h-4" /> Deadlines
            </button>
            <button
              onClick={() => setActiveTab('ur_money')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold z-10 transition-colors ${activeTab === 'ur_money' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
            >
              <Wallet className="w-4 h-4" /> Ur Money
            </button>
            <button
              onClick={() => setActiveTab('develop_skill')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold z-10 transition-colors ${activeTab === 'develop_skill' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
            >
              <Target className="w-4 h-4" /> Develop Skill
            </button>

            {/* Tab Indicator Animation */}
            <motion.div
              className="absolute top-1.5 bottom-1.5 w-[calc(33.33%-4px)] rounded-xl z-0"
              style={{ background: 'rgba(255,255,255,0.15)' }}
              animate={{ 
                x: activeTab === 'deadline' ? '2px' : 
                   activeTab === 'ur_money' ? 'calc(100% + 4px)' : 
                   'calc(200% + 6px)' 
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            />
          </div>

          {/* Tab 1: Deadlines */}
          {activeTab === 'deadline' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Upcoming Deadlines</h3>
              <p className="text-white/50 text-sm mb-6">Track your LCA, CCA, Assignments, and Tutorials here.</p>
              
              <div className="p-4 rounded-xl border border-dashed border-white/20 text-center text-white/40">
                Deadline forms and storage tracking currently being built...
              </div>
            </motion.div>
          )}

          {/* Tab 2: Ur Money */}
          {activeTab === 'ur_money' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Ur Money Tracker</h3>
              <div className="p-4 rounded-xl border border-dashed border-white/20 text-center text-white/40">
                Budget planner and expense tracking currently being built...
              </div>
            </motion.div>
          )}

          {/* Tab 3: Develop Skill */}
          {activeTab === 'develop_skill' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4 border border-purple-500/30">
                <Target className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight mb-2">Coming Soon...</h3>
              <p className="text-white/50 text-sm max-w-xs mx-auto">
                A dedicated weekly list strictly for skill development! Stay hungry.
              </p>
            </motion.div>
          )}

          {/* Reminder Popup Modal */}
          {showReminderPrompt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="glass-card w-full max-w-sm p-6 space-y-4 border border-blue-500/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white leading-tight">Allow reminder?</h3>
                </div>
                
                <p className="text-sm text-white/70">
                  Allow reminder for sending alert before assignment, submission deadline, LCA, CCA notification.
                </p>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={handleDenyReminder}
                    className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white/50 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Not Now
                  </button>
                  <button 
                    onClick={handleAllowReminder}
                    className="flex-1 py-2.5 rounded-lg text-sm font-black text-black bg-blue-400 hover:bg-blue-300 transition-colors"
                  >
                    Allow
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
