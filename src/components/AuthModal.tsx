import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, KeyRound, User, Loader2, Shuffle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sendOtp, verifyOtp, setAnonName as apiSetAnonName, signInWithGoogle } from '../services/authApi';

const FUN_NAMES = [
  'StormWatcher', 'CafePhilosopher', 'MysticOwl', 'TechNinja',
  'SilentHawk', 'CodeBreaker', 'StarGazer', 'MidnightCoder',
  'NeonWalker', 'QuietStorm', 'ByteWizard', 'SonicMind',
  'RedPanda42', 'CryptoSage', 'IronLogic', 'VoidHunter',
];

type Stage = 'email' | 'otp' | 'choose-name';

interface AuthModalProps {
  onClose: () => void;
  reason?: string; // why auth is required, e.g. "to post in MITVoice"
}

export default function AuthModal({ onClose, reason }: AuthModalProps) {
  const { user, login } = useAuth();

  const [stage, setStage] = useState<Stage>(user?.needsAnonName ? 'choose-name' : 'email');
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
    let finalEmail = email.trim().toLowerCase();

    // Basic email format check
    if (!finalEmail.includes('@') || !finalEmail.includes('.')) {
      return setError('Please enter a valid email address (e.g. yourname@gmail.com)');
    }

    setIsLoading(true);
    try {
      const res = await sendOtp(finalEmail);
      if (!res.success) return setError(res.message);
      setStage('otp');
    } catch (err: any) { 
      console.error(err);
      setError(err?.message || 'Network error connecting to Supabase. Check your browser connection.'); 
    }
    finally { setIsLoading(false); }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const res = await signInWithGoogle();
      if (!res.success) return setError(res.message);
    } catch (err: any) {
      console.error(err);
      setError('Failed to initialize Google Login.');
    }
    finally { setIsLoading(false); }
  };

  const handleVerify = async () => {
    setError('');
    if (!otp.trim()) return setError('Enter the OTP from your email');
    setIsLoading(true);
    try {
      const res = await verifyOtp(email, otp);
      if (!res.success || !res.token) return setError(res.message || 'Login failed, please try again.');
      
      if (res.needsAnonName) {
        setStage('choose-name');
        return;
      }
      
      login(res.token);
      onClose();
    } catch (err: any) { 
      console.error(err);
      setError(err?.message || 'Network error. Please try again.'); 
    }
    finally { setIsLoading(false); }
  };

  const handleSetName = async () => {
    setError('');
    if (!anonName.trim()) return setError('Choose an anonymous username');
    setIsLoading(true);
    try {
      const res = await apiSetAnonName(anonName);
      if (!res.success || !res.token) return setError(res.message || 'Failed to set anonymous name');
      login(res.token);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Network error. Please try again.');
    }
    finally { setIsLoading(false); }
  };

  const modalContent = (
    <AnimatePresence>
      {/* Portal renders this DIRECTLY on document.body — bypasses ALL parent transforms */}
      <motion.div
        key="auth-overlay"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Animated blurred backdrop */}
        <motion.div
          className="absolute inset-0"
          initial={{ backdropFilter: 'blur(0px)', backgroundColor: 'rgba(0,0,0,0)' }}
          animate={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.65)' }}
          exit={{ backdropFilter: 'blur(0px)', backgroundColor: 'rgba(0,0,0,0)' }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
        />

        {/* Modal Card */}
        <motion.div
          key="auth-card"
          className="relative w-full z-10 overflow-hidden"
          style={{
            maxWidth: '400px',
            borderRadius: '24px',
            background: 'linear-gradient(145deg, rgba(10,14,50,0.98) 0%, rgba(5,8,30,0.98) 100%)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,215,64,0.08), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
          initial={{ scale: 0.85, y: 40, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28, mass: 0.8 }}
        >
          {/* Decorative glow ring at top */}
          <div style={{
            position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
            width: '200px', height: '120px',
            background: 'radial-gradient(ellipse, rgba(255,215,64,0.15) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          {/* Animated top accent line */}
          <motion.div
            style={{ height: '3px', background: 'linear-gradient(90deg, transparent, #FFD740, #00A8E8, transparent)' }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          />

          <div className="p-7">
            {/* Close button (Hide if forced to choose name) */}
            {!user?.needsAnonName && (
            <motion.button
              onClick={onClose}
              className="absolute top-5 right-5 text-white/30 hover:text-white/80 transition-colors"
              whileHover={{ scale: 1.2, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
            )}

            {/* Logo row */}
            <motion.div
              className="flex items-center gap-3 mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px', overflow: 'hidden',
                border: '1.5px solid rgba(255,215,64,0.3)',
                boxShadow: '0 0 12px rgba(255,215,64,0.2)'
              }}>
                <img src="/logo.png" alt="Mithya" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => (e.currentTarget.style.display = 'none')} />
              </div>
              <div>
                <div style={{
                  fontWeight: 900, letterSpacing: '0.15em', fontSize: '15px',
                  background: 'linear-gradient(135deg, #FFD740, #ffffff)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>MITHYA</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>MIT-WPU Community</div>
              </div>
            </motion.div>

            {/* ── Stage: Email ── */}
            <AnimatePresence mode="wait">
              {stage === 'email' && (
                <motion.div
                  key="email-stage"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'white', lineHeight: 1.2 }}>
                      Sign in to Mithya 👋
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '12px', marginTop: '6px', fontStyle: 'italic' }}>
                      Sorry yaar, spammers se bachne ke liye karna padega 🙏
                    </p>
                    {reason && (
                      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', marginTop: '6px' }}>
                        Required <span style={{ color: '#FFD740' }}>{reason}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: '8px' }}>
                      <Mail className="w-3 h-3" /> Your Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                      placeholder="yourname@gmail.com"
                      autoFocus
                      style={{
                        width: '100%', padding: '13px 16px', borderRadius: '14px',
                        background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '14px',
                        border: '1.5px solid rgba(255,255,255,0.1)', outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => e.target.style.borderColor = 'rgba(0,168,232,0.6)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>

                  {error && (
                    <motion.p
                      key={error}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ color: '#f87171', fontSize: '12px', fontWeight: 700 }}
                    >{error}</motion.p>
                  )}

                  <motion.button
                    onClick={handleSendOtp}
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      width: '100%', padding: '14px', borderRadius: '14px',
                      fontWeight: 900, fontSize: '14px', color: '#000',
                      background: 'linear-gradient(135deg, #FFD740, #FFA000)',
                      border: 'none', cursor: 'pointer', opacity: isLoading ? 0.6 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: '0 4px 20px rgba(255,215,64,0.3)',
                    }}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue with Email OTP →'}
                  </motion.button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                  </div>

                  <motion.button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      width: '100%', padding: '14px', borderRadius: '14px',
                      fontWeight: 900, fontSize: '14px', color: 'white',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', opacity: isLoading ? 0.6 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <>
                        <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                      </>
                    )}
                  </motion.button>

                  <p style={{ textAlign: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '16px' }}>
                    No passwords required. Secure login via Supabase.
                  </p>
                </motion.div>
              )}

              {/* ── Stage: OTP ── */}
              {stage === 'otp' && (
                <motion.div
                  key="otp-returning-stage"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'white', lineHeight: 1.2 }}>
                      Verify its you 👾
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginTop: '6px' }}>
                      OTP sent to <span style={{ color: '#93c5fd' }}>{email}</span>
                    </p>
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginBottom: '8px' }}>
                      <KeyRound className="w-3 h-3" /> Enter OTP
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onKeyDown={e => e.key === 'Enter' && handleVerify()}
                      placeholder="• • • • • •"
                      inputMode="numeric"
                      maxLength={6}
                      autoFocus
                      style={{
                        width: '100%', padding: '13px 16px', borderRadius: '14px',
                        background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '22px',
                        border: '1.5px solid rgba(255,255,255,0.1)', outline: 'none',
                        textAlign: 'center', fontWeight: 900, letterSpacing: '0.4em',
                      }}
                      onFocus={e => e.target.style.borderColor = 'rgba(74,222,128,0.6)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>

                  {error && (
                    <motion.p key={error} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                      style={{ color: '#f87171', fontSize: '12px', fontWeight: 700 }}>{error}</motion.p>
                  )}

                  <motion.button
                    onClick={handleVerify} disabled={isLoading}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    style={{
                      width: '100%', padding: '14px', borderRadius: '14px',
                      fontWeight: 900, fontSize: '14px', color: '#000',
                      background: 'linear-gradient(135deg, #FFD740, #FFA000)',
                      border: 'none', cursor: 'pointer', opacity: isLoading ? 0.6 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: '0 4px 20px rgba(255,215,64,0.3)',
                    }}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enter Mithya →'}
                  </motion.button>

                  <button onClick={() => setStage('email')}
                    style={{ width: '100%', color: 'rgba(255,255,255,0.3)', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}>
                    ← Back to email
                  </button>
                </motion.div>
              )}

              {/* ── Stage: Choose Name ── */}
              {stage === 'choose-name' && (
                <motion.div
                  key="choose-name-stage"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'white', lineHeight: 1.2 }}>
                      Create your identity ✨
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginTop: '6px' }}>
                      Pick an anonymous alias for MITVoice.
                    </p>
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#FFD740', marginBottom: '8px' }}>
                      <User className="w-3 h-3" /> Choose Anonymous Username
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={anonName}
                        onChange={e => setAnonName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSetName()}
                        placeholder="e.g. StormWatcher42"
                        maxLength={20}
                        autoFocus
                        style={{
                          flex: 1, padding: '13px 16px', borderRadius: '14px',
                          background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '14px',
                          border: '1.5px solid rgba(255,215,64,0.25)', outline: 'none',
                        }}
                        onFocus={e => e.target.style.borderColor = 'rgba(255,215,64,0.6)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,215,64,0.25)'}
                      />
                      <motion.button
                        onClick={randomName}
                        whileHover={{ scale: 1.1, rotate: 180 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          padding: '13px', borderRadius: '14px',
                          background: 'rgba(255,215,64,0.1)', color: 'rgba(255,215,64,0.7)',
                          border: '1px solid rgba(255,215,64,0.2)', cursor: 'pointer'
                        }}
                        title="Random name"
                      >
                        <Shuffle className="w-4 h-4" />
                      </motion.button>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px', marginTop: '6px' }}>
                      Your anonymous identity on MITVoice. 3–20 chars.
                    </p>
                  </div>

                  {error && (
                    <motion.p key={error} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                      style={{ color: '#f87171', fontSize: '12px', fontWeight: 700 }}>{error}</motion.p>
                  )}

                  <motion.button
                    onClick={handleSetName} disabled={isLoading}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    style={{
                      width: '100%', padding: '14px', borderRadius: '14px',
                      fontWeight: 900, fontSize: '14px', color: '#000',
                      background: 'linear-gradient(135deg, #FFD740, #FFA000)',
                      border: 'none', cursor: 'pointer', opacity: isLoading ? 0.6 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: '0 4px 20px rgba(255,215,64,0.3)',
                    }}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join Mithya 🚀'}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}


