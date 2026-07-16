import React from "react";
import Navbar from "../components/layout/Navbar";

/**
 * Reports Page
 * Page for viewing and generating reports
 */
const Reports = () => {
  return (
    <div>
      <Navbar />
      <main className="p-8">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Reports</h2>
          <p className="text-gray-600">
            Reports functionality will be implemented here
          </p>
        </div>
      </main>
    </div>
  );
};

export default Reports;
