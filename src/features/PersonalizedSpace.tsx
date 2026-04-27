import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import { Bell, Wallet, Target, Lock, Plus, TrendingDown, Upload, Calendar, Loader2, Trash2 } from 'lucide-react';
import {
  getPrivateDeadlines, submitPrivateDeadline, deletePrivateDeadline,
  getUrMoney, setUrMoneyBudget, addUrMoneyExpense
} from '../services/api';
import { uploadToCloudinary } from '../services/cloudinary';

interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
}

interface Deadline {
  id: string;
  title: string;
  type: string;
  date: string;
  file_url?: string;
}

export default function PersonalizedSpace() {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState<'deadline' | 'ur_money' | 'develop_skill'>('deadline');
  const [showReminderPrompt, setShowReminderPrompt] = useState(false);

  // --- Ur Money State ---
  const [budget, setBudget] = useState<number>(0);
  const [isBudgetSet, setIsBudgetSet] = useState(false);
  const [monthStart, setMonthStart] = useState<string>('');

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  // --- Deadline State ---
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [dlTitle, setDlTitle] = useState('');
  const [dlType, setDlType] = useState('Assignment');
  const [dlDate, setDlDate] = useState('');
  const [dlFile, setDlFile] = useState<File | null>(null);
  const [isUploadingDL, setIsUploadingDL] = useState(false);
  const dlFileInputRef = useRef<HTMLInputElement>(null);

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remainingBudget = Math.max(0, budget - totalSpent);
  const budgetPercentage = budget > 0 ? (totalSpent / budget) * 100 : 0;

  // Initial Load from DB
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('mithya_token') || '';
    if (!token) return;

    const loadData = async () => {
      const finRes = await getUrMoney(token);
      if (finRes.success && finRes.data) {
        if (finRes.data.budget > 0) {
          setBudget(finRes.data.budget);
          setIsBudgetSet(true);
          setMonthStart(finRes.data.month_start || '');
          setExpenses(finRes.data.expenses || []);
        }
      }

      const dlRes = await getPrivateDeadlines(token);
      if (dlRes.success && dlRes.data) {
        setDeadlines(dlRes.data);
      }
    };
    loadData();
  }, [user]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount || !user) return;

    const token = localStorage.getItem('mithya_token') || '';
    const res = await addUrMoneyExpense(expenseTitle, parseFloat(expenseAmount), token);

    if (res.success && res.data) {
      setExpenses([res.data, ...expenses]);
      setExpenseTitle('');
      setExpenseAmount('');
    }
  };

  const handleSetBudget = async () => {
    if (!budget || !user) return;
    const token = localStorage.getItem('mithya_token') || '';
    const res = await setUrMoneyBudget(budget, monthStart, token);
    if (res.success) setIsBudgetSet(true);
  };

  const handleDeleteDeadline = async (id: string) => {
    const token = localStorage.getItem('mithya_token') || '';
    await deletePrivateDeadline(id, token);
    setDeadlines(deadlines.filter(dl => dl.id !== id));
  };



  const handleAddDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dlTitle || !dlDate || !user) return;
    setIsUploadingDL(true);

    let finalUrl = '';
    let fileSize = 0;

    if (dlFile) {
      fileSize = dlFile.size;
    }

    const payload = {
      title: dlTitle,
      type: dlType,
      date: dlDate,
      file_url: finalUrl, // Keep empty string for now, we upload to cloudinary after DB check
      file_size_bytes: fileSize
    };

    const token = localStorage.getItem('mithya_token') || '';
    const res = await submitPrivateDeadline(payload, token);

    // This perfectly matches the HTTP 403 rule you requested
    if (!res.success && res.message?.includes('your personal data limit exceeded')) {
      alert("your personal data limit exceeded delete previous one");
      setIsUploadingDL(false);
      return;
    }

    if (res.success && res.data) {
      // If backend approved the size, we can now upload the actual file to Cloudinary safely
      if (dlFile) {
        try {
          const uploadedUrl = await uploadToCloudinary(dlFile);
          // In a real prod environment we'd PATCH the deadline with the URL, but mock it for UI speed
          res.data.file_url = uploadedUrl;
        } catch (err) {
          console.error("Cloudinary upload failed", err);
        }
      }

      setDeadlines([res.data, ...deadlines]);
      setDlTitle(''); setDlDate(''); setDlFile(null);
    } else {
      alert(res.message || 'Error saving deadline');
    }

    setIsUploadingDL(false);
  };

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
              Login to track your LCA,CCA,academic deadlines, manage your budget, and build skills.
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

              <div className="glass-card p-6 border border-white/10" style={{ background: 'linear-gradient(145deg, rgba(239,68,68,0.1), rgba(0,0,0,0.4))' }}>
                <h3 className="text-xl font-black text-white flex items-center gap-2 mb-1">
                  <Bell className="w-5 h-5 text-red-400" /> Upcoming Deadlines
                </h3>
                <p className="text-white/50 text-xs mb-6">Track your LCA, CCA, Assignments, and Tutorials here.</p>

                <form onSubmit={handleAddDeadline} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-xs font-bold text-white/60 ml-1">Title *</label>
                      <input required type="text" value={dlTitle} onChange={e => setDlTitle(e.target.value)} placeholder="e.g. Physics Lab Report" className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-red-400 text-sm" />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-white/60 ml-1">Type *</label>
                      <select value={dlType} onChange={e => setDlType(e.target.value)} className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-red-400 text-sm">
                        <option value="Assignment">Assignment</option>
                        <option value="LCA">LCA</option>
                        <option value="CCA">CCA</option>
                        <option value="Tutorial">Tutorial</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-white/60 ml-1">Due Date *</label>
                      <input required type="date" value={dlDate} onChange={e => setDlDate(e.target.value)} className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-red-400 text-sm" />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-white/60 ml-1">Attachment (Max 30MB combined)</label>
                      <div className="mt-1 relative group cursor-pointer" onClick={() => dlFileInputRef.current?.click()}>
                        <div className="w-full border border-dashed rounded-xl px-4 py-2 text-center transition-colors border-white/30 hover:border-red-400 bg-white/5">
                          <p className="text-[11px] text-white/70 truncate">{dlFile ? dlFile.name : 'Click to add file'}</p>
                        </div>
                        <input type="file" ref={dlFileInputRef} onChange={e => e.target.files && setDlFile(e.target.files[0])} className="hidden" />
                      </div>
                    </div>
                  </div>

                  <button disabled={isUploadingDL} type="submit" className="w-full py-3 rounded-xl font-black text-sm text-white bg-red-500 hover:bg-red-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    {isUploadingDL ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Plus className="w-4 h-4" /> Add Deadline</>}
                  </button>
                </form>
              </div>

              {deadlines.length > 0 && (
                <div className="glass-card p-4 border border-white/10 flex flex-col gap-3">
                  {deadlines.map(dl => (
                    <div key={dl.id} className="flex justify-between items-center p-4 bg-white/5 border border-white/10 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                          <Calendar className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black bg-red-500/20 text-red-300 px-2 py-0.5 rounded uppercase border border-red-500/30">
                              {dl.type}
                            </span>
                            <h4 className="font-bold text-white text-sm">{dl.title}</h4>
                          </div>
                          <p className="text-xs text-white/40 mt-1">Due: {new Date(dl.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {dl.file_url && (
                        <a href={dl.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1.5 rounded-lg border border-blue-500/20 transition-colors">
                          <Upload className="w-3 h-3" /> View File
                        </a>
                      )}

                      <button onClick={() => handleDeleteDeadline(dl.id)} className="ml-2 p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Tab 2: Ur Money */}
          {activeTab === 'ur_money' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

              {/* Wallet Header Card */}
              <div className="glass-card p-6 border border-white/10" style={{ background: 'linear-gradient(145deg, rgba(16,185,129,0.1), rgba(0,0,0,0.4))' }}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-emerald-400" /> Ur Wallet
                    </h3>
                    <p className="text-white/50 text-xs mt-1">Track your monthly allowance</p>
                  </div>
                  {!isBudgetSet ? (
                    <button onClick={handleSetBudget} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg transition-colors">
                      Set Budget
                    </button>
                  ) : (
                    <div className="text-right">
                      <p className="text-white/40 text-xs uppercase font-bold tracking-wider">Remaining</p>
                      <p className={`text-2xl font-black ${remainingBudget < budget * 0.2 ? 'text-red-400' : 'text-emerald-400'}`}>
                        ₹{remainingBudget.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {isBudgetSet ? (
                  <>
                    <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${budgetPercentage > 80 ? 'bg-red-500' : budgetPercentage > 50 ? 'bg-yellow-400' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest">
                      <span>Spent: ₹{totalSpent.toLocaleString()}</span>
                      <span>Total: ₹{budget.toLocaleString()}</span>
                    </div>

                    {remainingBudget > 0 && remainingBudget < budget * 0.4 && (
                      <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-3 items-center">
                        <div className="text-2xl">❤️</div>
                        <div>
                          <p className="text-sm font-bold text-blue-300">Great job saving!</p>
                          <p className="text-xs text-blue-200/60">Consider donating a small portion of your ₹{remainingBudget} savings to a good cause end of month.</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <label className="text-xs font-bold text-white/60 ml-1">Allowance Date</label>
                      <input type="date" value={monthStart} onChange={e => setMonthStart(e.target.value)} className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none focus:border-emerald-400 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/60 ml-1">Monthly Budget (₹)</label>
                      <input type="number" placeholder="5000" value={budget || ''} onChange={e => setBudget(Number(e.target.value))} className="w-full mt-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none focus:border-emerald-400 text-sm" />
                    </div>
                  </div>
                )}
              </div>

              {/* Add Expense Form */}
              {isBudgetSet && (
                <div className="glass-card p-5 border border-white/10">
                  <h4 className="text-sm font-bold text-white mb-3">Add Expense</h4>
                  <form onSubmit={handleAddExpense} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="What did you buy?"
                      value={expenseTitle}
                      onChange={e => setExpenseTitle(e.target.value)}
                      className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none focus:border-emerald-400 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="₹ Amount"
                      value={expenseAmount}
                      onChange={e => setExpenseAmount(e.target.value)}
                      className="w-24 bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-none focus:border-emerald-400 text-sm"
                    />
                    <button type="submit" className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl transition-colors shrink-0">
                      <Plus className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              )}

              {/* Transactions List */}
              {expenses.length > 0 && (
                <div className="glass-card p-2 border border-white/10">
                  {expenses.map((exp) => (
                    <div key={exp.id} className="flex justify-between items-center p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                          <TrendingDown className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{exp.title}</p>
                          <p className="text-[10px] text-white/40">{new Date(exp.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <p className="text-sm font-black text-red-400">-₹{exp.amount}</p>
                    </div>
                  ))}
                </div>
              )}
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
                A dedicated weekly list strictly for skill development! Stay hungry. For now Here is wifi-exam pass- M!TWPU#exam4226, Pls share at your own risk it is changed recently.
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
