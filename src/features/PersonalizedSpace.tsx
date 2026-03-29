import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import { Bell, Wallet, Target, Lock, Plus, TrendingDown } from 'lucide-react';

interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
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

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remainingBudget = Math.max(0, budget - totalSpent);
  const budgetPercentage = budget > 0 ? (totalSpent / budget) * 100 : 0;

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount) return;
    
    const newExp: Expense = {
      id: Math.random().toString(36).substr(2, 9),
      title: expenseTitle,
      amount: parseFloat(expenseAmount),
      date: new Date().toISOString()
    };
    
    setExpenses([newExp, ...expenses]);
    setExpenseTitle('');
    setExpenseAmount('');
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
                    <button onClick={() => setIsBudgetSet(true)} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg transition-colors">
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
