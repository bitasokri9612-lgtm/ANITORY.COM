import React from 'react';
import { Story, UserProfile } from '../types';
import { Clock, Heart, Star, Eye, MessageCircle, Trash2 } from 'lucide-react';

interface StoryCardProps {
  story: Story;
  onClick: (id: string) => void;
  isLiked?: boolean;
  currentUser?: UserProfile | null;
  onDelete?: (id: string, authorId?: string) => void;
}

const StoryCard: React.FC<StoryCardProps> = ({ story, onClick, isLiked, currentUser, onDelete }) => {
  const canDelete = currentUser && (currentUser.id === story.authorId || currentUser.role === 'admin');

  return (
    <article 
      className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-stone-100 cursor-pointer group flex flex-col h-full relative"
      onClick={() => onClick(story.id)}
    >
      {story.isFeatured && (
        <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
          <Star className="w-3 h-3 text-secondary fill-current" />
          <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Featured</span>
        </div>
      )}

      {story.coverImage && (
        <div className="h-48 overflow-hidden">
          <img 
            src={story.coverImage} 
            alt={story.title} 
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
          />
        </div>
      )}
      
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-primary bg-orange-50 px-2 py-1 rounded-full uppercase tracking-wider">
            {story.tags[0] || 'Story'}
          </span>
          <span className="text-xs text-stone-400">
            {new Date(story.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>

        <h3 className="text-xl font-serif font-bold text-ink mb-2 group-hover:text-primary transition-colors leading-tight">
          {story.title}
        </h3>
        
        <p className="text-stone-600 font-sans text-sm line-clamp-3 mb-4 flex-grow">
          {story.content}
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-stone-100 mt-auto">
          <div className="flex items-center text-xs text-stone-500 font-medium">
            <img 
              src={`https://ui-avatars.com/api/?name=${story.author}&background=random`} 
              alt={story.author}
              className="w-6 h-6 rounded-full mr-2" 
            />
            {story.author}
          </div>
          <div className="flex items-center gap-3 text-xs text-stone-400">
            <span className="flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              {story.views || 0}
            </span>
            <span className="flex items-center">
              <MessageCircle className="w-3 h-3 mr-1" />
              {story.comments?.length || 0}
            </span>
            <span className={`flex items-center transition-colors ${isLiked ? 'text-red-500' : ''}`}>
              <Heart className={`w-3 h-3 mr-1 ${isLiked ? 'fill-current' : ''}`} />
              {story.likes || 0}
            </span>
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(story.id, story.authorId);
                }}
                className="ml-1 p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                title="Delete Story"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default StoryCard;