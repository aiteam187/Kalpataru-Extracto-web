import React from "react";
import Navbar from "../components/layout/Navbar";

/**
 * Settings Page
 * Page for application settings
 */
const Settings = () => {
  return (
    <div>
      <Navbar />
      <main className="p-8">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Settings
          </h2>
          <p className="text-gray-600">
            Settings functionality will be implemented here
          </p>
        </div>
      </main>
    </div>
  );
};

export default Settings;
