import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { Save, User, ShieldCheck, Upload, AlertCircle, Camera, LogOut } from 'lucide-react';

interface UserProfileProps {
  user: UserProfile;
  onUpdate: (user: UserProfile) => void;
}

const UserProfileView: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [avatar, setAvatar] = useState(user.avatar);
  const [role, setRole] = useState(user.role);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdate({
      ...user,
      name,
      bio,
      avatar,
      role
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSignOut = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      signOut(auth);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-lg border border-stone-100 overflow-hidden">
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          accept="image/*" 
          className="hidden" 
        />

        {/* Banner Section */}
        <div className="bg-ink h-32 md:h-48 relative">
           <div className="absolute top-4 right-4 z-10">
              <button 
                onClick={handleSignOut}
                className="flex items-center px-4 py-2 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white rounded-full text-sm font-medium transition-all"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
           </div>
           <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 sm:left-10 sm:translate-x-0 transition-all duration-500">
             <div 
               className="w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-md group relative cursor-pointer"
               onClick={triggerFileInput}
               title="Click to upload new photo"
             >
               <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-black/40 hidden group-hover:flex flex-col items-center justify-center transition-opacity">
                  <Camera className="w-6 h-6 text-white mb-1" />
                  <span className="text-white text-xs font-bold">Upload</span>
               </div>
             </div>
           </div>
        </div>
        
        <div className="pt-20 sm:pt-24 px-6 sm:px-10 pb-10">
          <div className="text-center sm:text-left mb-8">
             <h1 className="text-2xl md:text-3xl font-serif font-bold text-ink">{name || 'Unnamed User'}</h1>
             <p className="text-stone-500 text-sm">{user.email}</p>
          </div>
          
          <div className="space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative group">
                    <User className="absolute left-3 top-3 w-5 h-5 text-stone-400 group-focus-within:text-primary transition-colors" />
                    <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    placeholder="e.g. Jane Doe"
                    />
                </div>
                </div>

                <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Role Permissions</label>
                <div className="relative group">
                    <ShieldCheck className="absolute left-3 top-3 w-5 h-5 text-stone-400 group-focus-within:text-primary transition-colors" />
                    <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                    className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                    >
                    <option value="user">User (Reader/Writer)</option>
                    <option value="admin">Administrator (Full Access)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-stone-500">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
                </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Bio</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                placeholder="Tell us a little about yourself..."
              />
              <p className="mt-2 text-xs text-stone-400 text-right">{bio.length}/500 characters</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Profile Picture</label>
              <div className="flex items-center gap-4">
                <button 
                  onClick={triggerFileInput}
                  className="flex items-center px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition-colors text-sm font-medium border border-stone-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New Photo
                </button>
                {avatar !== user.avatar && (
                   <button 
                     onClick={() => setAvatar(user.avatar)}
                     className="text-sm text-stone-400 hover:text-red-500 transition-colors"
                   >
                     Reset to Original
                   </button>
                )}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
               <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
               <div className="text-sm text-blue-800">
                 <p className="font-semibold mb-1">Account Status: {role === 'admin' ? 'Administrator' : 'Standard User'}</p>
                 <p className="opacity-80">
                   {role === 'admin' 
                     ? 'You have full access to manage stories and view the admin dashboard.' 
                     : 'You can read, write, and manage your own stories. Switch to Admin to test moderation features.'}
                 </p>
               </div>
            </div>
            
            <div className="pt-6 border-t border-stone-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-4">
               <span className={`text-sm text-green-600 font-medium transition-opacity duration-300 ${isSaved ? 'opacity-100' : 'opacity-0'}`}>
                 Changes saved successfully!
               </span>
              <button 
                onClick={handleSave}
                className={`w-full sm:w-auto flex items-center justify-center px-8 py-3 rounded-full font-medium transition-all transform active:scale-95 ${
                  isSaved 
                    ? 'bg-green-500 text-white shadow-none ring-0' 
                    : 'bg-primary text-white hover:bg-orange-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isSaved ? 'Saved' : 'Save Profile'}
                {!isSaved && <Save className="w-4 h-4 ml-2" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;