import React from 'react';
import { Story } from '../types';
import { Trash2, Star, Eye } from 'lucide-react';

interface AdminPanelProps {
  stories: Story[];
  onDelete: (id: string, authorId?: string) => void;
  onToggleFeature: (id: string) => void;
  onView: (id: string) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ stories, onDelete, onToggleFeature, onView }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-ink">Admin Panel</h1>
        <p className="text-stone-500 mt-1">Manage content, curate featured stories, and moderate submissions.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-wider text-stone-500 font-semibold">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {stories.map(story => (
                <tr key={story.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFeature(story.id);
                      }}
                      className={`p-1.5 rounded-full transition-all ${
                        story.isFeatured 
                          ? 'bg-secondary/10 text-secondary hover:bg-secondary/20' 
                          : 'text-stone-300 hover:text-secondary hover:bg-stone-100'
                      }`}
                      title={story.isFeatured ? "Remove from featured" : "Add to featured"}
                    >
                      <Star className={`w-4 h-4 ${story.isFeatured ? 'fill-current' : ''}`} />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-ink truncate max-w-xs">{story.title}</div>
                    <div className="text-xs text-stone-400 truncate max-w-xs">{story.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <img src={`https://ui-avatars.com/api/?name=${story.author}&size=24`} className="w-6 h-6 rounded-full" alt="" />
                       <span className="text-sm text-stone-600">{story.author}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-500">
                    {new Date(story.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onView(story.id);
                        }}
                        className="p-2 text-stone-400 hover:text-primary hover:bg-orange-50 rounded-full transition-colors"
                        title="View Story"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(story.id, story.authorId);
                        }}
                        className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete Story"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;