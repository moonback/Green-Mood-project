import { ShieldCheck, ShieldOff, Users } from 'lucide-react';
import type { Profile } from '../../lib/types';

export default function AdminCustomersTab({ customers, onToggleAdmin, onUpdateLoyaltyPoints }: {
  customers: Profile[]; onToggleAdmin: (id: string, isAdmin: boolean) => void; onUpdateLoyaltyPoints: (id: string, val: number) => void;
}) {
  return <div className="space-y-3">
    <h2 className="flex items-center gap-2"><Users className="w-5 h-5" />Clients ({customers.length})</h2>
    {customers.map((customer) => <div key={customer.id} className="border rounded p-2 flex justify-between">
      <span>{customer.full_name ?? customer.phone ?? customer.id}</span>
      <div className="flex gap-2 items-center">
        <input type="number" defaultValue={customer.loyalty_points} onBlur={(e) => onUpdateLoyaltyPoints(customer.id, parseInt(e.target.value) || 0)} className="w-20" />
        <button onClick={() => onToggleAdmin(customer.id, customer.is_admin)}>{customer.is_admin ? <ShieldOff className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}</button>
      </div>
    </div>)}
  </div>;
}
