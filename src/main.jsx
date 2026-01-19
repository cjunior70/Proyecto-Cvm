import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// 👉 React Query
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// 🔥 Cliente global de cache
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos sin volver a pedir datos
      refetchOnWindowFocus: false, // no recargar al cambiar de pestaña
      retry: 1, // reintento si falla
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
