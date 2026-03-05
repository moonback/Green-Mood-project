import { useState } from 'react';
import { Search, Coins, ShieldOff, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../lib/types';

interface AdminCustomersTabProps {
    customers: Profile[];
    onRefresh: () => void;
}

export default function AdminCustomersTab({ customers, onRefresh }: AdminCustomersTabProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
        if (!confirm(currentStatus ? 'Retirer les droits admin ?' : 'Donner les droits admin ?')) return;
        await supabase.from('profiles').update({ is_admin: !currentStatus }).eq('id', userId);
        onRefresh();
    };

    const filteredCustomers = customers.filter(
        (c) =>
            !searchQuery ||
            (c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.phone?.includes(searchQuery) ||
                c.id.includes(searchQuery))
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher un client…"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-green-primary"
                    />
                </div>
                <span className="text-sm text-zinc-500">
                    {filteredCustomers.length} client{filteredCustomers.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs text-zinc-500 uppercase tracking-wider border-b border-zinc-800 bg-zinc-800/50">
                                <th className="px-5 py-3">Client</th>
                                <th className="px-5 py-3">Téléphone</th>
                                <th className="px-5 py-3">Inscrit le</th>
                                <th className="px-5 py-3">Points fidélité</th>
                                <th className="px-5 py-3">Rôle</th>
                                <th className="px-5 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-zinc-800/20 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-green-neon/20 flex items-center justify-center text-green-neon font-bold text-sm flex-shrink-0">
                                                {(customer.full_name ?? 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white text-sm">
                                                    {customer.full_name ?? 'Utilisateur'}
                                                </p>
                                                <p className="text-xs text-zinc-600 font-mono">
                                                    {customer.id.slice(0, 12)}…
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-sm text-zinc-400">{customer.phone ?? '—'}</td>
                                    <td className="px-5 py-3.5 text-sm text-zinc-400">
                                        {new Date(customer.created_at).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <Coins className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                            <input
                                                type="number"
                                                min="0"
                                                defaultValue={customer.loyalty_points}
                                                onBlur={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    if (!isNaN(val) && val !== customer.loyalty_points) {
                                                        supabase
                                                            .from('profiles')
                                                            .update({ loyalty_points: val })
                                                            .eq('id', customer.id)
                                                            .then(() => onRefresh());
                                                    }
                                                }}
                                                className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-sm text-yellow-400 font-semibold focus:outline-none focus:border-green-primary"
                                            />
                                            <span className="text-xs text-zinc-500">pts</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full border ${customer.is_admin
                                                ? 'text-green-400 bg-green-900/30 border-green-800'
                                                : 'text-zinc-400 bg-zinc-800 border-zinc-700'
                                                }`}
                                        >
                                            {customer.is_admin ? 'Admin' : 'Client'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <button
                                            onClick={() => handleToggleAdmin(customer.id, customer.is_admin)}
                                            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${customer.is_admin
                                                ? 'text-red-400 border-red-800 hover:bg-red-900/20'
                                                : 'text-green-400 border-green-800 hover:bg-green-900/20'
                                                }`}
                                        >
                                            {customer.is_admin ? (
                                                <><ShieldOff className="w-3 h-3" />Retirer admin</>
                                            ) : (
                                                <><ShieldCheck className="w-3 h-3" />Passer admin</>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredCustomers.length === 0 && (
                    <p className="text-zinc-500 text-center py-10">Aucun client trouvé.</p>
                )}
            </div>
        </div>
    );
}
