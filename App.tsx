
import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './services/firebase';
import Header from './components/Header';
import Home from './components/Home';
import StoryCard from './components/StoryCard';
import StoryEditor from './components/StoryEditor';
import StoryView from './components/StoryView';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import UserProfileView from './components/UserProfile';
import BottomNav from './components/BottomNav';
import Auth from './components/Auth';
import { 
  getStories, 
  saveStory, 
  deleteStory,
  getUserProfile,
  updateUserProfile,
  toggleStoryFeature,
  toggleStoryLike,
  incrementStoryView,
  BroadcastMessage,
  addComment
} from './services/storageService';
import { Story, UserProfile } from './types';
import { Search, Loader2, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'feed' | 'create' | 'view' | 'dashboard' | 'admin' | 'profile'>('home');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [editingStory, setEditingStory] = useState<Story | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Auth Listener
  useEffect(() => {
    let mounted = true;
    
    const safetyTimeout = setTimeout(() => {
        if (mounted && loading) {
            setLoading(false);
        }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;
      
      if (firebaseUser) {
        setAuthUser(firebaseUser);
        try {
            const profile = await getUserProfile(firebaseUser.uid, firebaseUser.email, firebaseUser.displayName);
            if (mounted) setUser(profile);
        } catch(e) {}
      } else {
        setAuthUser(null);
        setUser(null);
      }
      
      if (mounted) {
          setLoading(false);
          clearTimeout(safetyTimeout);
      }
    }, (error) => {
      if (mounted) {
          setInitError("Authentication service unavailable.");
          setLoading(false);
          clearTimeout(safetyTimeout);
      }
    });

    return () => {
        mounted = false;
        clearTimeout(safetyTimeout);
        unsubscribe();
    };
  }, []);

  const refreshData = useCallback(async () => {
    if (!authUser) return;
    try {
        const fetchedStories = await getStories(authUser.uid);
        setStories(fetchedStories);
        const updatedProfile = await getUserProfile(authUser.uid, authUser.email, authUser.displayName);
        setUser(updatedProfile);
    } catch(e) {}
  }, [authUser]);

  useEffect(() => {
    if (!user) return;

    refreshData();

    const channel = new BroadcastChannel('anitory_realtime');
    channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
      const data = event.data;
      const type = typeof data === 'string' ? data : data.type;
      
      if (type === 'STORY_UPDATE' || type === 'USER_UPDATE') {
        refreshData();
      }
    };

    const handleFocus = () => {
      refreshData();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      channel.close();
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshData, user?.id]);

  const handleNavigate = (page: string) => {
    if (page !== 'create') setEditingStory(undefined);
    if (page !== 'feed') setSearchQuery('');
    
    const validViews = ['home', 'feed', 'create', 'view', 'dashboard', 'admin', 'profile'];
    if (validViews.includes(page)) {
      setCurrentView(page as any);
      window.scrollTo(0,0);
    }
  };

  const handleStoryClick = async (id: string) => {
    const story = stories.find(s => s.id === id);
    if (story) {
        // Optimistic Increment: Update local state immediately
        const newViewCount = (story.views || 0) + 1;
        const updatedStory = { ...story, views: newViewCount };

        setStories(prev => prev.map(s => s.id === id ? updatedStory : s));
        setSelectedStory(updatedStory);
        setCurrentView('view');
        window.scrollTo(0,0);

        // Perform actual increment in background
        incrementStoryView(story).catch(console.error);
    }
  };

  const handleSaveStory = async (story: Story) => {
    if (!user) return;
    if (!story.authorId) {
      story.author = user.name;
      story.authorId = user.id;
    }
    await saveStory(story);
    await refreshData();
    setCurrentView('dashboard');
  };

  const handleDeleteStory = async (id: string, authorId?: string) => {
    if (!id || !user) return;
    
    let targetAuthorId = authorId;
    if (!targetAuthorId) {
         const storyToDelete = stories.find(s => s.id === id) || (selectedStory?.id === id ? selectedStory : null);
         targetAuthorId = storyToDelete?.authorId || user.id;
    }

    if (window.confirm("Are you sure you want to delete this story? This action cannot be undone.")) {
      try {
        setStories(prev => prev.filter(s => s.id !== id));
        await deleteStory(id, targetAuthorId); 
        
        if (currentView === 'view' && selectedStory?.id === id) {
          setSelectedStory(null);
          setCurrentView(targetAuthorId === user.id ? 'dashboard' : 'feed');
        }
      } catch (error) {
        refreshData();
      }
    }
  };

  const handleToggleFeature = async (id: string) => {
    const story = stories.find(s => s.id === id);
    if(story && story.authorId) {
       await toggleStoryFeature(id, story.authorId, !!story.isFeatured);
       refreshData();
    }
  };

  const handleToggleLike = async (id: string) => {
    if (!user) return;
    const story = stories.find(s => s.id === id);
    if(story) {
        await toggleStoryLike(story, user.id);
        refreshData();
    }
  };

  const handleEditStory = (story: Story) => {
    setEditingStory(story);
    setCurrentView('create');
  };

  const handleUpdateProfile = async (updatedUser: UserProfile) => {
    await updateUserProfile(updatedUser);
    setUser(updatedUser);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#fdfbf7]">
         <div className="flex flex-col items-center animate-pulse p-8">
           <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
           </div>
           <h2 className="text-2xl font-serif font-bold text-ink mb-2">Anitory</h2>
           <p className="text-stone-400 font-sans text-sm">Connecting to sanctuary...</p>
         </div>
      </div>
    );
  }

  if (initError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#fdfbf7] p-4">
            <div className="text-center">
                <div className="bg-red-50 p-4 rounded-full inline-block mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-ink mb-2">Something went wrong</h2>
                <p className="text-stone-500 mb-4">{initError}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-primary text-white rounded-full hover:bg-orange-700 transition-colors"
                >
                    Retry
                </button>
            </div>
        </div>
      );
  }

  if (!user) {
    return <Auth />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <Home 
            featuredStories={stories.filter(s => s.isFeatured)} 
            onNavigate={handleNavigate}
            onStoryClick={handleStoryClick}
            user={user}
            onDelete={handleDeleteStory}
          />
        );

      case 'dashboard':
        return (
          <Dashboard 
            user={user}
            userStories={stories.filter(s => s.authorId === user.id)}
            onEdit={handleEditStory}
            onDelete={handleDeleteStory}
            onCreate={() => handleNavigate('create')}
            onView={handleStoryClick}
          />
        );

      case 'admin':
        return (
          <AdminPanel 
            stories={stories} 
            onDelete={handleDeleteStory}
            onToggleFeature={handleToggleFeature}
            onView={handleStoryClick}
          />
        );

      case 'profile':
        return (
          <UserProfileView 
            user={user} 
            onUpdate={handleUpdateProfile} 
          />
        );

      case 'create':
        return (
          <StoryEditor 
            initialStory={editingStory}
            onSave={handleSaveStory} 
            onCancel={() => handleNavigate(editingStory ? 'dashboard' : 'feed')} 
          />
        );
      
      case 'view':
        if (!selectedStory) {
           return <div className="p-8 text-center text-red-500">Story not found.</div>;
        }
        
        const reactiveStory = stories.find(s => s.id === selectedStory.id) || selectedStory;
        
        return (
          <StoryView 
            story={reactiveStory} 
            user={user}
            onLike={handleToggleLike}
            onDelete={handleDeleteStory}
            onEdit={handleEditStory}
            onBack={() => handleNavigate('feed')} 
          />
        );

      case 'feed':
        const filteredStories = stories.filter(story => {
          const query = searchQuery.toLowerCase();
          return (
            story.title.toLowerCase().includes(query) ||
            story.content.toLowerCase().includes(query) ||
            story.author.toLowerCase().includes(query) ||
            story.tags.some(tag => tag.toLowerCase().includes(query))
          );
        });

        return (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-serif font-black text-ink mb-4">Community Stories</h1>
              <p className="text-stone-600 mb-8">Explore the lives of others.</p>
              
              <div className="max-w-xl mx-auto relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-stone-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-11 pr-4 py-3 border border-stone-200 rounded-full leading-5 bg-white placeholder-stone-400 focus:outline-none focus:placeholder-stone-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300 shadow-sm hover:shadow-md"
                  placeholder="Search by title, author, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredStories.map(story => (
                <div key={story.id} className="h-full">
                  <StoryCard 
                    story={story} 
                    onClick={handleStoryClick} 
                    isLiked={user.likedStories.includes(story.id)}
                    currentUser={user}
                    onDelete={handleDeleteStory}
                  />
                </div>
              ))}
            </div>

            {filteredStories.length === 0 && (
              <div className="text-center py-20 text-stone-400">
                {searchQuery ? (
                  <div className="flex flex-col items-center">
                     <p className="mb-2">No stories match your search.</p>
                     <button 
                      onClick={() => setSearchQuery('')}
                      className="text-primary hover:underline text-sm font-medium"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  'No stories yet.'
                )}
              </div>
            )}
          </main>
        );
        
      default:
        return null;
    }
  };

  const showBottomNav = currentView !== 'create' && currentView !== 'view';

  return (
    <div className={`min-h-screen bg-paper font-sans text-ink selection:bg-orange-100 ${showBottomNav ? 'pb-20 md:pb-0' : ''}`}>
      {currentView !== 'view' && (
        <Header onNavigate={handleNavigate} currentPage={currentView} user={user} />
      )}
      
      {renderContent()}
      
      {showBottomNav && (
        <BottomNav currentView={currentView} onNavigate={handleNavigate} />
      )}

      <footer className="hidden md:block border-t border-stone-200 mt-auto py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
           <div className="flex justify-center gap-6 mb-6">
             <button onClick={() => handleNavigate('home')} className="text-stone-400 hover:text-primary text-sm">Home</button>
             <button onClick={() => handleNavigate('feed')} className="text-stone-400 hover:text-primary text-sm">Stories</button>
             <button onClick={() => handleNavigate('create')} className="text-stone-400 hover:text-primary text-sm">Write</button>
           </div>
           <p className="text-stone-400 font-serif italic text-sm">
             &copy; {new Date().getFullYear()} Anitory. Where stories live.
           </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
