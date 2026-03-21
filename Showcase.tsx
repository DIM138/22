import React, { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ExternalLink, Heart, MessageCircle } from 'lucide-react';

export default function Showcase() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'showcase'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const showcaseItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(showcaseItems);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'showcase');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl md:text-5xl font-serif italic text-stone-900 leading-tight">
          La <span className="text-stone-400">Vitrine</span> des Identités
        </h1>
        <p className="text-stone-500 text-lg">
          Explorez les créations de notre communauté et laissez-vous inspirer par des identités visuelles uniques.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher un logo, un business..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-stone-900 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-stone-50 transition-colors">
            <Filter size={18} />
            Filtrer
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[4/5] bg-white rounded-3xl animate-pulse border border-stone-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-white rounded-3xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-500"
              >
                <div className="aspect-square bg-stone-50 relative overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-contain p-12 group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button className="p-3 bg-white text-stone-900 rounded-full hover:scale-110 transition-transform shadow-lg">
                      <Heart size={20} />
                    </button>
                    <button className="p-3 bg-white text-stone-900 rounded-full hover:scale-110 transition-transform shadow-lg">
                      <ExternalLink size={20} />
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-serif italic text-stone-900">{item.title}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 bg-stone-50 px-2 py-1 rounded-full">
                      Identité
                    </span>
                  </div>
                  <p className="text-stone-500 text-sm line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="pt-4 flex items-center justify-between border-t border-stone-50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-stone-200 rounded-full" />
                      <span className="text-xs font-medium text-stone-400">Par @user</span>
                    </div>
                    <div className="flex items-center gap-3 text-stone-300">
                      <div className="flex items-center gap-1 text-xs">
                        <Heart size={14} /> 12
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <MessageCircle size={14} /> 4
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {filteredItems.length === 0 && !loading && (
        <div className="text-center py-24 space-y-4">
          <div className="text-stone-200 flex justify-center">
            <Search size={64} strokeWidth={1} />
          </div>
          <p className="text-stone-400 font-serif italic">Aucun résultat trouvé pour votre recherche.</p>
        </div>
      )}
    </div>
  );
}
