import React, { useState, useEffect } from 'react';
import { auth, db, OperationType, handleFirestoreError } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { CreditCard, Smartphone, CheckCircle2, AlertCircle, Clock, ShieldCheck, ArrowRight, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PAYMENT_NUMBER = "+237695142545";
const ANNUAL_FEE = "15 000 FCFA";

export default function Payment() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'payments'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const p = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayments(p);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'payments');
    });

    return () => unsubscribe();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(PAYMENT_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!phoneNumber || !transactionId) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, 'payments'), {
        userId: auth.currentUser.uid,
        amount: 15000,
        status: 'pending',
        phoneNumber,
        transactionId,
        createdAt: new Date().toISOString()
      });
      setSuccess(true);
      setPhoneNumber('');
      setTransactionId('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'payments');
      setError("Une erreur est survenue lors de l'enregistrement de votre paiement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl md:text-5xl font-serif italic text-stone-900 leading-tight">
          Passez au <span className="text-stone-400">Premium</span>
        </h1>
        <p className="text-stone-500 text-lg">
          Débloquez toutes les fonctionnalités et propulsez votre business avec une identité visuelle professionnelle complète.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Instructions Section */}
        <div className="space-y-8">
          <div className="bg-stone-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-start">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                  <Smartphone size={24} />
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-widest text-stone-400 mb-1">Abonnement Annuel</div>
                  <div className="text-3xl font-serif italic">{ANNUAL_FEE}</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-xs text-stone-400 uppercase tracking-widest mb-2">Numéro Orange Money</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-mono tracking-wider">{PAYMENT_NUMBER}</span>
                    <button 
                      onClick={handleCopy}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-stone-400">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  Paiement sécurisé et vérifié manuellement sous 24h.
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-serif italic">Comment ça marche ?</h3>
            <div className="space-y-4">
              {[
                { step: 1, text: "Effectuez le transfert Orange Money vers le numéro ci-dessus." },
                { step: 2, text: "Notez précieusement l'ID de transaction reçu par SMS." },
                { step: 3, text: "Remplissez le formulaire de confirmation à droite." },
                { step: 4, text: "Votre accès Premium sera activé après vérification." },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-stone-100 shadow-sm">
                  <div className="w-8 h-8 bg-stone-900 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    {item.step}
                  </div>
                  <p className="text-stone-600 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200 space-y-6">
          <h3 className="text-xl font-serif italic mb-6">Confirmer mon paiement</h3>
          
          <form onSubmit={handleSubmitPayment} className="space-y-6">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-stone-400 mb-2">Votre numéro de téléphone</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ex: 695XXXXXX"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-stone-400 mb-2">ID de Transaction</label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Ex: OM123456789"
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-600 rounded-xl text-sm"
                >
                  <CheckCircle2 size={18} />
                  Paiement soumis avec succès ! Nous vérifions votre transaction.
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-stone-900 text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-stone-800 disabled:opacity-50 transition-all shadow-lg shadow-stone-900/20"
            >
              {isSubmitting ? (
                <>
                  <Clock className="animate-spin" size={20} />
                  Envoi en cours...
                </>
              ) : (
                <>
                  Confirmer le paiement
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Recent Payments */}
          {payments.length > 0 && (
            <div className="pt-8 border-t border-stone-100 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-stone-400">Historique récent</h4>
              <div className="space-y-3">
                {payments.map((p) => (
                  <div key={p.id} className="flex justify-between items-center p-3 bg-stone-50 rounded-xl border border-stone-100">
                    <div className="space-y-1">
                      <div className="text-xs font-medium">{p.transactionId}</div>
                      <div className="text-[10px] text-stone-400">{new Date(p.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                      p.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 
                      p.status === 'failed' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {p.status === 'completed' ? 'Vérifié' : p.status === 'failed' ? 'Échoué' : 'En attente'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
