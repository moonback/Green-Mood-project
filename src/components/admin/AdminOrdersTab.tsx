import { ChevronDown, ChevronUp, Package } from 'lucide-react';
import type { Order } from '../../lib/types';

export default function AdminOrdersTab({ orders, expandedOrder, setExpandedOrder, orderStatusFilter, setOrderStatusFilter, orderStatusOptions, onUpdateOrderStatus }: any) {
  return <div className="space-y-4">
    <div className="flex items-center gap-3"><Package className="w-5 h-5" /><select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}><option value="all">Tous</option>{orderStatusOptions.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
    {orders.map((order: Order) => <div key={order.id} className="border rounded p-3">
      <button className="w-full flex justify-between" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
        <span>#{order.id.slice(0, 8)} - {order.total.toFixed(2)}€</span>{expandedOrder === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expandedOrder === order.id && <div className="mt-2"><select value={order.status} onChange={(e) => onUpdateOrderStatus(order.id, e.target.value)}>{orderStatusOptions.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>}
    </div>)}
  </div>;
}
