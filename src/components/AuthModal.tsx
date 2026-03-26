import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, KeyRound, User, Loader2, Shuffle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sendOtp, verifyOtp } from '../services/authApi';

const FUN_NAMES = [
  'StormWatcher', 'CafePhilosopher', 'MysticOwl', 'TechNinja',
  'SilentHawk', 'CodeBreaker', 'StarGazer', 'MidnightCoder',
  'NeonWalker', 'QuietStorm', 'ByteWizard', 'SonicMind',
  'RedPanda42', 'CryptoSage', 'IronLogic', 'VoidHunter',
];

type Stage = 'email' | 'otp-new' | 'otp-returning';

interface AuthModalProps {
  onClose: () => void;
  reason?: string; // why auth is required, e.g. "to post in MITVoice"
}

export default function AuthModal({ onClose, reason }: AuthModalProps) {
  const { login } = useAuth();

  const [stage, setStage] = useState<Stage>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [anonName, setAnonName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const randomName = () => {
    const base = FUN_NAMES[Math.floor(Math.random() * FUN_NAMES.length)];
    const num  = Math.floor(10 + Math.random() * 90);
    setAnonName(`${base}${num}`);
  };

  const handleSendOtp = async () => {
    setError('');
    if (!email.trim()) return setError('Please enter your email');
    if (!email.endsWith('@mitwpu.edu.in')) return setError('Only @mitwpu.edu.in emails are allowed');
    setIsLoading(true);
    try {
      const res = await sendOtp(email.trim().toLowerCase());
      if (!res.success) return setError(res.message);
      setStage(res.is_new ? 'otp-new' : 'otp-returning');
    } catch { setError('Network error. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const handleVerify = async () => {
    setError('');
    if (!otp.trim()) return setError('Enter the OTP from your email');
    if (stage === 'otp-new' && !anonName.trim()) return setError('Choose an anonymous username');
    setIsLoading(true);
    try {
      const res = await verifyOtp(email, otp, stage === 'otp-new' ? anonName : undefined);
      if (!res.success) return setError(res.message);
      login(res.token);
      onClose();
    } catch { setError('Network error. Please try again.'); }
    finally { setIsLoading(false); }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Card */}
        <motion.div
          className="relative glass-card w-full max-w-sm p-6 z-10"
          initial={{ scale: 0.9, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{ background: 'rgba(10,14,40,0.95)', border: '1.5px solid rgba(255,255,255,0.15)' }}
        >
          {/* Close */}
          <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>

          {/* Logo row */}
          <div className="flex items-center gap-2 mb-1">
            <img src="/logo.png" alt="Mithya" className="w-8 h-8 rounded-full" onError={e => e.currentTarget.style.display='none'} />
            <span className="text-white font-black tracking-widest text-sm">MITHYA</span>
          </div>

          {/* ── Stage: Email ──────────────────────────────── */}
          {stage === 'email' && (
            <div className="space-y-4 mt-4">
              <div>
                <h2 className="text-xl font-black text-white">Sign in to Mithya 👋</h2>
                {reason && (
                  <p className="text-white/50 text-xs mt-1">Auth required <span className="text-yellow-400">{reason}</span></p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-white/50 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> MIT-WPU Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                  placeholder="yourname@mitwpu.edu.in"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 outline-none focus:border-blue-400 transition-colors text-sm"
                />
              </div>

              {error && <p className="text-red-400 text-xs font-bold">{error}</p>}

              <button
                onClick={handleSendOtp}
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-black text-sm text-black bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send OTP →'}
              </button>

              <p className="text-center text-[10px] text-white/30">
                Only MIT-WPU students can join. No password needed.
              </p>
            </div>
          )}

          {/* ── Stage: OTP (New user) ─────────────────────── */}
          {stage === 'otp-new' && (
            <div className="space-y-4 mt-4">
              <div>
                <h2 className="text-xl font-black text-white">Create your identity ✨</h2>
                <p className="text-white/50 text-xs mt-1">OTP sent to <span className="text-blue-300">{email}</span></p>
              </div>

              {/* Anonymous name */}
              <div>
                <label className="text-xs font-bold text-yellow-300 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3" /> Choose Anonymous Username
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={anonName}
                    onChange={e => setAnonName(e.target.value)}
                    placeholder="e.g. StormWatcher42"
                    maxLength={20}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 outline-none focus:border-yellow-400 transition-colors text-sm"
                  />
                  <button
                    onClick={randomName}
                    className="p-3 rounded-xl bg-white/10 hover:bg-yellow-400/20 text-white/60 hover:text-yellow-300 transition-colors"
                    title="Random suggestion"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-white/30 text-[10px] mt-1">
                  This is your Mithya identity — visible on MITVoice. 3–20 chars, no spaces.
                </p>
              </div>

              {/* OTP */}
              <div>
                <label className="text-xs font-bold text-white/50 mb-1 flex items-center gap-1">
                  <KeyRound className="w-3 h-3" /> OTP (check your MIT email)
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && handleVerify()}
                  placeholder="6-digit code"
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 outline-none focus:border-green-400 tracking-widest text-center text-xl font-black"
                />
              </div>

              {error && <p className="text-red-400 text-xs font-bold">{error}</p>}

              <button
                onClick={handleVerify}
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-black text-sm text-black bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join Mithya 🚀'}
              </button>

              <button onClick={() => setStage('email')} className="w-full text-white/30 text-xs hover:text-white/60">
                ← Back
              </button>
            </div>
          )}

          {/* ── Stage: OTP (Returning user) ───────────────── */}
          {stage === 'otp-returning' && (
            <div className="space-y-4 mt-4">
              <div>
                <h2 className="text-xl font-black text-white">Welcome back! 👾</h2>
                <p className="text-white/50 text-xs mt-1">OTP sent to <span className="text-blue-300">{email}</span></p>
              </div>

              <div>
                <label className="text-xs font-bold text-white/50 mb-1 flex items-center gap-1">
                  <KeyRound className="w-3 h-3" /> Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && handleVerify()}
                  placeholder="6-digit code"
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 outline-none focus:border-green-400 tracking-widest text-center text-xl font-black"
                />
              </div>

              {error && <p className="text-red-400 text-xs font-bold">{error}</p>}

              <button
                onClick={handleVerify}
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-black text-sm text-black bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enter Mithya →'}
              </button>

              <button onClick={() => setStage('email')} className="w-full text-white/30 text-xs hover:text-white/60">
                ← Back
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
