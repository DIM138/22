import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { LogIn, LogOut, Menu, X, User as UserIcon, Palette, Image, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser) {
        // Ensure user document exists
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            isSubscribed: false,
            createdAt: new Date().toISOString()
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { id: 'generator', label: 'Générateur', icon: Palette },
    { id: 'showcase', label: 'Vitrine', icon: Image },
    { id: 'payment', label: 'Paiement', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-stone-900 font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white font-serif italic text-xl">DP</div>
              <span className="text-xl font-serif italic tracking-tight hidden sm:block">Guide DP</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    activeTab === item.id ? 'text-stone-900 underline underline-offset-8' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
              {user ? (
                <div className="flex items-center gap-4 pl-4 border-l border-stone-200">
                  <div className="flex items-center gap-2">
                    <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-stone-200" />
                    <span className="text-sm font-medium">{user.displayName}</span>
                  </div>
                  <button onClick={handleLogout} className="text-stone-500 hover:text-red-600 transition-colors">
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-full text-sm font-medium hover:bg-stone-800 transition-all"
                >
                  <LogIn size={18} />
                  Se connecter
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-4">
              {user && <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-stone-200" />}
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-stone-900">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-stone-200 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-4">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full p-3 rounded-xl text-left font-medium ${
                      activeTab === item.id ? 'bg-stone-100 text-stone-900' : 'text-stone-500'
                    }`}
                  >
                    <item.icon size={20} />
                    {item.label}
                  </button>
                ))}
                {!user ? (
                  <button
                    onClick={handleLogin}
                    className="flex items-center gap-3 w-full p-3 bg-stone-900 text-white rounded-xl font-medium"
                  >
                    <LogIn size={20} />
                    Se connecter
                  </button>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full p-3 text-red-600 font-medium"
                  >
                    <LogOut size={20} />
                    Se déconnecter
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isAuthReady ? children : (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
            <p className="text-stone-500 font-serif italic">Chargement de votre univers...</p>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-stone-200 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="font-serif italic text-2xl mb-4">Guide DP</div>
          <p className="text-stone-500 text-sm max-w-md mx-auto">
            Création d'identité visuelle et visibilité web. 
            Service premium pour les entrepreneurs ambitieux.
          </p>
          <div className="mt-8 pt-8 border-t border-stone-100 text-xs text-stone-400">
            © 2026 Guide DP. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
