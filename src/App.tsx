import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { useAuthStore } from "./store/authStore";
import { useSettingsStore } from "./store/settingsStore";
import SplashScreen from "./components/SplashScreen";

const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const Products = lazy(() => import("./pages/Products"));
const Quality = lazy(() => import("./pages/Quality"));
const Contact = lazy(() => import("./pages/Contact"));
const Legal = lazy(() => import("./pages/Legal"));
const Login = lazy(() => import("./pages/Login"));
const Catalog = lazy(() => import("./pages/Catalog"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const Account = lazy(() => import("./pages/Account"));
const Orders = lazy(() => import("./pages/Orders"));
const Addresses = lazy(() => import("./pages/Addresses"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const LoyaltyHistory = lazy(() => import("./pages/LoyaltyHistory"));
const MyReviews = lazy(() => import("./pages/MyReviews"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Referrals = lazy(() => import("./pages/Referrals"));
const POSPage = lazy(() => import("./pages/POSPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const initializeAuth = useAuthStore((s) => s.initialize);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);

  useEffect(() => {
    initializeAuth();
    fetchSettings();
  }, [initializeAuth, fetchSettings]);

  return (
    <BrowserRouter>
      <SplashScreen />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Routes admin - Outside of Layout to not have frontend header/footer */}
          <Route element={<AdminRoute />}>
            <Route path="admin" element={<Admin />} />
            <Route path="pos" element={<POSPage />} />
          </Route>

          <Route path="/" element={<Layout />}>
            {/* Pages publiques */}
            <Route index element={<Home />} />
            <Route path="boutique" element={<Shop />} />
            <Route path="produits" element={<Products />} />
            <Route path="qualite" element={<Quality />} />
            <Route path="contact" element={<Contact />} />
            <Route path="mentions-legales" element={<Legal />} />
            <Route path="connexion" element={<Login />} />

            {/* Catalogue en ligne */}
            <Route path="catalogue" element={<Catalog />} />
            <Route path="catalogue/:slug" element={<ProductDetail />} />
            <Route path="panier" element={<Cart />} />

            {/* Routes protégées (connexion requise) */}
            <Route element={<ProtectedRoute />}>
              <Route path="commande" element={<Checkout />} />
              <Route path="commande/confirmation" element={<OrderConfirmation />} />
              <Route path="compte" element={<Account />} />
              <Route path="compte/commandes" element={<Orders />} />
              <Route path="compte/adresses" element={<Addresses />} />
              <Route path="compte/abonnements" element={<Subscriptions />} />
              <Route path="compte/fidelite" element={<LoyaltyHistory />} />
              <Route path="compte/avis" element={<MyReviews />} />
              <Route path="compte/favoris" element={<Favorites />} />
              <Route path="compte/parrainage" element={<Referrals />} />
              <Route path="compte/profil" element={<Profile />} />
            </Route>

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
