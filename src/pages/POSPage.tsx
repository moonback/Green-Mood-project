import AdminPOSTab from '../components/admin/AdminPOSTab';
import SEO from '../components/SEO';

export default function POSPage() {
    return (
        <div className="min-h-screen bg-black overflow-hidden flex flex-col">
            <SEO title="Caisse POS — Green Moon CBD" description="Système de caisse pour vente en boutique." />
            <div className="flex-1 p-4 md:p-6">
                <AdminPOSTab />
            </div>
        </div>
    );
}
