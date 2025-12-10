import { Story, UserProfile, Comment } from '../types';
import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collectionGroup, 
  query, 
  orderBy, 
  where, 
  getDocs
} from 'firebase/firestore/lite';

const CHANNEL_NAME = 'anitory_realtime';

// BroadcastChannel for cross-tab sync
const channel = new BroadcastChannel(CHANNEL_NAME);

export interface BroadcastMessage {
  type: 'STORY_UPDATE' | 'USER_UPDATE' | 'DRAFT_UPDATE';
  payload?: string;
}

const notifyUpdate = (type: BroadcastMessage['type'], payload?: string) => {
  try {
    channel.postMessage({ type, payload });
  } catch (e) {
    console.error("[Storage] Failed to broadcast update", e);
  }
};

// --- User Profile ---

export const getUserProfile = async (uid: string, email: string | null, displayName: string | null): Promise<UserProfile> => {
  if (!uid) throw new Error("No UID provided");
  
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    // Sanitize data to ensure all required fields exist and are not undefined
    return {
        id: uid,
        name: data.name || displayName || 'Storyteller',
        bio: data.bio || '',
        avatar: data.avatar || `https://ui-avatars.com/api/?name=${data.name || 'User'}&background=d97757&color=fff`,
        role: data.role || 'user',
        email: data.email || email || '',
        likedStories: data.likedStories || []
    } as UserProfile;
  } else {
    const newUser: UserProfile = {
      id: uid,
      name: displayName || (email ? email.split('@')[0] : 'Storyteller'),
      bio: 'I am a new storyteller on Anitory.',
      avatar: `https://ui-avatars.com/api/?name=${displayName || 'User'}&background=d97757&color=fff`,
      role: 'user', 
      email: email || '',
      likedStories: []
    };
    await setDoc(userRef, newUser);
    return newUser;
  }
};

export const updateUserProfile = async (user: UserProfile): Promise<void> => {
  if (!user.id) return;
  const userRef = doc(db, "users", user.id);
  await setDoc(userRef, user, { merge: true });
  notifyUpdate('USER_UPDATE');
};

// --- Stories ---

// Helper for fallback fetching when collectionGroup fails
const getStoriesFallback = async (): Promise<Story[]> => {
    try {
        const usersRef = collection(db, 'users');
        const usersSnap = await getDocs(usersRef);
        const allStories: Story[] = [];
        
        // Fetch stories for each user
        const promises = usersSnap.docs.map(async (userDoc) => {
             try {
                 const storiesRef = collection(db, "users", userDoc.id, "stories");
                 const storiesSnap = await getDocs(storiesRef);
                 return storiesSnap.docs.map(d => d.data() as Story);
             } catch (e) {
                 return [];
             }
        });

        const results = await Promise.all(promises);
        results.forEach(stories => allStories.push(...stories));
        
        // Sort by date descending
        return allStories.sort((a, b) => b.createdAt - a.createdAt);
    } catch(e: any) {
        // Suppress permission errors to avoid console noise
        if (e.code !== 'permission-denied') {
             console.warn("Fallback fetch failed", e);
        }
        return [];
    }
};

/**
 * Fetches all stories from all users (Feed) using Collection Group Query
 * Falls back to iterative fetch if permissions/indexes are missing.
 */
