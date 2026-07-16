import React, { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import {
  LayoutGrid,
  FileText,
  UserCheck,
  TrendingUp,
  Settings,
  UserPlus,
  LogOut,
  AlertCircle,
  Users,
} from "lucide-react";

/**
 * Sidebar Component with Custom Logout Dialogue Box
 */
const Sidebar = () => {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    activeMenu,
    navigateTo,
    logout,
  } = useAppContext();

  // State to control the visibility of the logout dialogue
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = [
    { name: "Dashboard", icon: LayoutGrid, key: "dashboard", disabled: false },
    { name: "Upload", icon: FileText, key: "upload", disabled: true },
    { name: "Master Data", icon: UserCheck, key: "vender", disabled: true },
    { name: "Reports", icon: TrendingUp, key: "reports", disabled: true },
    { name: "Settings", icon: Settings, key: "settings", disabled: true },
    {
      name: "User Management",
      icon: Users,
      key: "usermanagement",
      disabled: true,
    },
    // { name: "Add User", icon: UserPlus, key: "adduser", disabled: false },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* --- CUSTOM LOGOUT DIALOGUE BOX --- */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-[90%] max-w-md transform transition-all border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertCircle
                  className="text-red-600 dark:text-red-400"
                  size={24}
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Confirm Logout
              </h3>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to log out of Xtracto? You will need to sign
              in again to access your data.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutModal(false);
                  logout();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md transition-colors"
              >
                Logout Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div
        className={
          sidebarCollapsed
            ? "left-slidebar dark-shadow sidebar-none"
            : "left-slidebar dark-shadow sidebar-block"
        }
        style={{ width: sidebarCollapsed ? "97px" : "210px" }}
      >
        {/* Logo Section - UPDATED */}
        <div
          className="nav_swaraj_slogon"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: sidebarCollapsed ? "20px 0" : "20px 15px",
            marginBottom: "-5px",
          }}
        >
          <img
            src="/finallogo.png"
            className="Header_Logo"
            alt="Logo"
            style={{
              height: sidebarCollapsed ? "40px" : "50px",
              width: "auto",
              objectFit: "contain",
              transition: "all 0.3s ease",
            }}
          />
        </div>

        {/* Navigation */}
        <nav
          className="sidebar sidebar-offcanvas sidebar-no-logo"
          id="sidebar"
          style={{ marginTop: "-10px" }}
        >
          <ul className="nav d-block">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === activeMenu;
              const isDisabled = item.disabled;

              return (
                <li
                  key={item.key}
                  title={isDisabled ? `${item.name} (Coming Soon)` : item.name}
                  className={
                    isActive
                      ? "nav-item active"
                      : isDisabled
                        ? "nav-item sidebar_item disabled"
                        : "nav-item sidebar_item"
                  }
                >
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      if (isDisabled) return;
                      navigateTo(item.key);
                      if (window.innerWidth < 1024) {
                        setSidebarCollapsed(true);
                      }
                    }}
                    className={`nav-link ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
                    href="#"
                    style={
                      isDisabled
                        ? { cursor: "not-allowed", pointerEvents: "auto" }
                        : {}
                    }
                  >
                    <i className="ps-3 side_icon_fs">
                      <Icon size={20} />
                    </i>
                    <span
                      className="menu-title_m"
                      style={{ display: sidebarCollapsed ? "none" : "" }}
                    >
                      {item.name}
                    </span>
                  </a>
                </li>
              );
            })}

            {/* Logout */}
            <li title="Logout" className="nav-item sidebar_item logout-item">
              <a
                onClick={(e) => {
                  e.preventDefault();
                  setShowLogoutModal(true); // Open the dialogue instead of logging out immediately
                }}
                className="nav-link"
                href="#"
              >
                <i className="ps-3 side_icon_fs">
                  <LogOut size={20} />
                </i>
                <span
                  className="menu-title_m"
                  style={{ display: sidebarCollapsed ? "none" : "" }}
                >
                  Logout
                </span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
