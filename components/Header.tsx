import React from 'react';
import { BookOpen, PenTool, Home, LayoutDashboard, Shield, User as UserIcon } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  user: UserProfile;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentPage, user }) => {
  const navItemClass = (page: string) => `
    flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer
    ${currentPage === page 
      ? 'bg-stone-100 text-primary' 
      : 'text-stone-600 hover:text-primary hover:bg-stone-50'}
  `;

  return (
    <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur-sm border-b border-stone-200 shadow-sm transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div 
            className="flex items-center cursor-pointer group" 
            onClick={() => onNavigate('home')}
          >
            <BookOpen className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
            <div className="ml-2 flex items-baseline">
               <span className="text-xl font-serif font-bold text-ink tracking-tight">Anitory</span>
               <div className="ml-1.5 flex items-center gap-1 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-100">
                 <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                 <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Live</span>
               </div>
            </div>
          </div>
          
          <nav className="flex items-center gap-1 md:gap-2">
            {/* Desktop Navigation */}
            <button onClick={() => onNavigate('home')} className={`hidden md:flex ${navItemClass('home')}`}>
              <Home className="w-4 h-4 mr-1.5" />
              Home
            </button>
            
            <button onClick={() => onNavigate('feed')} className={`hidden md:flex ${navItemClass('feed')}`}>
              <BookOpen className="w-4 h-4 mr-1.5" />
              Stories
            </button>

            <button onClick={() => onNavigate('dashboard')} className={`hidden md:flex ${navItemClass('dashboard')}`}>
              <LayoutDashboard className="w-4 h-4 mr-1.5" />
              Dashboard
            </button>

            {user.role === 'admin' && (
              <button onClick={() => onNavigate('admin')} className={`hidden md:flex ${navItemClass('admin')}`}>
                <Shield className="w-4 h-4 mr-1.5" />
                Admin
              </button>
            )}

            <div className="hidden md:block h-6 w-px bg-stone-200 mx-2"></div>

            <button 
              onClick={() => onNavigate('create')}
              className="hidden sm:flex items-center px-4 py-1.5 bg-primary text-white rounded-full text-sm font-medium hover:bg-orange-700 transition-all shadow-sm mx-2"
            >
              <PenTool className="w-3.5 h-3.5 mr-1.5" />
              Write
            </button>

            {/* Mobile Admin Icon */}
            {user.role === 'admin' && (
              <button 
                onClick={() => onNavigate('admin')}
                className={`md:hidden p-2 rounded-full mr-1 ${currentPage === 'admin' ? 'text-primary bg-stone-100' : 'text-stone-500'}`}
                title="Admin Panel"
              >
                <Shield className="w-5 h-5" />
              </button>
            )}

            <button 
              onClick={() => onNavigate('profile')}
              className="ml-1 sm:ml-2 flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 border border-stone-200 overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
              title="Your Profile"
            >
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;