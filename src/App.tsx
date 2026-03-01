import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Products from "./pages/Products";
import Quality from "./pages/Quality";
import Contact from "./pages/Contact";
import Legal from "./pages/Legal";
import Login from "./pages/Login";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Account from "./pages/Account";
import Orders from "./pages/Orders";
import Addresses from "./pages/Addresses";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Subscriptions from "./pages/Subscriptions";
import LoyaltyHistory from "./pages/LoyaltyHistory";
import MyReviews from "./pages/MyReviews";
import Favorites from "./pages/Favorites";
import NotFound from "./pages/NotFound";
import { useAuthStore } from "./store/authStore";
import { useSettingsStore } from "./store/settingsStore";
import SplashScreen from "./components/SplashScreen";

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
      <Routes>
        {/* Routes admin - Outside of Layout to not have frontend header/footer */}
        <Route element={<AdminRoute />}>
          <Route path="admin" element={<Admin />} />
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
            <Route path="compte/profil" element={<Profile />} />
          </Route>

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
