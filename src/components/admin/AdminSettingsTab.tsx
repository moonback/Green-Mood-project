import { Save, Store, Truck } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminSettingsTab({ localSettings, setLocalSettings, isSaving, saveSuccess, onSave, inputClassName, labelClassName }: any) {
  return <div className="space-y-6 pb-20">
    <div className="border rounded p-4"><h2 className="flex items-center gap-2"><Truck className="w-4 h-4" />Livraison</h2>
      <label className={labelClassName}>Frais livraison</label><input className={inputClassName} type="number" value={localSettings.delivery_fee} onChange={(e) => setLocalSettings({ ...localSettings, delivery_fee: parseFloat(e.target.value) || 0 })} />
    </div>
    <div className="border rounded p-4"><h2 className="flex items-center gap-2"><Store className="w-4 h-4" />Boutique</h2>
      <label className={labelClassName}>Nom</label><input className={inputClassName} value={localSettings.store_name} onChange={(e) => setLocalSettings({ ...localSettings, store_name: e.target.value })} />
    </div>
    <button onClick={onSave} disabled={isSaving} className="flex items-center gap-2"><Save className="w-4 h-4" />Sauvegarder</button>
    {saveSuccess && <motion.span>Paramètres enregistrés !</motion.span>}
  </div>;
}
