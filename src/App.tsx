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
import Admin from "./pages/Admin";
import { useAuthStore } from "./store/authStore";
import { useSettingsStore } from "./store/settingsStore";

export default function App() {
  const initializeAuth = useAuthStore((s) => s.initialize);
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);

  useEffect(() => {
    initializeAuth();
    fetchSettings();
  }, [initializeAuth, fetchSettings]);

  return (
    <BrowserRouter>
      <Routes>
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
          </Route>

          {/* Routes admin */}
          <Route element={<AdminRoute />}>
            <Route path="admin" element={<Admin />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
