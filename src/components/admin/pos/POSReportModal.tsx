import { useState } from 'react';
import { motion } from 'motion/react';
import { FileText, FileCheck, Banknote, CreditCard, Smartphone, Package, Calculator, Printer, X, Lock } from 'lucide-react';
import { DailyReport } from './types';

interface POSReportModalProps {
    reportData: DailyReport;
    reportMode: 'view' | 'close';
    onClose: () => void;
    onFinalizeClose: (cashCounted: string) => void;
}

export default function POSReportModal({
    reportData,
    reportMode,
    onClose,
    onFinalizeClose,
}: POSReportModalProps) {
    const [cashCounted, setCashCounted] = useState<string>('');

    const panierMoyen = reportData.orderCount > 0 ? (reportData.totalSales / reportData.orderCount).toFixed(2) : '0.00';
    const bestSeller = Object.entries(reportData.productBreakdown || {}).sort((a, b) => b[1].qty - a[1].qty)[0];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl"
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                                {reportMode === 'view' ? <FileText className="w-6 h-6" /> : <FileCheck className="w-6 h-6 text-red-500" />}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {reportMode === 'view' ? 'Rapport de Lecture' : 'Clôture de Caisse'}
                                </h2>
                                <p className="text-xs text-zinc-500">Synthèse du {reportData.date.toLocaleDateString('fr-FR')}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-green-500/10 rounded-2xl p-4 border border-green-500/20 col-span-2 sm:col-span-1">
                                    <p className="text-[10px] text-green-400 uppercase font-black tracking-widest mb-1">Caisses Totales</p>
                                    <p className="text-3xl font-black text-white leading-none">{reportData.totalSales.toFixed(2)} €</p>
                                </div>
                                <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-800 flex flex-col justify-center">
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Commandes</p>
                                    <p className="text-2xl font-black text-white leading-none">{reportData.orderCount}</p>
                                </div>
                                <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-800 flex flex-col justify-center">
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Panier Moyen</p>
                                    <p className="text-xl font-bold text-white leading-none">{panierMoyen} €</p>
                                </div>
                                <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-800 flex flex-col justify-center">
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Top Vente</p>
                                    <p className="text-sm font-bold text-white truncate" title={bestSeller ? bestSeller[0] : '-'}>
                                        {bestSeller ? bestSeller[0] : '-'}
                                    </p>
                                    {bestSeller && <p className="text-xs text-green-400 font-bold mt-0.5">{bestSeller[1].qty} vendus</p>}
                                </div>
                            </div>

                            <div className="bg-zinc-800/30 rounded-2xl border border-zinc-800 divide-y divide-zinc-800">
                                <div className="p-4 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Banknote className="w-4 h-4 text-green-400" />
                                        <span className="text-sm text-zinc-300">Espèces</span>
                                    </div>
                                    <span className="text-sm font-bold text-white">{reportData.cashTotal.toFixed(2)} €</span>
                                </div>
                                <div className="p-4 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-blue-400" />
                                        <span className="text-sm text-zinc-300">Carte Bancaire</span>
                                    </div>
                                    <span className="text-sm font-bold text-white">{reportData.cardTotal.toFixed(2)} €</span>
                                </div>
                                <div className="p-4 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="w-4 h-4 text-purple-400" />
                                        <span className="text-sm text-zinc-300">Mobile</span>
                                    </div>
                                    <span className="text-sm font-bold text-white">{reportData.mobileTotal.toFixed(2)} €</span>
                                </div>
                            </div>

                        </div>

                        <div className="flex flex-col h-full space-y-4">
                            <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-800 flex justify-between items-center shrink-0">
                                <div>
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Articles vendus</p>
                                    <p className="text-lg font-bold text-white">{reportData.itemsSold} unités</p>
                                </div>
                                <Package className="w-8 h-8 text-zinc-700" />
                            </div>

                            {reportMode === 'close' && (
                                <div className="bg-zinc-800/50 rounded-2xl p-5 border-2 border-green-500/20 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                                            <Calculator className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white">Fond de caisse réel</h3>
                                            <p className="text-[10px] text-zinc-500 uppercase">Vérification des espèces</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-zinc-500 uppercase font-bold">Théorique (Système)</label>
                                            <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-700 text-white font-black text-sm">
                                                {reportData.cashTotal.toFixed(2)} €
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-green-400 uppercase font-bold">Réel (Compté)</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={cashCounted}
                                                    onChange={(e) => setCashCounted(e.target.value)}
                                                    className="w-full p-3 bg-zinc-950 rounded-xl border-2 border-green-500/30 focus:border-green-500 text-white font-black text-sm outline-none transition-all placeholder:text-zinc-800"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">€</span>
                                            </div>
                                        </div>
                                    </div>

                                    {cashCounted && (
                                        <div className={`p-3 rounded-xl flex justify-between items-center ${(parseFloat(cashCounted) - reportData.cashTotal) === 0
                                            ? 'bg-green-500/10 text-green-400'
                                            : 'bg-red-500/10 text-red-400'
                                            }`}>
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Écart de caisse :</span>
                                            <span className="text-sm font-black italic">
                                                {(parseFloat(cashCounted) - reportData.cashTotal).toFixed(2)} €
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Product Breakdown */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-[300px] max-h-[500px]">
                                <div className="bg-black/40 border border-zinc-800 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-zinc-800/50 text-zinc-500 uppercase font-black tracking-widest">
                                            <tr>
                                                <th className="px-4 py-2">Produit</th>
                                                <th className="px-4 py-2 text-center">Qté</th>
                                                <th className="px-4 py-2 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-800/50 text-zinc-300">
                                            {Object.entries(reportData.productBreakdown || {}).map(([name, stats]) => (
                                                <tr key={name}>
                                                    <td className="px-4 py-2.5 font-medium">{name}</td>
                                                    <td className="px-4 py-2.5 text-center font-bold text-white">{stats.qty}</td>
                                                    <td className="px-4 py-2.5 text-right font-bold text-green-400">{stats.total.toFixed(2)} €</td>
                                                </tr>
                                            ))}
                                            {Object.keys(reportData.productBreakdown || {}).length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-6 text-center text-zinc-600 italic">Aucun article vendu</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button
                            onClick={() => window.print()}
                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2"
                        >
                            <Printer className="w-5 h-5" />
                            Imprimer
                        </button>
                        {reportMode === 'view' ? (
                            <button
                                onClick={onClose}
                                className="flex-1 bg-green-500 hover:bg-green-400 text-black font-bold py-3 rounded-2xl transition-all"
                            >
                                OK
                            </button>
                        ) : (
                            <button
                                onClick={() => onFinalizeClose(cashCounted)}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
                            >
                                <Lock className="w-4 h-4" />
                                Confirmer la Clôture
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
