import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Story, AIActionType } from '../types';
import { generateStoryEnhancement, suggestTags, getResearchContext, ResearchResponse } from '../services/geminiService';
import { saveDraft, getDraft, deleteDraft, BroadcastMessage } from '../services/storageService';
import { Sparkles, Save, ArrowLeft, Wand2, Tag, BookOpen, Loader2, Image as ImageIcon, X, Upload, Globe, ExternalLink, Link as LinkIcon, FileText, Lightbulb } from 'lucide-react';

interface StoryEditorProps {
  initialStory?: Story;
  onSave: (story: Story) => Promise<void>;
  onCancel: () => void;
}

// Utility to compress image
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Max dimensions (Reduced to ensure small size)
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 0.6 quality (Lower quality for smaller size)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        
        // Final sanity check for 1MB limit (1048487 bytes is approx 1MB)
        if (dataUrl.length > 1000000) {
            reject(new Error("Image is too large. Please upload a smaller image."));
        } else {
            resolve(dataUrl);
        }
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const StoryEditor: React.FC<StoryEditorProps> = ({ initialStory, onSave, onCancel }) => {
  const draftId = initialStory?.id || 'new_story_draft';

  const [title, setTitle] = useState(() => {
    const draft = getDraft(draftId);
    return draft?.title ?? initialStory?.title ?? '';
  });
  const [content, setContent] = useState(() => {
    const draft = getDraft(draftId);
    return draft?.content ?? initialStory?.content ?? '';
  });
  const [storyUrl, setStoryUrl] = useState(() => {
    const draft = getDraft(draftId);
    return draft?.storyUrl ?? initialStory?.storyUrl ?? '';
  });
  const [tags, setTags] = useState<string[]>(() => {
    const draft = getDraft(draftId);
    return draft?.tags ?? initialStory?.tags ?? [];
  });
  const [coverImage, setCoverImage] = useState<string>(() => {
    const draft = getDraft(draftId);
    return draft?.coverImage ?? initialStory?.coverImage ?? '';
  });

  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentAIAction, setCurrentAIAction] = useState<string | null>(null);
  const [researchData, setResearchData] = useState<ResearchResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time synchronization: Save draft on changes (Debounced)
  useEffect(() => {
    const handler = setTimeout(() => {
      saveDraft(draftId, { title, content, storyUrl, tags, coverImage });
    }, 500);
    return () => clearTimeout(handler);
  }, [title, content, storyUrl, tags, coverImage, draftId]);

  // Real-time synchronization: Listen for updates from other tabs
  useEffect(() => {
    const channel = new BroadcastChannel('anitory_realtime');
    channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
      if (event.data.type === 'DRAFT_UPDATE' && event.data.payload === draftId) {
        const remoteDraft = getDraft(draftId);
        if (remoteDraft) {
          if (remoteDraft.title !== undefined) setTitle(remoteDraft.title);
          if (remoteDraft.content !== undefined) setContent(remoteDraft.content);
          if (remoteDraft.storyUrl !== undefined) setStoryUrl(remoteDraft.storyUrl);
          if (remoteDraft.tags !== undefined) setTags(remoteDraft.tags);
          if (remoteDraft.coverImage !== undefined) setCoverImage(remoteDraft.coverImage);
        }
      }
    };
    return () => channel.close();
  }, [draftId]);

  const handleAISuggest = async (action: AIActionType) => {
    if (!content.trim() && !storyUrl.trim()) return;
    
    setIsProcessingAI(true);
    setCurrentAIAction(action);
    try {
      if (action === 'TITLE') {
        const newTitle = await generateStoryEnhancement(content || title, 'TITLE');
        setTitle(newTitle);
      } else {
        const enhanced = await generateStoryEnhancement(content, action);
        setContent(enhanced);
      }
    } catch (e) {
      alert("AI Service unavailable at the moment.");
    } finally {
      setIsProcessingAI(false);
      setCurrentAIAction(null);
    }
  };

  const handleResearch = async () => {
    if (!title && !content) {
      alert("Please enter a title or content to research.");
      return;
    }
    
    setIsProcessingAI(true);
    setCurrentAIAction('RESEARCH');
    setResearchData(null); 
    
    try {
      const query = title || (content || '').split(' ').slice(0, 50).join(' ');
      const result = await getResearchContext(query);
      setResearchData(result);
    } catch (e) {
      console.error(e);
      alert("Failed to research topic.");
    } finally {
      setIsProcessingAI(false);
      setCurrentAIAction(null);
    }
  };

  const handleSuggestTags = async () => {
    if (!content.trim()) return;
    setIsProcessingAI(true);
    setCurrentAIAction('TAGS');
    try {
      const suggested = await suggestTags(content);
      setTags(prev => Array.from(new Set([...prev, ...suggested])));
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingAI(false);
      setCurrentAIAction(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Compress image before setting state
        const compressedDataUrl = await compressImage(file);
        setCoverImage(compressedDataUrl);
      } catch (error: any) {
        console.error("Error processing image:", error);
        alert(error.message || "Failed to process image. Please try another one.");
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleCancel = () => {
    if (!initialStory) {
       deleteDraft(draftId);
    }
    onCancel();
  };

  const handleSave = async () => {
    if (!title.trim() || (!content.trim() && !storyUrl.trim())) {
      alert("Please provide a title and either content or a URL.");
      return;
    }
    
    setIsSaving(true);
    try {
        // Automatically generate insights and transcript if they don't exist
        let generatedInsights = initialStory?.insights || "";
        let generatedTranscript = initialStory?.transcript || "";

        // If no insights exist but we have content or a URL, generate them
        if (!generatedInsights && (content || storyUrl)) {
             try {
                // Use content or create a prompt based on URL and Title
                const promptText = content || `The story is located at this URL: ${storyUrl}. Title: ${title}.`;
                generatedInsights = await generateStoryEnhancement(promptText, 'INSIGHTS');
             } catch(e) { 
               console.log("Auto-insights failed", e);
             }
        }

        // Generate transcript field (if text story, it's the content)
        if (!generatedTranscript && content) {
            generatedTranscript = content;
        }

        const safeContent = content || '';
        const wordCount = safeContent.split(' ').length || 0;

        const newStory: Story = {
        id: initialStory?.id || crypto.randomUUID(),
        title,
        content: safeContent,
        storyUrl, // Ensure this field is passed
        insights: generatedInsights, // Ensure insights are saved
        transcript: generatedTranscript, // Ensure transcript is saved
        author: initialStory?.author || 'You', 
        authorId: initialStory?.authorId, 
        createdAt: initialStory?.createdAt || Date.now(),
        tags,
        likes: initialStory?.likes || 0,
        views: initialStory?.views || 0,
        readTimeMinutes: Math.max(1, Math.ceil(wordCount / 200)),
        coverImage: coverImage || `https://picsum.photos/800/400?random=${Math.floor(Math.random() * 1000)}`,
        comments: initialStory?.comments || []
        };

        await onSave(newStory);
        deleteDraft(draftId);
    } catch (e: any) {
        console.error("Error saving story:", e);
        if (e.code === 'permission-denied') {
          alert("Permission denied. You may not have the rights to save this story.");
        } else if (e.message?.includes("longer than") || e.toString().includes("large")) {
           alert("The story content or image is too large. Please shorten the content or use a smaller image.");
        } else {
           alert("Failed to save story. Please try again.");
        }
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in relative">
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={handleCancel}
          className="flex items-center text-stone-500 hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back to Feed
        </button>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center px-6 py-2.5 bg-secondary text-white rounded-full font-medium hover:bg-green-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-wait"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isSaving ? 'Publishing...' : 'Publish Story'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-stone-100 p-8 min-h-[80vh] relative">
        {/* Cover Image Upload Section */}
        <div className="mb-8 group relative">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
          
          {coverImage ? (
            <div className="relative h-48 md:h-64 w-full rounded-xl overflow-hidden bg-stone-100 group">
              <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={triggerFileInput} 
                  className="bg-white/90 text-stone-800 px-4 py-2 rounded-full font-medium text-sm mr-2 hover:bg-white"
                >
                  Change Image
                </button>
                <button 
                  onClick={() => setCoverImage('')} 
                  className="bg-red-500/90 text-white px-4 py-2 rounded-full font-medium text-sm hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={triggerFileInput}
              className="w-full h-32 md:h-48 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 hover:bg-stone-100 hover:border-primary/50 text-stone-400 hover:text-primary transition-all flex flex-col items-center justify-center gap-2"
            >
              <ImageIcon className="w-8 h-8" />
              <span className="font-medium">Add a cover image</span>
            </button>
          )}
        </div>

        {/* AI Toolbar */}
        <div className="absolute top-8 right-8 flex flex-col gap-2 z-10">
           <div className="group relative">
             <button 
              disabled={isProcessingAI}
              className="bg-stone-50 p-3 rounded-full shadow-sm hover:shadow-md hover:bg-white text-primary border border-stone-200 transition-all disabled:opacity-50"
             >
               {isProcessingAI ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
             </button>
             <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden hidden group-hover:block animate-fade-in-up z-20">
                <div className="p-2 flex flex-col gap-1">
                  <span className="text-xs font-bold text-stone-400 px-2 py-1 uppercase tracking-wider">AI Assistant</span>
                  <button onClick={() => handleAISuggest('POLISH')} className="text-left px-3 py-2 text-sm text-stone-700 hover:bg-orange-50 hover:text-primary rounded-lg flex items-center">
                    <Wand2 className="w-3 h-3 mr-2" /> Polish Text
                  </button>
                  <button onClick={() => handleAISuggest('EXPAND')} className="text-left px-3 py-2 text-sm text-stone-700 hover:bg-orange-50 hover:text-primary rounded-lg flex items-center">
                    <BookOpen className="w-3 h-3 mr-2" /> Expand Details
                  </button>
                  <button onClick={() => handleAISuggest('TITLE')} className="text-left px-3 py-2 text-sm text-stone-700 hover:bg-orange-50 hover:text-primary rounded-lg flex items-center">
                    <Tag className="w-3 h-3 mr-2" /> Suggest Title
                  </button>
                  <button onClick={() => handleAISuggest('INSIGHTS')} className="text-left px-3 py-2 text-sm text-stone-700 hover:bg-orange-50 hover:text-primary rounded-lg flex items-center">
                    <Lightbulb className="w-3 h-3 mr-2" /> Generate Insights
                  </button>
                   <div className="h-px bg-stone-100 my-1"></div>
                   <button onClick={handleResearch} className="text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg flex items-center font-medium">
                    <Globe className="w-3 h-3 mr-2" /> Research Topic
                  </button>
                </div>
             </div>
           </div>
        </div>

        {/* Research Panel */}
        {researchData && (
          <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-5 animate-fade-in relative">
            <button 
              onClick={() => setResearchData(null)} 
              className="absolute top-2 right-2 text-blue-400 hover:text-blue-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-2 flex items-center">
              <Globe className="w-3 h-3 mr-1.5" />
              Research & Context
            </h3>
            <div className="prose prose-sm prose-blue text-stone-700 leading-relaxed mb-3">
              {researchData.text}
            </div>
            {researchData.sources.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {researchData.sources.map((source, idx) => (
                   <a 
                    key={idx} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2 py-1 bg-white rounded border border-blue-200 text-xs text-blue-600 hover:underline hover:text-blue-800"
                   >
                     {source.title} <ExternalLink className="w-3 h-3 ml-1" />
                   </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Editor Inputs */}
        <div className="max-w-3xl mx-auto space-y-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title of your story..."
            className="w-full text-4xl font-serif font-bold text-ink placeholder-stone-300 border-none outline-none bg-transparent"
          />
          
          <div className="flex flex-wrap gap-2 items-center">
            {tags.map((tag, idx) => (
              <span key={idx} className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                #{tag}
                <button onClick={() => setTags(tags.filter((_, i) => i !== idx))} className="ml-2 hover:text-red-500">&times;</button>
              </span>
            ))}
            <button 
              onClick={handleSuggestTags}
              disabled={isProcessingAI || !content}
              className="text-xs text-primary font-medium hover:underline flex items-center disabled:opacity-50 disabled:no-underline"
            >
              {currentAIAction === 'TAGS' ? 'Thinking...' : '+ Auto-Tag with AI'}
            </button>
          </div>

          <div className="relative group">
            <LinkIcon className="absolute left-3 top-3 w-5 h-5 text-stone-400 group-focus-within:text-primary transition-colors" />
            <input
              type="url"
              value={storyUrl}
              onChange={(e) => setStoryUrl(e.target.value)}
              placeholder="External Story URL (e.g. YouTube, Blog)"
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your real life story here..."
            className="w-full h-[50vh] resize-none text-lg font-serif leading-relaxed text-stone-700 placeholder-stone-300 border-none outline-none bg-transparent hide-scrollbar"
          />

          {/* AI generated fields preview */}
          {(initialStory?.insights || initialStory?.transcript) && (
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                  <div className="flex items-center gap-2 mb-2 text-stone-500 text-xs font-bold uppercase tracking-wider">
                      <Lightbulb className="w-4 h-4" />
                      <span>Existing AI Data</span>
                  </div>
                  <div className="flex gap-4 text-xs">
                      {initialStory.insights && <span className="text-green-600 bg-green-50 px-2 py-1 rounded">Has Insights</span>}
                      {initialStory.transcript && <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">Has Transcript</span>}
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryEditor;