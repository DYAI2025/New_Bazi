import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Moon, 
  Sun, 
  Compass, 
  Columns, 
  Flame, 
  Users, 
  Activity, 
  BookOpen, 
  Settings, 
  LayoutDashboard
} from "lucide-react";

interface PageShellProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hasBirthData: boolean;
  headerSlot?: React.ReactNode;
}

export default function PageShell({ children, activeTab, setActiveTab, hasBirthData, headerSlot }: PageShellProps) {
  const [themeMode, setThemeMode] = React.useState<"dark" | "light">("dark");

  React.useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (themeMode === "light") {
      root.setAttribute("data-theme", "light");
      root.classList.add("light");
      body.classList.add("light");
    } else {
      root.setAttribute("data-theme", "dark");
      root.classList.remove("light");
      body.classList.remove("light");
    }
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode(prev => prev === "dark" ? "light" : "dark");
  };

  const navItems = [
    { id: "input", label: "Geburtsdaten", icon: Settings },
    { id: "overview", label: "Übersicht", icon: LayoutDashboard, disabled: !hasBirthData },
    { id: "western", label: "Western Zodiak", icon: Compass, disabled: !hasBirthData },
    { id: "bazi", label: "BaZi Säulen", icon: Columns, disabled: !hasBirthData },
    { id: "wuxing", label: "Wu Xing", icon: Flame, disabled: !hasBirthData },
    { id: "fusion", label: "Signatur", icon: Sparkles, disabled: !hasBirthData },
    { id: "daily", label: "Tagespuls", icon: Activity, disabled: !hasBirthData },
    { id: "synastry", label: "Synastrie", icon: Users, disabled: !hasBirthData },
    { id: "methode", label: "Methodik", icon: BookOpen },
  ];

  return (
    <div id="app-root" className={`min-h-screen relative flex flex-col transition-colors duration-500 font-sans ${themeMode === "light" ? "bg-stone-100 text-stone-900" : "bg-obsidian-deep text-[#E0D8D0]"}`}>
      
      {/* Cosmical Starfield Layer */}
      <div className={`absolute inset-0 pointer-events-none starfield-bg opacity-25 mix-blend-screen transition-opacity print:hidden ${themeMode === "light" ? "hidden" : "block"}`} />
      
      {/* Background radial gradient glow matching the Sophisticated Dark design */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-700 opacity-45 print:hidden"
        style={{
          background: themeMode === "dark" 
            ? "radial-gradient(circle at 50% 0%, #1a1510 0%, transparent 70%), radial-gradient(circle at 10% 80%, #0d0d1a 0%, transparent 50%)"
            : "radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.08) 0%, transparent 70%), radial-gradient(circle at 10% 80%, rgba(13, 13, 26, 0.04) 0%, transparent 50%)"
        }}
      />

      {/* Header bar */}
      <header id="global-header" className={`relative z-20 border-b transition-colors duration-300 print:hidden ${themeMode === "light" ? "bg-white/80 border-stone-200/60" : "bg-black/40 border-gold-muted/20"} backdrop-blur-md sticky top-0`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Brand Title */}
          <div className="flex flex-col select-none cursor-pointer" onClick={() => setActiveTab("input")}>
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-gold-muted animate-pulse" />
              <span className="font-serif font-bold text-2xl tracking-widest bg-gradient-to-r from-gold-light via-gold-muted to-gold-dark bg-clip-text text-transparent transform hover:scale-105 transition-transform duration-300">
                BAZODIAC
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded-full border border-gold-muted/30 text-gold-muted bg-gold-muted/5 font-medium tracking-wider">
                FUFIRE v1.2
              </span>
            </div>
            <p className="font-sans text-[10px] uppercase font-semibold text-stone-400 tracking-wider">
              Westliche Astrologie × BaZi × WuXing
            </p>
          </div>

          {/* Header slot (AccountMenu) + Theme toggle */}
          <div className="flex items-center space-x-3">
            {headerSlot}
            <button
              id="theme-toggle"
              onClick={toggleTheme}
              className={`p-2.5 rounded-full border transition-all duration-300 transform active:scale-95 flex items-center justify-center ${
                themeMode === "light" 
                  ? "bg-stone-200/50 border-stone-300 hover:bg-stone-200 text-stone-800 hover:shadow" 
                  : "bg-obsidian-card/40 border-gold-muted/20 hover:border-gold-muted/50 text-gold-muted hover:glow-gold"
              }`}
              title={themeMode === "light" ? "Zu Planetarium-Noir wechseln" : "Zu Solar-Aura wechseln"}
            >
              {themeMode === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {/* Navigation bar items */}
        <div className={`border-t ${themeMode === "light" ? "border-stone-200/40 bg-stone-50" : "border-gold-muted/10 bg-obsidian-deep/40"} overflow-x-auto`}>
          <div className="max-w-7xl mx-auto px-4 flex space-x-1 sm:space-x-2 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  disabled={item.disabled}
                  onClick={() => !item.disabled && setActiveTab(item.id)}
                  className={`relative flex items-center space-x-2 px-3.5 py-2.5 rounded-lg text-xs font-medium tracking-wide transition-all duration-300 shrink-0 select-none ${
                    item.disabled 
                      ? "opacity-35 cursor-not-allowed text-stone-500" 
                      : isActive 
                        ? themeMode === "light"
                          ? "bg-stone-900 text-white shadow-md font-semibold"
                          : "bg-gold-muted/10 text-gold-light font-semibold border-b-2 border-gold-muted"
                        : themeMode === "light" 
                          ? "text-stone-600 hover:bg-stone-200/60 hover:text-stone-900" 
                          : "text-stone-400 hover:bg-obsidian-card/55 hover:text-gold-light border border-transparent hover:border-gold-muted/10"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-gold-muted" : "opacity-70"}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-gold-muted rounded-full pointer-events-none"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main id="main-content" className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Signature Bar */}
      <footer id="global-footer" className={`relative z-20 py-6 border-t font-mono text-center text-[10px] tracking-widest transition-colors duration-300 print:hidden ${
        themeMode === "light" ? "bg-stone-200/40 border-stone-200 text-stone-500" : "bg-black/20 border-white/5 text-stone-400 opacity-60"
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
          <div>
            <span>© 2026 BAZODIAC</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>HARMONIE-CHECK: PASS</span>
            <span>EDITION: V 4.0.2 OBSIDIAN</span>
          </div>
          <div>
            <span>BERECHNET · NICHT BEHAUPTET</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
