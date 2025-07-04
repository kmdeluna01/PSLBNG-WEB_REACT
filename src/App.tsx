import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProductsLayout } from "@/components/layout/ProductsLayout";
import Products from "./pages/Products";
import EditProduct from "./pages/EditProduct";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { useEffect, useState } from "react";
import MerchantDetails from "./pages/Profile";
import PendingOrder from "./pages/Orders";
import SecuritySettings from "./pages/SecuritySettings";
import SalesDashboard from "./pages/Sales";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import { AdminLayout } from "./components/layout/AdminLayout";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/" />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/admin/"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/"
            element={
              <ProtectedRoute>
                <ProductsLayout>
                  <Dashboard />
                </ProductsLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/products"
            element={
              <ProtectedRoute>
                <ProductsLayout>
                  <Products />
                </ProductsLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products/:product_id/edit"
            element={
              <ProtectedRoute>
                <ProductsLayout>
                  <EditProduct />
                </ProductsLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/orders"
            element={
              <ProtectedRoute>
                <ProductsLayout>
                  <PendingOrder />
                </ProductsLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/details"
            element={
              <ProtectedRoute>
                <ProductsLayout>
                  <MerchantDetails />
                </ProductsLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/sales"
            element={
              <ProtectedRoute>
                <ProductsLayout>
                  <SalesDashboard />
                </ProductsLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/merchant/security-settings"
            element={
              <ProtectedRoute>
                <ProductsLayout>
                  <SecuritySettings />
                </ProductsLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;