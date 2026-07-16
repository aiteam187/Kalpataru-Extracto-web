import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import OTPVerification from "./pages/OTPVerification";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import MasterData from "./pages/MasterData";
import BlockedVendorsList from "./pages/BlockedVendorsList";
import InvoiceDetail from "./pages/InvoiceDetail";
import AddUser from "./pages/AddUser";
import UserManagement from "./pages/UserManagement";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { AppProvider } from "./context/AppContext";
import "./App.css";
import "./index.css";

function App() {
  return (
    <AppProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="login" element={<Login />} />
        <Route path="otp-verification" element={<OTPVerification />} />

        {/* Protected Routes - With Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="upload" element={<Upload />} />
          <Route path="upload/:id" element={<Upload />} />
          <Route path="master-data" element={<MasterData />} />
          <Route path="blocked-vendors" element={<BlockedVendorsList />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="add-user" element={<AddUser />} />
          <Route path="user-management" element={<UserManagement />} />
          <Route path="invoice/:id" element={<InvoiceDetail />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="login" replace />} />
      </Routes>
    </AppProvider>
  );
}

export default App;
