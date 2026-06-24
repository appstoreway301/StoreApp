import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';

// Pages públicas
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import CartPage from './pages/CartPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import CheckoutCancelPage from './pages/CheckoutCancelPage';
import CompleteRegistrationPage from './pages/CompleteRegistrationPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import Branches from './pages/admin/Branches';
import Shipments from './pages/admin/Shipments';
import Stock from './pages/admin/Stock';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* ===== RUTAS PÚBLICAS (con Layout) ===== */}
              <Route path="/" element={<Layout><HomePage /></Layout>} />
              <Route path="/about" element={<Layout><AboutPage /></Layout>} />
              <Route path="/products" element={<Layout><ProductsPage /></Layout>} />
              <Route path="/product/:id" element={<Layout><ProductDetailPage /></Layout>} />
              <Route path="/login" element={<Layout><LoginPage /></Layout>} />
              <Route path="/register" element={<Layout><RegisterPage /></Layout>} />
              <Route path="/verify-email" element={<Layout><VerifyEmailPage /></Layout>} />
              <Route path="/complete-registration" element={<Layout><CompleteRegistrationPage /></Layout>} />
              <Route path="/cart" element={<Layout><CartPage /></Layout>} />
              <Route path="/checkout/success" element={
                <Layout><ProtectedRoute><CheckoutSuccessPage /></ProtectedRoute></Layout>
              } />
              <Route path="/checkout/cancel" element={
                <Layout><ProtectedRoute><CheckoutCancelPage /></ProtectedRoute></Layout>
              } />
              <Route path="/profile" element={
                <Layout><ProtectedRoute><ProfilePage /></ProtectedRoute></Layout>
              } />
              <Route path="/orders" element={
                <Layout><ProtectedRoute><OrdersPage /></ProtectedRoute></Layout>
              } />

              {/* ===== RUTAS DEL ADMIN (SIN Layout, SOLO AdminLayout) ===== */}
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="branches" element={<Branches />} />
                <Route path="shipments" element={<Shipments />} />
                <Route path="stock" element={<Stock />} />
              </Route>
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}