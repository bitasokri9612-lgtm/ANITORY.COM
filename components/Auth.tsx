import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  AuthError
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore/lite';
import { auth, db } from '../services/firebase';
import { BookOpen, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Create Authentication User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const displayName = name || 'Storyteller';

        // Create Firestore User Document
        const userData = {
            id: user.uid,
            name: displayName,
            email: email,
            role: 'user',
            bio: 'I am a new storyteller on Anitory.',
            avatar: `https://ui-avatars.com/api/?name=${displayName || 'User'}&background=d97757&color=fff`,
            likedStories: [],
            createdAt: Date.now()
        };

        // Use Modular syntax: doc() and setDoc()
        await setDoc(doc(db, "users", user.uid), userData);

        // Update Auth Profile
        if (name) {
            await updateProfile(user, { displayName: name });
            // Force a reload to ensure the name propagates to the local auth state immediately
            await user.reload();
        }
      }
    } catch (err: any) {
      console.error(err);
      const authError = err as AuthError;
      switch (authError.code) {
        case 'auth/invalid-email':
          setError('Invalid email address format.');
          break;
        case 'auth/user-disabled':
          setError('This user has been disabled.');
          break;
        case 'auth/user-not-found':
          setError('No user found with this email.');
          break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Incorrect password or credentials.');
          break;
        case 'auth/email-already-in-use':
          setError('Email is already in use.');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters.');
          break;
        default:
          setError(authError.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden animate-fade-in">
        <div className="bg-ink p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex flex-col items-center">
             <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                <BookOpen className="h-6 w-6 text-primary" />
             </div>
             <h1 className="text-3xl font-serif font-bold text-white mb-2">Anitory</h1>
             <p className="text-stone-300 text-sm">Where stories come to life.</p>
          </div>
        </div>

        <div className="p-8">
          <div className="flex gap-4 mb-8 p-1 bg-stone-100 rounded-lg">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-white text-ink shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
            >
              Log In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-white text-ink shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="e.g. Alex Writer"
                />
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-orange-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="bg-stone-50 p-4 text-center border-t border-stone-100">
           <p className="text-xs text-stone-400">
             By continuing, you agree to Anitory's Terms of Service and Privacy Policy.
           </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;