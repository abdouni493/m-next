import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UploadProgressBar } from "@/components/UploadProgressBar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { useLocation } from "react-router-dom";

// Route-level code splitting: the storefront never downloads admin code and vice-versa.
const AppLayout = lazy(() => import("@/components/Layout/AppLayout").then((m) => ({ default: m.AppLayout })));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Sales = lazy(() => import("./pages/Sales"));
const FactureDuStock = lazy(() => import("./pages/FactureDuStock"));
const PurchaseInvoices = lazy(() => import("./pages/PurchaseInvoices"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const Employees = lazy(() => import("./pages/Employees"));
const Reports = lazy(() => import("./pages/Reports"));
const POS = lazy(() => import("./pages/POS"));
const Caisse = lazy(() => import("./pages/Caisse"));
const Barcodes = lazy(() => import("./pages/Barcodes"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const Profile = lazy(() => import("./pages/Profile"));
const Website_Enhanced = lazy(() => import("./pages/Website_Enhanced"));
const Commands = lazy(() => import("./pages/Commands"));
const Orders = lazy(() => import("./pages/Orders"));
const Catalogue = lazy(() => import("./pages/Catalogue"));
const Clients = lazy(() => import("./pages/Clients"));
const AccessDenied = lazy(() => import("./pages/AccessDenied"));

const ShopLayout = lazy(() => import("@/shop/components/ShopLayout").then((m) => ({ default: m.ShopLayout })));
const ShopHome = lazy(() => import("@/shop/pages/Home"));
const ShopCatalog = lazy(() => import("@/shop/pages/Catalog"));
const ShopProduct = lazy(() => import("@/shop/pages/Product"));
const ShopPromotions = lazy(() => import("@/shop/pages/Promotions"));
const ShopPacks = lazy(() => import("@/shop/pages/Packs"));
const ShopContact = lazy(() => import("@/shop/pages/Contact"));
const ShopCheckout = lazy(() => import("@/shop/pages/Checkout"));
import { AuthProvider, useAuth, isAdminRole, homeForRole } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import NotFound from "./pages/NotFound";
import { CommandPalette, useCommandPalette } from "./components/CommandPalette";
const WorkerSettings = lazy(() => import("@/workers/WorkerSettings"));

// ✅ import worker layout + worker dashboard
const WorkerDashboard = lazy(() => import("@/workers/WorkerDashboard"));
const WorkerLayout = lazy(() => import("@/workers/WorkerLayout").then((m) => ({ default: m.WorkerLayout })));

const queryClient = new QueryClient();

const FullScreenLoader = () => (
  <div className="flex h-dvh w-screen items-center justify-center bg-background" role="status" aria-label="Chargement">
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
  </div>
);

// Protected Route Component — waits for the Supabase session to be restored before deciding.
const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: "admin" | "employee" }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullScreenLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  const allowed = requiredRole === "admin" ? isAdminRole(user?.role) : requiredRole ? user?.role === requiredRole : true;
  if (!allowed) return <Navigate to={homeForRole(user?.role)} replace />;
  return <>{children}</>;
};

/** /login: already signed-in users go straight to their home page. */
const LoginRoute = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return <FullScreenLoader />;
  if (isAuthenticated) return <Navigate to={homeForRole(user?.role)} replace />;
  return <Login />;
};

const RouteFallback = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
  </div>
);

const AppContent = () => {
  const { isLoading } = useAuth();
  const { open, setOpen } = useCommandPalette();
  const { pathname } = useLocation();
  const isShop = pathname.startsWith("/website-shop");

  // Each guard (ProtectedRoute / LoginRoute) shows its own loader while the session is restored.
  void isLoading;

  return (
    <>
      {!isShop && <CommandPalette open={open} onOpenChange={setOpen} />}
      <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* LOGIN ROUTE */}
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/acces-refuse" element={<AccessDenied />} />

        {/* WEBSITE SHOP - PUBLIC ROUTES */}
        <Route element={<ShopLayout />}>
          <Route path="/website-shop" element={<ShopHome />} />
          <Route path="/website-shop/offers" element={<ShopCatalog />} />
          <Route path="/website-shop/product/:slug" element={<ShopProduct />} />
          <Route path="/website-shop/special-offers" element={<ShopPromotions />} />
          <Route path="/website-shop/packages" element={<ShopPacks />} />
          <Route path="/website-shop/contacts" element={<ShopContact />} />
          <Route path="/website-shop/order" element={<ShopCheckout />} />
          <Route path="/website-shop/checkout" element={<Navigate to="/website-shop/order" replace />} />
        </Route>
        <Route path="/admin" element={<Navigate to="/dashboard" replace />} />

        {/* DEFAULT ROUTE - REDIRECT TO WEBSITE SHOP */}
        <Route path="/" element={<Navigate to="/website-shop" replace />} />

        {/* ADMIN ROUTES */}
        <Route
          path="/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="clients" element={<Clients />} />
          <Route path="facturedustock" element={<FactureDuStock />} />
          <Route path="purchase-invoices" element={<PurchaseInvoices />} />
          <Route path="sales" element={<Sales />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="employees" element={<Employees />} />
          <Route path="reports" element={<Reports />} />
          <Route path="pos" element={<POS />} />
          <Route path="caisse" element={<Caisse />} />
          <Route path="barcodes" element={<Barcodes />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="website" element={<Website_Enhanced />} />
          <Route path="commands" element={<Orders />} />
          <Route path="commands/classique" element={<Commands />} />
          <Route path="catalogue" element={<Catalogue />} />
        </Route>

        {/* EMPLOYEE ROUTES */}
        <Route
          path="/employee/*"
          element={
            <ProtectedRoute requiredRole="employee">
              <WorkerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<WorkerDashboard />} />
          <Route path="pos" element={<POS />} />
          <Route path="sales" element={<Sales />} />
          <Route path="workersettings" element={<WorkerSettings />} />
        </Route>

        {/* 404 ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </>
  );
};

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <UploadProgressBar />
            <div className="min-h-screen bg-background transition-colors duration-300">
              <AppContent />
            </div>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
