import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboard Pages
import AdminDashboard from './pages/dashboard/AdminDashboard';
import StaffDashboard from './pages/dashboard/StaffDashboard';
import CustomerPortal from './pages/dashboard/CustomerPortal';

// Modules
import ProductsList from './pages/products/ProductsList';
import PlansList from './pages/plans/PlansList';
import QuotationsList from './pages/quotations/QuotationsList';
import QuotationDetail from './pages/quotations/QuotationDetail';
import SubscriptionsList from './pages/subscriptions/SubscriptionsList';
import SubscriptionDetail from './pages/subscriptions/SubscriptionDetail';
import InvoicesList from './pages/invoices/InvoicesList';
import InvoiceDetail from './pages/invoices/InvoiceDetail';
import PaymentsList from './pages/payments/PaymentsList';
import TaxRulesList from './pages/taxes/TaxRulesList';
import DiscountsList from './pages/discounts/DiscountsList';
import CustomersList from './pages/customers/CustomersList';
import CustomerDetail from './pages/customers/CustomerDetail';
import StaffList from './pages/staff/StaffList';
import ReportsPage from './pages/reports/ReportsPage';
import ProfilePage from './pages/profile/ProfilePage';

function RootRedirect() {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === 'customer') return <Navigate to="/portal" replace />;
  if (role === 'staff') return <Navigate to="/staff" replace />;
  return <Navigate to="/admin" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Root Path Redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Protected App Layout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Staff Dashboard */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        {/* Customer Self-Service Portal */}
        <Route
          path="/portal"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/subscriptions"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <SubscriptionsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/subscriptions/:id"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <SubscriptionDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/plans"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <PlansList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/quotations"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <QuotationsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/quotations/:id"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <QuotationDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/invoices"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <InvoicesList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/invoices/:id"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <InvoiceDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/payments"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <PaymentsList />
            </ProtectedRoute>
          }
        />

        {/* Admin & Staff Common Operations */}
        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <ProductsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plans"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <PlansList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotations"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <QuotationsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quotations/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <QuotationDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscriptions"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <SubscriptionsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscriptions/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <SubscriptionDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <InvoicesList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <InvoiceDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <PaymentsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <CustomersList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <CustomerDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin-Only Settings */}
        <Route
          path="/taxes"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <TaxRulesList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/discounts"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DiscountsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <StaffList />
            </ProtectedRoute>
          }
        />

        {/* Profile Settings (All authenticated users) */}
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Catch-All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
