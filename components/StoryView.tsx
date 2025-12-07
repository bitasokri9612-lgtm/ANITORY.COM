import React, { useState } from 'react';
import { Story, UserProfile } from '../types';
import { ArrowLeft, Clock, Calendar, Heart, Share2, Trash2, Edit2, Eye, MessageCircle, Send, Globe, Loader2, ExternalLink, Lightbulb, FileText, Link as LinkIcon } from 'lucide-react';
import { addComment } from '../services/storageService';
import { getResearchContext, ResearchResponse } from '../services/geminiService';

interface StoryViewProps {
  story: Story;
  user: UserProfile;
  onBack: () => void;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (story: Story) => void;
}

const StoryView: React.FC<StoryViewProps> = ({ story, user, onBack, onLike, onDelete, onEdit }) => {
  const [commentText, setCommentText] = useState('');
  const [showContext, setShowContext] = useState(false);
  const [showInsights, setShowInsights] = useState(!!story.insights);
  const [contextData, setContextData] = useState<ResearchResponse | null>(null);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  
  const isAuthor = user.id === story.authorId;
  const isAdmin = user.role === 'admin';
  const canEdit = isAuthor;
  const canDelete = isAuthor || isAdmin;
  const isLiked = user.likedStories.includes(story.id);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    // Pass the current user object to addComment
    await addComment(story, commentText, user);
    setCommentText('');
  };

  const handleToggleContext = async () => {
    if (showContext) {
      setShowContext(false);
      return;
    }

    setShowContext(true);
    if (!contextData) {
      setIsLoadingContext(true);
      try {
        const query = `${story.title} ${story.tags.join(' ')}`;
        const result = await getResearchContext(query);
        setContextData(result);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingContext(false);
      }
    }
  };

  return (
    <article className="max-w-4xl mx-auto px-4 py-8 animate-fade-in pb-20">
      <button 
        onClick={onBack}
        className="flex items-center text-stone-500 hover:text-ink transition-colors mb-6 group"
      >
        <ArrowLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
        Back to Feed
      </button>

      <div className="bg-white rounded-2xl shadow-lg border border-stone-100 overflow-hidden mb-8">
        {story.coverImage && (
          <div className="h-64 md:h-96 w-full relative">
             <img 
               src={story.coverImage} 
               alt={story.title} 
               className="w-full h-full object-cover"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
             <div className="absolute bottom-6 left-6 md:left-10 text-white">
                <div className="flex gap-2 mb-3">
                  {story.tags.map(tag => (
                    <span key={tag} className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
             </div>
          </div>
        )}

        <div className="p-6 md:p-10">
          <h1 className="text-3xl md:text-5xl font-serif font-black text-ink mb-6 leading-tight">
            {story.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between border-b border-stone-100 pb-6 mb-8 gap-4">
            <div className="flex items-center gap-3">
              <img 
                src={`https://ui-avatars.com/api/?name=${story.author}&background=random`} 
                alt={story.author}
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
              />
              <div>
                <p className="text-sm font-bold text-ink">{story.author}</p>
                <div className="flex items-center gap-3 text-xs text-stone-500">
                  <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {new Date(story.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {story.readTimeMinutes} min read</span>
                  <span className="flex items-center"><Eye className="w-3 h-3 mr-1" /> {story.views || 0} views</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onLike(story.id);
                }}
                className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isLiked 
                    ? 'bg-red-50 text-red-500 border border-red-100' 
                    : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                <span>{story.likes || 0}</span>
                <span className="ml-1">Likes</span>
              </button>

              {(canEdit || canDelete) && <div className="w-px h-6 bg-stone-200 mx-2"></div>}
              
              {canEdit && (
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(story);
                  }}
                  className="p-2 text-stone-500 hover:text-ink hover:bg-stone-100 rounded-full transition-colors"
                  title="Edit Story"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              
              {canDelete && (
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(story.id);
                  }}
                  className="p-2 text-stone-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="Delete Story"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* New Fields: URL, Insights, Transcript */}
          {(story.storyUrl || story.insights || story.transcript) && (
              <div className="mb-8 grid gap-4">
                  {story.storyUrl && (
                      <a href={story.storyUrl} target="_blank" rel="noopener noreferrer" className="flex items-center p-4 bg-stone-50 rounded-xl border border-stone-200 hover:bg-stone-100 transition-colors group">
                          <LinkIcon className="w-5 h-5 text-primary mr-3" />
                          <span className="font-medium text-ink group-hover:text-primary transition-colors">View External Story Source</span>
                          <ExternalLink className="w-4 h-4 ml-auto text-stone-400" />
                      </a>
                  )}

                  {story.insights && (
                      <div className="bg-green-50/50 rounded-xl border border-green-100 p-5">
                          <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide mb-2 flex items-center">
                              <Lightbulb className="w-4 h-4 mr-2" />
                              AI Insights
                          </h3>
                          <p className="text-stone-700 text-sm leading-relaxed">{story.insights}</p>
                      </div>
                  )}

                  {story.transcript && story.transcript !== story.content && (
                       <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-5">
                          <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-2 flex items-center">
                              <FileText className="w-4 h-4 mr-2" />
                              Transcript
                          </h3>
                          <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-line">{story.transcript}</p>
                      </div>
                  )}
              </div>
          )}

          {/* Context / Search Grounding Section */}
          <div className="mb-8">
             <button 
               onClick={handleToggleContext}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${showContext ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'}`}
             >
               <Globe className="w-4 h-4" />
               {showContext ? 'Hide Context' : 'Explore Context'}
             </button>

             {showContext && (
               <div className="mt-4 p-5 bg-blue-50/50 rounded-xl border border-blue-100 animate-fade-in-up">
                 {isLoadingContext ? (
                   <div className="flex items-center justify-center py-4 text-blue-400">
                     <Loader2 className="w-5 h-5 animate-spin mr-2" />
                     Searching for relevant context...
                   </div>
                 ) : contextData ? (
                   <div>
                      <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-2 flex items-center">
                        <Globe className="w-3 h-3 mr-1.5" />
                        AI Context & Facts
                      </h3>
                      <div className="prose prose-sm prose-blue text-stone-700 leading-relaxed mb-4">
                        {contextData.text}
                      </div>
                      
                      {contextData.sources.length > 0 && (
                        <div className="border-t border-blue-100 pt-3">
                          <span className="text-xs font-semibold text-blue-800 block mb-2">Sources:</span>
                          <div className="flex flex-wrap gap-2">
                            {contextData.sources.map((source, idx) => (
                              <a 
                                key={idx} 
                                href={source.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-2 py-1 bg-white rounded border border-blue-200 text-xs text-blue-600 hover:underline hover:text-blue-800 transition-colors"
                              >
                                {source.title} <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                   </div>
                 ) : (
                   <div className="text-sm text-stone-500 italic">Could not load context.</div>
                 )}
               </div>
             )}
          </div>

          <div className="prose prose-lg prose-stone max-w-none font-serif text-stone-700 leading-relaxed whitespace-pre-line">
            {story.content}
          </div>
          
          <div className="mt-12 pt-8 border-t border-stone-100 flex items-center justify-between">
             <div className="flex items-center gap-2 text-stone-400 text-sm italic">
               <Share2 className="w-4 h-4" />
               Share this story
             </div>
             {story.isFeatured && (
               <span className="text-secondary font-bold text-xs uppercase tracking-widest bg-secondary/10 px-3 py-1 rounded-full">
                 Featured Story
               </span>
             )}
          </div>
        </div>
      </div>

      {/* Discussion Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-stone-100 p-6 md:p-10">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-ink">Discussion ({story.comments?.length || 0})</h2>
        </div>

        {/* Comment Input */}
        <div className="mb-8 flex gap-4">
          <img 
            src={user.avatar} 
            alt={user.name} 
            className="w-10 h-10 rounded-full object-cover border border-stone-200"
          />
          <form onSubmit={handleCommentSubmit} className="flex-grow">
            <div className="relative">
              <textarea 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 pr-12 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                rows={3}
              />
              <button 
                type="submit" 
                disabled={!commentText.trim()}
                className="absolute bottom-3 right-3 p-2 bg-primary text-white rounded-full disabled:opacity-50 disabled:bg-stone-300 hover:bg-orange-700 transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Comments List */}
        <div className="space-y-6">
          {story.comments && story.comments.length > 0 ? (
            story.comments.map(comment => (
              <div key={comment.id} className="flex gap-4 animate-fade-in">
                <img 
                  src={`https://ui-avatars.com/api/?name=${comment.author}&background=random`} 
                  alt={comment.author} 
                  className="w-8 h-8 rounded-full border border-stone-100 mt-1"
                />
                <div className="flex-grow">
                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm text-ink">{comment.author}</span>
                      <span className="text-xs text-stone-400">
                        {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-stone-700 text-sm leading-relaxed">{comment.text}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-stone-400 text-sm italic">
              No comments yet. Be the first to share your thoughts!
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default StoryView;