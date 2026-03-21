import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { auth, db, OperationType, handleFirestoreError } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { Palette, Sparkles, Download, Share2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export default function LogoGenerator() {
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [style, setStyle] = useState('minimaliste');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userLogos, setUserLogos] = useState<any[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'logos'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserLogos(logos);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'logos');
    });

    // Check subscription status
    const userRef = query(collection(db, 'users'), where('uid', '==', auth.currentUser.uid));
    const unsubUser = onSnapshot(userRef, (snapshot) => {
      if (!snapshot.empty) {
        setIsSubscribed(snapshot.docs[0].data().isSubscribed || false);
      }
    });

    return () => {
      unsubscribe();
      unsubUser();
    };
  }, []);

  const generateLogo = async () => {
    if (!businessName || !businessType) {
      setError("Veuillez remplir le nom et le type de votre entreprise.");
      return;
    }

    if (!auth.currentUser) {
      setError("Veuillez vous connecter pour générer un logo.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const prompt = `Crée un logo professionnel pour une entreprise nommée "${businessName}". 
      Type d'entreprise : ${businessType}. 
      Style souhaité : ${style}. 
      Le logo doit être moderne, épuré, avec des couleurs élégantes. 
      Fond blanc ou transparent. Pas de texte complexe, juste un symbole iconique et le nom de l'entreprise si possible.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          },
        },
      });

      let base64Data = "";
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          base64Data = part.inlineData.data;
          break;
        }
      }

      if (base64Data) {
        const imageUrl = `data:image/png;base64,${base64Data}`;
        setGeneratedImage(imageUrl);

        // Save to Firestore
        await addDoc(collection(db, 'logos'), {
          userId: auth.currentUser.uid,
          prompt,
          imageUrl,
          businessName,
          businessType,
          createdAt: new Date().toISOString()
        });
      } else {
        throw new Error("Aucune image n'a été générée.");
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError("Une erreur est survenue lors de la génération. Veuillez réessayer.");
    } finally {
      setIsGenerating(false);
    }
  };

  const addToShowcase = async (logo: any) => {
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'showcase'), {
        logoId: logo.id,
        userId: auth.currentUser.uid,
        title: logo.businessName,
        description: `Identité visuelle pour ${logo.businessType}`,
        imageUrl: logo.imageUrl,
        createdAt: new Date().toISOString()
      });
      alert("Ajouté à la vitrine avec succès !");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'showcase');
    }
  };

  return (
    <div className="space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl md:text-5xl font-serif italic text-stone-900 leading-tight">
          Donnez vie à votre <span className="text-stone-400">identité visuelle</span>
        </h1>
        <p className="text-stone-500 text-lg">
          Utilisez notre intelligence artificielle pour créer un logo unique qui reflète l'âme de votre business.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Form Section */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-stone-400 mb-2">Nom de l'entreprise</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ex: Guide DP"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-stone-400 mb-2">Secteur d'activité</label>
              <input
                type="text"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                placeholder="Ex: Agence de voyage, Restaurant, Tech..."
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-stone-400 mb-2">Style visuel</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none transition-all appearance-none"
              >
                <option value="minimaliste">Minimaliste & Moderne</option>
                <option value="luxueux">Luxueux & Élégant</option>
                <option value="creatif">Créatif & Coloré</option>
                <option value="vintage">Vintage & Rétro</option>
                <option value="technologique">Technologique & Futuriste</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <button
            onClick={generateLogo}
            disabled={isGenerating}
            className="w-full py-4 bg-stone-900 text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-stone-900/20"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Générer mon logo
              </>
            )}
          </button>

          {!isSubscribed && (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-amber-600 shrink-0" size={20} />
              <div className="text-xs text-amber-800 leading-relaxed">
                <span className="font-bold">Note :</span> Vous êtes en mode gratuit. Pour télécharger vos logos en haute résolution et sans filigrane, veuillez souscrire à un abonnement annuel.
              </div>
            </div>
          )}
        </div>

        {/* Result Section */}
        <div className="relative group">
          <div className="aspect-square bg-white rounded-3xl border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden shadow-inner">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-stone-100 border-t-stone-900 rounded-full animate-spin" />
                <p className="text-stone-400 font-serif italic">L'IA dessine votre futur...</p>
              </div>
            ) : generatedImage ? (
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src={generatedImage}
                alt="Logo généré"
                className="w-full h-full object-contain p-8"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-stone-300">
                <Palette size={64} strokeWidth={1} />
                <p className="font-serif italic">Votre logo apparaîtra ici</p>
              </div>
            )}
          </div>

          {generatedImage && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4"
            >
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = generatedImage;
                  link.download = `${businessName}-logo.png`;
                  link.click();
                }}
                className="px-6 py-3 bg-white text-stone-900 rounded-full shadow-xl border border-stone-100 flex items-center gap-2 hover:scale-105 transition-transform font-medium text-sm"
              >
                <Download size={18} />
                Télécharger
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Recent Logos */}
      {userLogos.length > 0 && (
        <div className="space-y-6 pt-12 border-t border-stone-200">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-serif italic">Vos créations récentes</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {userLogos.map((logo) => (
              <motion.div
                key={logo.id}
                whileHover={{ y: -5 }}
                className="group relative bg-white p-4 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="aspect-square bg-stone-50 rounded-xl overflow-hidden mb-3">
                  <img src={logo.imageUrl} alt="" className="w-full h-full object-contain p-4" />
                </div>
                <div className="text-xs font-bold truncate">{logo.businessName}</div>
                <div className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">{logo.businessType}</div>
                
                <div className="absolute inset-0 bg-stone-900/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-3">
                  <button 
                    onClick={() => addToShowcase(logo)}
                    className="p-2 bg-white text-stone-900 rounded-full hover:scale-110 transition-transform"
                    title="Ajouter à la vitrine"
                  >
                    <Share2 size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = logo.imageUrl;
                      link.download = `${logo.businessName}-logo.png`;
                      link.click();
                    }}
                    className="p-2 bg-white text-stone-900 rounded-full hover:scale-110 transition-transform"
                    title="Télécharger"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
