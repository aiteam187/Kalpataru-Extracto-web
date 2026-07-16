import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { STORAGE_KEYS, DEFAULT_WAREHOUSE } from "../utils/constants";
import authService from "../services/authService";

const AppContext = createContext(undefined);

export const AppProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- User State (NO MOCKUSER FALLBACK) ---
  const [user, setUser] = useState(() => {
    const storedUser = authService.getUser();
    return storedUser || null; // Return null if no user, NOT mockUser
  });

  // --- Sidebar State (Responsive Default) ---
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SIDEBAR_STATE);
    if (saved !== null) return JSON.parse(saved);
    return window.innerWidth < 1024;
  });

  // --- Warehouse State ---
  const [selectedWarehouse, setSelectedWarehouse] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_WAREHOUSE);
    return saved || DEFAULT_WAREHOUSE;
  });

  // --- UI States ---
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [currentInvoiceId, setCurrentInvoiceId] = useState(null);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // --- Route to Menu Syncing ---
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/invoice/")) setActiveMenu("upload");
    else if (path.includes("/dashboard")) setActiveMenu("dashboard");
    else if (path.includes("/upload")) setActiveMenu("upload");
    else if (path.includes("/master-data")) setActiveMenu("vender");
    else if (path.includes("/blocked-vendors")) setActiveMenu("blocked-vendors");
    else if (path.includes("/reports")) setActiveMenu("reports");
    else if (path.includes("/settings")) setActiveMenu("settings");
    else if (path.includes("/add-user")) setActiveMenu("adduser");
    else if (path.includes("/user-management")) setActiveMenu("usermanagement");
  }, [location.pathname]);

  // --- Persistence Listeners ---
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.SIDEBAR_STATE,
      JSON.stringify(sidebarCollapsed),
    );
  }, [sidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_WAREHOUSE, selectedWarehouse);
  }, [selectedWarehouse]);

  // --- Update storage when user changes ---
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    }
  }, [user]);

  // --- Actions ---
  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  const showNotification = useCallback((message, type = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const navigateTo = (menuKey) => {
    setShowInvoiceDetail(false);
    setCurrentInvoiceId(null);

    const routeMap = {
      dashboard: "/dashboard",
      upload: "/upload",
      vender: "/master-data",
      reports: "/reports",
      settings: "/settings",
      adduser: "/add-user",
      usermanagement: "/user-management",
      "blocked-vendors": "/blocked-vendors",
      test: "/test",
    };

    const route = routeMap[menuKey] || `/${menuKey}`;

    if (window.innerWidth < 1024) {
      setSidebarCollapsed(true);
    }

    navigate(route);
  };

  const navigateToInvoiceDetail = (invoiceId) => {
    setCurrentInvoiceId(invoiceId);
    setShowInvoiceDetail(true);
    navigate(`/invoice/${invoiceId}`);
  };

  const logout = () => {
    // Clear all authentication data
    authService.logout();
    localStorage.clear();
    sessionStorage.clear();

    // Reset user state
    setUser(null);

    // Force redirect to login
    window.location.href = "/login";
  };

  const updateUser = (userData) => {
    setUser(userData);
    authService.setUser(userData);
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  };

  const value = {
    user,
    setUser,
    sidebarCollapsed,
    setSidebarCollapsed,
    toggleSidebar,
    activeMenu,
    setActiveMenu,
    selectedWarehouse,
    setSelectedWarehouse,
    globalLoading,
    setGlobalLoading,
    notification,
    showNotification,
    currentInvoiceId,
    setCurrentInvoiceId,
    showInvoiceDetail,
    setShowInvoiceDetail,
    navigateTo,
    navigateToInvoiceDetail,
    logout,
    updateUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};

export default AppContext;
