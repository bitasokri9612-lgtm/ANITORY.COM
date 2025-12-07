import React from 'react';
import { Story, UserProfile } from '../types';
import { PlusCircle, Edit2, Trash2, Eye, Heart, BookOpen } from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
  userStories: Story[];
  onEdit: (story: Story) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onView: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, userStories, onEdit, onDelete, onCreate, onView }) => {
  const totalLikes = userStories.reduce((acc, story) => acc + (story.likes || 0), 0);
  const totalViews = userStories.reduce((acc, story) => acc + (story.views || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink">Welcome back, {user.name.split(' ')[0]}</h1>
          <p className="text-stone-500 mt-1">Here's how your stories are performing.</p>
        </div>
        <button 
          onClick={onCreate}
          className="flex items-center px-6 py-2.5 bg-primary text-white rounded-full font-medium hover:bg-orange-700 transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          New Story
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100">
           <div className="flex items-center gap-3 mb-2 text-stone-400">
             <BookOpen className="w-5 h-5" />
             <span className="text-sm font-medium uppercase tracking-wider">Stories Published</span>
           </div>
           <p className="text-4xl font-bold text-ink">{userStories.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100">
           <div className="flex items-center gap-3 mb-2 text-stone-400">
             <Heart className="w-5 h-5" />
             <span className="text-sm font-medium uppercase tracking-wider">Total Likes</span>
           </div>
           <p className="text-4xl font-bold text-ink">{totalLikes}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100">
           <div className="flex items-center gap-3 mb-2 text-stone-400">
             <Eye className="w-5 h-5" />
             <span className="text-sm font-medium uppercase tracking-wider">Total Views</span>
           </div>
           <p className="text-4xl font-bold text-ink">{totalViews}</p>
        </div>
      </div>

      {/* Stories List */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-stone-200 bg-stone-50">
          <h2 className="font-bold text-ink">My Stories</h2>
        </div>
        
        {userStories.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-stone-300" />
            </div>
            <p className="text-stone-500 mb-6">You haven't written any stories yet.</p>
            <button onClick={onCreate} className="text-primary font-medium hover:underline">Start writing now</button>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {userStories.map(story => (
              <div key={story.id} className="p-6 flex flex-col md:flex-row items-start md:items-center gap-4 hover:bg-stone-50 transition-colors">
                <div className="w-full md:w-24 h-16 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                  <img src={story.coverImage} alt="" className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-grow">
                  <h3 
                    onClick={() => onView(story.id)}
                    className="font-serif font-bold text-lg text-ink hover:text-primary cursor-pointer mb-1"
                  >
                    {story.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-stone-500">
                    <span>{new Date(story.createdAt).toLocaleDateString()}</span>
                    <span>{story.readTimeMinutes} min read</span>
                    <span className="flex items-center"><Eye className="w-3 h-3 mr-1" /> {story.views || 0}</span>
                    <span className="flex items-center"><Heart className="w-3 h-3 mr-1" /> {story.likes || 0}</span>
                    {story.isFeatured && (
                      <span className="text-secondary font-bold bg-green-50 px-2 py-0.5 rounded-full">Featured</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 md:mt-0 self-end md:self-center">
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(story);
                    }}
                    className="p-2 text-stone-400 hover:text-ink hover:bg-stone-200 rounded-full transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(story.id);
                    }}
                    className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;