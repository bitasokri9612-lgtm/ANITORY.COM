import React from 'react';
import { Home, BookOpen, PenTool, LayoutDashboard, User } from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  onNavigate: (page: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  const navItem = (page: string, icon: React.ReactNode, label: string) => {
    const isActive = currentView === page;
    return (
      <button
        onClick={() => onNavigate(page)}
        className={`flex flex-col items-center justify-center w-full h-full pt-2 pb-safe transition-colors ${
          isActive ? 'text-primary' : 'text-stone-400 hover:text-stone-600'
        }`}
      >
        <div className={`p-1 rounded-full mb-0.5 ${isActive ? 'bg-orange-50' : ''}`}>
          {icon}
        </div>
        <span className="text-[10px] font-medium leading-none">{label}</span>
      </button>
    );
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-200 z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] h-16">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto">
        {navItem('home', <Home className="w-5 h-5" />, 'Home')}
        {navItem('feed', <BookOpen className="w-5 h-5" />, 'Stories')}
        {navItem('create', <PenTool className="w-5 h-5" />, 'Write')}
        {navItem('dashboard', <LayoutDashboard className="w-5 h-5" />, 'Dash')}
        {navItem('profile', <User className="w-5 h-5" />, 'Profile')}
      </div>
    </nav>
  );
};

export default BottomNav;