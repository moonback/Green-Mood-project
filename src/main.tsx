import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import { SEOProvider } from "./seo/SEOProvider.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <SEOProvider>
        <App />
      </SEOProvider>
    </ErrorBoundary>
  </StrictMode>,
);
