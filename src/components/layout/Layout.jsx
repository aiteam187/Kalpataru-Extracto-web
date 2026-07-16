// Update your Layout.jsx
import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = () => {
  const { sidebarCollapsed } = useAppContext();

  useEffect(() => {
    document.body.classList.add("page-with-gradient");
    return () => document.body.classList.remove("page-with-gradient");
  }, []);

  const sideMargin = 20;
  const sidebarWidth = sidebarCollapsed ? 97 : 210;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div
        className="main-wrapper"
        style={{
          marginLeft: `${sidebarWidth + sideMargin}px`,
          transition: "margin-left 0.3s ease",
        }}
      >
        {/* Navbar Container with proper margins */}
        <div
          style={{
            paddingLeft: "0px",
            paddingRight: `${sideMargin}px`,
          }}
        >
          <Navbar />
        </div>

        <main className="main-content" style={{ paddingTop: "90px" }}>
          <div
            className="content-wrapper"
            style={{
              padding: `0 ${sideMargin}px 20px ${sideMargin}px`,
            }}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
