import { motion } from 'framer-motion';
import { CalendarDays, FileText, Calendar, AlertTriangle, Link as LinkIcon, ExternalLink } from 'lucide-react';

export default function QuickLinks() {
  const links = [
    {
      title: "Academic Calendar",
      desc: "AY 2025-26",
      icon: <CalendarDays className="w-6 h-6 text-white" />,
      url: "https://mitwpu.edu.in/uploads/images/Academic-calendar-AY-2025-26.pdf",
      color: ["#00A8E8", "#0077B6"]
    },
    {
      title: "Official Holidays",
      desc: "List of Holidays",
      icon: <Calendar className="w-6 h-6 text-white" />,
      url: "https://mitwpu.edu.in/academics/list-of-holidays",
      color: ["#4CAF50", "#2E7D32"]
    },
    {
      title: "Event Calendar",
      desc: "College Events",
      icon: <FileText className="w-6 h-6 text-white" />,
      url: "https://mitwpu.edu.in/life-wpu/event-calendar",
      color: ["#FF9800", "#F57C00"]
    },
    {
      title: "Online Grievance",
      desc: "Submit Form",
      icon: <AlertTriangle className="w-6 h-6 text-white" />,
      url: "https://docs.google.com/forms/d/e/1FAIpQLSeT1_1hwZxzruBy5VScX8ofi1zmOB7PazriurV1UGKprpADWQ/viewform",
      color: ["#E53935", "#C62828"]
    }
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5" style={{ background: 'rgba(0,168,232,0.12)' }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #00A8E8, #0077B6)' }}>
          <LinkIcon className="w-8 h-8 text-white" />
        </div>
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-black text-white">Important Quick Links</h2>
          <p className="text-blue-200 text-sm mt-1 font-semibold">
            One-tap access to all crucial MIT-WPU resources. No more digging through the college website to find what you need!
          </p>
        </div>
      </div>

      {/* Grid of Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {links.map((link, i) => (
          <motion.a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="glass-card p-5 outline-none flex items-center gap-4 hover:shadow-lg hover:shadow-white/5 transition-all group"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110" style={{ background: `linear-gradient(135deg, ${link.color[0]}, ${link.color[1]})` }}>
              {link.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-white font-black text-base flex items-center gap-2">
                {link.title}
                <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
              </h3>
              <p className="text-white/50 text-xs font-semibold mt-0.5">{link.desc}</p>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
