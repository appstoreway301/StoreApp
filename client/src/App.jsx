import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
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
import AdminPage from './pages/AdminPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminCategoriesPage from './pages/AdminCategoriesPage';
import AdminStockPage from './pages/AdminStockPage';
import AdminShipmentsPage from './pages/AdminShipmentsPage';
import AdminBranchesPage from './pages/AdminBranchesPage';
import ProfilePage from './pages/ProfilePage';
import AdminRoute from './components/AdminRoute';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/complete-registration" element={<CompleteRegistrationPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout/success" element={
                  <ProtectedRoute><CheckoutSuccessPage /></ProtectedRoute>
                } />
                <Route path="/checkout/cancel" element={
                  <ProtectedRoute><CheckoutCancelPage /></ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute><ProfilePage /></ProtectedRoute>
                } />
                <Route path="/orders" element={
                  <ProtectedRoute><OrdersPage /></ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <AdminRoute><AdminPage /></AdminRoute>
                } />
                <Route path="/admin/products" element={
                  <AdminRoute><AdminProductsPage /></AdminRoute>
                } />
                <Route path="/admin/categories" element={
                  <AdminRoute><AdminCategoriesPage /></AdminRoute>
                } />
                <Route path="/admin/stock" element={
                  <AdminRoute><AdminStockPage /></AdminRoute>
                } />
                <Route path="/admin/branches" element={
                  <AdminRoute><AdminBranchesPage /></AdminRoute>
                } />
                <Route path="/admin/shipments" element={
                  <AdminRoute><AdminShipmentsPage /></AdminRoute>
                } />
              </Routes>
            </Layout>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}