export const getStories = async (currentUserId?: string): Promise<Story[]> => {
  try {
    const storiesQuery = query(collectionGroup(db, 'stories'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(storiesQuery);
    return querySnapshot.docs.map(doc => doc.data() as Story);
  } catch (e: any) {
    // Common errors for collectionGroup without index/rules
    if (e.code === 'permission-denied' || e.code === 'failed-precondition' || e.code === 'unavailable') {
        const fallbackResult = await getStoriesFallback();
        
        // If fallback also failed (likely due to strict rules) and we have a user ID,
        // at least return their own stories so the feed isn't empty.
        if (fallbackResult.length === 0 && currentUserId) {
            return await getStoriesByAuthor(currentUserId);
        }
        return fallbackResult;
    }
    console.error("Error fetching global stories:", e);
    return [];
  }
};

/**
 * Fetches stories for a specific user from their subcollection
 */
export const getStoriesByAuthor = async (authorId: string): Promise<Story[]> => {
  try {
    const storiesRef = collection(db, "users", authorId, "stories");
    const q = query(storiesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Story);
  } catch (e) {
    console.error("Error fetching author stories:", e);
    return [];
  }
};

export const getStoryById = async (authorId: string, storyId: string): Promise<Story | undefined> => {
  try {
    // If we have authorId, query directly. Otherwise use collectionGroup
    if (authorId) {
        const docRef = doc(db, "users", authorId, "stories", storyId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? (docSnap.data() as Story) : undefined;
    } else {
        const q = query(collectionGroup(db, 'stories'), where('id', '==', storyId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return snapshot.docs[0].data() as Story;
        }
    }
    return undefined;
  } catch (e) {
    console.error("Error fetching story:", e);
    return undefined;
  }
};

export const saveStory = async (story: Story): Promise<void> => {
  if (!story.authorId) throw new Error("Story must have an authorId");
  
  // Explicitly saving to /users/{uid}/stories
  const storyRef = doc(db, "users", story.authorId, "stories", story.id);
  
  // Using merge: true to update existing fields or create new ones
  await setDoc(storyRef, story, { merge: true });
  notifyUpdate('STORY_UPDATE');
};

export const deleteStory = async (storyId: string, authorId: string): Promise<void> => {
  const storyRef = doc(db, "users", authorId, "stories", storyId);
  await deleteDoc(storyRef);
  notifyUpdate('STORY_UPDATE');
};

export const toggleStoryFeature = async (storyId: string, authorId: string, currentStatus: boolean): Promise<void> => {
  const storyRef = doc(db, "users", authorId, "stories", storyId);
  await updateDoc(storyRef, { isFeatured: !currentStatus });
  notifyUpdate('STORY_UPDATE');
};

export const toggleStoryLike = async (story: Story, userId: string): Promise<void> => {
  if (!story.authorId) return;

  const userRef = doc(db, "users", userId);
  const storyRef = doc(db, "users", story.authorId, "stories", story.id);

  // Manual read-modify-write because 'lite' SDK doesn't support arrayUnion/increment
  const [userSnap, storySnap] = await Promise.all([getDoc(userRef), getDoc(storyRef)]);
  
  if (!userSnap.exists() || !storySnap.exists()) return;
  
  const userData = userSnap.data() as UserProfile;
  const storyData = storySnap.data() as Story;

  const likedStories = userData.likedStories || [];
  const isLiked = likedStories.includes(story.id);
  
  let newLikedStories;
  let newLikesCount = storyData.likes || 0;

  if (isLiked) {
    newLikedStories = likedStories.filter(id => id !== story.id);
    newLikesCount = Math.max(0, newLikesCount - 1);
  } else {
    newLikedStories = [...likedStories, story.id];
    newLikesCount += 1;
  }

  await updateDoc(userRef, { likedStories: newLikedStories });
  await updateDoc(storyRef, { likes: newLikesCount });
  
  notifyUpdate('STORY_UPDATE');
};

export const incrementStoryView = async (story: Story): Promise<void> => {
  if (!story.authorId) return;
  const storyRef = doc(db, "users", story.authorId, "stories", story.id);
  
  const snap = await getDoc(storyRef);
  if (snap.exists()) {
      const currentViews = snap.data().views || 0;
      await updateDoc(storyRef, { views: currentViews + 1 });
      notifyUpdate('STORY_UPDATE');
  }
};

export const addComment = async (story: Story, text: string, user: UserProfile): Promise<void> => {
  if (!story.authorId) return;
  
  const storyRef = doc(db, "users", story.authorId, "stories", story.id);
  const snap = await getDoc(storyRef);
  
  if (snap.exists()) {
      const currentComments = snap.data().comments || [];
      const newComment: Comment = {
        id: crypto.randomUUID(),
        author: user.name || 'Anonymous',
        authorId: user.id,
        text,
        createdAt: Date.now()
      };
      
      await updateDoc(storyRef, {
        comments: [...currentComments, newComment]
      });
      
      notifyUpdate('STORY_UPDATE');
  }
};

// --- Editor Drafts ---

const getDraftKey = (id: string) => `anitory_draft_${id}`;

export const saveDraft = (id: string, data: Partial<Story>) => {
  try {
    localStorage.setItem(getDraftKey(id), JSON.stringify(data));
    notifyUpdate('DRAFT_UPDATE', id);
  } catch (e) {
    console.error("Failed to save draft", e);
  }
};

export const getDraft = (id: string): Partial<Story> | null => {
  try {
    const data = localStorage.getItem(getDraftKey(id));
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Failed to load draft", e);
    return null;
  }
};

export const deleteDraft = (id: string) => {
  localStorage.removeItem(getDraftKey(id));
};