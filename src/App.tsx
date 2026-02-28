import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Products from "./pages/Products";
import Quality from "./pages/Quality";
import Contact from "./pages/Contact";
import Legal from "./pages/Legal";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="boutique" element={<Shop />} />
          <Route path="produits" element={<Products />} />
          <Route path="qualite" element={<Quality />} />
          <Route path="contact" element={<Contact />} />
          <Route path="mentions-legales" element={<Legal />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
