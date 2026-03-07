import { useRef } from 'react';
import { motion } from 'motion/react';
import { Printer, RotateCcw } from 'lucide-react';
import { CompletedSale, PaymentMethod } from './types';

interface POSReceiptModalProps {
    sale: CompletedSale;
    storeName: string;
    storeAddress: string;
    storePhone: string;
    onClose: () => void;
    isLightTheme?: boolean;
}

export default function POSReceiptModal({
    sale,
    storeName,
    storeAddress,
    storePhone,
    onClose,
    isLightTheme
}: POSReceiptModalProps) {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const content = printRef.current?.innerHTML ?? '';
        const win = window.open('', '_blank', 'width=400,height=600');
        if (!win) return;
        win.document.write(`
      <html><head><title>Reçu</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: monospace; font-size: 13px; }
        body { padding: 16px; color: #000; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; }
        .big { font-size: 16px; font-weight: bold; }
      </style></head>
      <body>${content}</body></html>
    `);
        win.document.close();
        win.print();
    };

    const pmLabel: Record<PaymentMethod, string> = {
        cash: 'Espèces',
        card: 'Carte bancaire',
        mobile: 'Paiement mobile',
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`border rounded-2xl p-6 w-full max-w-sm shadow-2xl transition-all ${isLightTheme ? 'bg-white border-emerald-100' : 'bg-zinc-900 border border-zinc-700'}`}
            >
                {/* Receipt printable zone */}
                <div ref={printRef} className={`rounded-xl p-4 mb-4 font-mono text-xs leading-relaxed border transition-all ${isLightTheme ? 'bg-emerald-50/50 text-emerald-950 border-emerald-100' : 'bg-white text-black'}`}>
                    <div className="center bold text-sm">{storeName}</div>
                    <div className="center">{storeAddress}</div>
                    <div className="center">{storePhone}</div>
                    <div className="divider" />
                    <div className="center">TICKET DE CAISSE</div>
                    <div className="center">{sale.timestamp.toLocaleString('fr-FR')}</div>
                    <div className="center">N° {sale.shortId}</div>
                    <div className="divider" />
                    {sale.lines.map((l, i) => (
                        <div key={i}>
                            <div className="row">
                                <span className="bold">{l.product.name}</span>
                            </div>
                            <div className="row">
                                <span>{l.quantity} × {l.unitPrice.toFixed(2)} €</span>
                                <span>{(l.quantity * l.unitPrice).toFixed(2)} €</span>
                            </div>
                        </div>
                    ))}
                    <div className="divider" />
                    <div className="row"><span>Sous-total</span><span>{sale.subtotal.toFixed(2)} €</span></div>
                    {sale.discount > 0 && (
                        <div className="row"><span>Remise</span><span>−{sale.discount.toFixed(2)} €</span></div>
                    )}
                    {sale.promoDiscount != null && sale.promoDiscount > 0 && (
                        <div className="row"><span>Code promo ({sale.promoCode})</span><span>−{sale.promoDiscount.toFixed(2)} €</span></div>
                    )}
                    <div className="row big"><span>TOTAL</span><span>{sale.total.toFixed(2)} €</span></div>
                    <div className="divider" />
                    <div className="row"><span>Paiement</span><span>{pmLabel[sale.paymentMethod]}</span></div>
                    {sale.cashGiven != null && (
                        <>
                            <div className="row"><span>Reçu</span><span>{sale.cashGiven.toFixed(2)} €</span></div>
                            <div className="row bold"><span>Rendu</span><span>{(sale.change ?? 0).toFixed(2)} €</span></div>
                        </>
                    )}
                    <div className="divider" />
                    <div className="center italic">♻ Green Mood CBD</div>
                    {sale.loyaltyGained !== undefined && sale.loyaltyGained > 0 && (
                        <>
                            <div className="divider" />
                            <div className="center bold italic">Points gagnés: +{sale.loyaltyGained} pts</div>
                        </>
                    )}
                    {sale.loyaltyRedeemed !== undefined && sale.loyaltyRedeemed > 0 && (
                        <>
                            <div className="divider" />
                            <div className="center bold italic text-red-600">Points utilisés: -{sale.loyaltyRedeemed} pts</div>
                        </>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={handlePrint}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${isLightTheme ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20' : 'bg-green-500 hover:bg-green-600 text-black'}`}
                    >
                        <Printer className="w-4 h-4" />
                        Imprimer
                    </button>
                    <button
                        onClick={onClose}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${isLightTheme ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-100' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}
                    >
                        <RotateCcw className="w-4 h-4" />
                        Fermer
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
