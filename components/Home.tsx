import React from 'react';
import { Story } from '../types';
import StoryCard from './StoryCard';
import { ArrowRight, Sparkles, Youtube } from 'lucide-react';

interface HomeProps {
  featuredStories: Story[];
  onNavigate: (page: string) => void;
  onStoryClick: (id: string) => void;
}

const Home: React.FC<HomeProps> = ({ featuredStories, onNavigate, onStoryClick }) => {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#f8f5f1] py-20 lg:py-28">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-secondary/5 rounded-full blur-3xl"></div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-stone-200 text-xs font-bold text-primary tracking-widest uppercase mb-6 shadow-sm">
            <Sparkles className="w-3 h-3 mr-2" />
            Share Your Journey
          </span>
          <h1 className="text-5xl md:text-7xl font-serif font-black text-ink mb-8 leading-tight">
            Every life is a <br/>
            <span className="text-primary relative inline-block">
              story waiting.
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                 <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
              </svg>
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-stone-600 max-w-2xl mx-auto font-sans leading-relaxed mb-10">
            Anitory is the sanctuary for real-life experiences. From the mundane to the extraordinary, read and write stories that connect us all.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => onNavigate('create')}
              className="px-8 py-4 bg-ink text-white rounded-full font-bold text-lg hover:bg-stone-800 hover:scale-105 transition-all shadow-lg flex items-center justify-center"
            >
              Start Writing
            </button>
            <button 
              onClick={() => onNavigate('feed')}
              className="px-8 py-4 bg-white text-ink border border-stone-200 rounded-full font-bold text-lg hover:bg-stone-50 hover:border-primary/30 transition-all shadow-sm flex items-center justify-center"
            >
              Explore Stories
            </button>
          </div>
        </div>
      </section>

      {/* YouTube Animation Notice Banner */}
      <section className="max-w-5xl mx-auto px-4 -mt-8 relative z-20 mb-12">
        <div className="bg-white border-2 border-red-50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-red-500/5">
           <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
              <div className="bg-red-50 p-4 rounded-full text-red-600 flex-shrink-0">
                 <Youtube className="w-8 h-8" />
              </div>
              <div>
                 <h3 className="text-lg md:text-xl font-bold text-ink mb-1">Get Your Story Animated!</h3>
                 <p className="text-stone-600 max-w-md leading-snug">
                   We select the best story and create an animation video on it and upload it to YouTube.
                 </p>
              </div>
           </div>
           <button 
             onClick={() => onNavigate('create')}
             className="px-6 py-3 bg-red-600 text-white rounded-full font-bold text-sm hover:bg-red-700 transition-colors shadow-md hover:shadow-lg whitespace-nowrap"
           >
             Submit Your Story
           </button>
        </div>
      </section>

      {/* Featured Section */}
      {featuredStories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-serif font-bold text-ink mb-2">Featured Stories</h2>
              <p className="text-stone-500">Curated selections from our community.</p>
            </div>
            <button 
              onClick={() => onNavigate('feed')}
              className="hidden sm:flex items-center text-primary font-medium hover:underline"
            >
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredStories.map(story => (
              <StoryCard key={story.id} story={story} onClick={onStoryClick} />
            ))}
          </div>
          
          <div className="mt-8 text-center sm:hidden">
             <button 
              onClick={() => onNavigate('feed')}
              className="inline-flex items-center text-primary font-medium hover:underline"
            >
              View all stories <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </section>
      )}

      {/* Quote Section */}
      <section className="bg-ink text-white py-20">
         <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-2xl md:text-4xl font-serif italic leading-relaxed opacity-90">
              "There is no greater agony than bearing an untold story inside you."
            </p>
            <p className="mt-6 text-primary font-bold tracking-widest uppercase text-sm">— Maya Angelou</p>
         </div>
      </section>
    </div>
  );
};

export default Home;