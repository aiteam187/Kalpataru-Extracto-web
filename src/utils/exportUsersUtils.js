/**
 * Export Utilities for User Management - Enhanced Version
 * ALWAYS includes both Active and Inactive Users sheets
 * Supports XLSX (Excel) and PDF formats with enhanced formatting
 */

import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Exports user data to professionally formatted XLSX
 * ✅ ALWAYS creates Active Users and Inactive Users sheets (even if one is empty)
 */
export const exportUsersToExcel = (data, filename = "users_export") => {
  console.log("📊 exportUsersToExcel called with:", {
    dataLength: data?.length,
    filename,
    firstRecord: data?.[0],
  });

  if (!data || data.length === 0) {
    console.warn("⚠️ No user data to export to Excel");
    alert("No user data available to export");
    return false;
  }

  // ✅ SAFETY CHECK: Ensure data is properly formatted (Title Case headers)
  const firstKey = Object.keys(data[0])[0];
  console.log("🔍 First key in data:", firstKey);

  if (firstKey.includes("_")) {
    console.error(
      "❌ Export data contains raw database columns (snake_case). Please format data first.",
    );
    console.error(
      `❌ Found column: "${firstKey}" - Expected Title Case like "Employee Name"`,
    );
    alert("Export format error. Data must be formatted before export.");
    return false;
  }

  try {
    console.log(`📊 Exporting ${data.length} user records to Excel...`);

    // ==========================================
    // SPLIT DATA BY STATUS (Active/Inactive)
    // ==========================================
    const activeUsers = data.filter(
      (user) => user["Status"]?.toLowerCase() === "active",
    );
    const inactiveUsers = data.filter(
      (user) => user["Status"]?.toLowerCase() === "inactive",
    );

    console.log(
      `📊 Split: ${activeUsers.length} Active + ${inactiveUsers.length} Inactive`,
    );

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // ==========================================
    // HELPER FUNCTION: Create styled worksheet
    // ==========================================
    const createStyledWorksheet = (
      users,
      sheetName,
      showEmptyMessage = false,
    ) => {
      // ✅ CHANGED: Allow creating empty sheets with a message
      if (!users || users.length === 0) {
        if (showEmptyMessage) {
          console.log(`⚠️ Creating empty ${sheetName} sheet with message`);

          // Create a sheet with a "No users" message
          const emptySheet = XLSX.utils.aoa_to_sheet([
            [sheetName],
            [""],
            ["No users in this category"],
            [""],
            [`Total ${sheetName}: 0`],
            [""],
            [
              "This sheet will be populated when users are added to this status.",
            ],
          ]);

          // Style the header
          if (emptySheet["A1"]) {
            emptySheet["A1"].s = {
              font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
              fill: {
                fgColor: {
                  rgb: sheetName.includes("Active") ? "059669" : "DC2626",
                },
              },
              alignment: { horizontal: "center", vertical: "center" },
            };
          }

          // Set column width
          emptySheet["!cols"] = [{ wch: 60 }];

          return emptySheet;
        }

        console.log(`⚠️ No ${sheetName} users to export`);
        return null;
      }

      // Get only the columns that have data in these users
      const allKeys = new Set();
      users.forEach((user) => {
        Object.keys(user).forEach((key) => {
          // Only include if the column has at least one non-empty value
          const hasData = users.some((u) => {
            const val = u[key];
            return (
              val !== null && val !== undefined && val !== "" && val !== "-"
            );
          });
          if (hasData) allKeys.add(key);
        });
      });

      const headers = Array.from(allKeys);
      console.log(
        `📊 ${sheetName}: ${users.length} users, ${headers.length} columns`,
      );

      // Filter data to only include relevant columns
      const filteredData = users.map((user) => {
        const filtered = {};
        headers.forEach((header) => {
          filtered[header] = user[header];
        });
        return filtered;
      });

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(filteredData);

      // ==========================================
      // COLUMN WIDTH AUTO-SIZING
      // ==========================================
      const columnWidths = headers.map((header) => {
        if (!header) return { wch: 10 };

        const headerLength = header.length;
        const maxDataLength = Math.max(
          ...filteredData.map((row) => {
            const value = row[header];
            if (value === null || value === undefined || value === "") return 0;
            return String(value).length;
          }),
        );

        const contentWidth = Math.max(headerLength, maxDataLength);
        let minWidth = 10;
        let maxWidth = 50;

        const headerLower = header.toLowerCase();

        if (headerLower.includes("id") || headerLower.includes("emp id")) {
          minWidth = 12;
          maxWidth = 15;
        } else if (
          headerLower.includes("name") ||
          headerLower.includes("username")
        ) {
          minWidth = 15;
          maxWidth = 25;
        } else if (headerLower.includes("email")) {
          minWidth = 20;
          maxWidth = 35;
        } else if (
          headerLower.includes("phone") ||
          headerLower.includes("number")
        ) {
          minWidth = 12;
          maxWidth = 15;
        } else if (
          headerLower.includes("designation") ||
          headerLower.includes("location")
        ) {
          minWidth = 12;
          maxWidth = 20;
        } else if (headerLower.includes("status")) {
          minWidth = 10;
          maxWidth = 12;
        } else if (headerLower.includes("date")) {
          minWidth = 12;
          maxWidth = 18;
        }

        const finalWidth = Math.min(
          Math.max(contentWidth + 2, minWidth),
          maxWidth,
        );
        return { wch: finalWidth };
      });

      worksheet["!cols"] = columnWidths;

      // ==========================================
      // FREEZE HEADER ROW
      // ==========================================
      worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };

      // ==========================================
      // CELL STYLING
      // ==========================================
      const range = XLSX.utils.decode_range(worksheet["!ref"]);

      // Style header row (row 1)
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        const cell = worksheet[cellAddress];

        if (cell) {
          cell.s = {
            font: {
              bold: true,
              color: { rgb: "FFFFFF" },
              sz: 12,
              name: "Arial",
            },
            fill: {
              fgColor: {
                rgb: sheetName.includes("Active") ? "059669" : "DC2626",
              },
            },
            alignment: {
              horizontal: "center",
              vertical: "center",
              wrapText: true,
            },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "medium", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } },
            },
          };
        }
      }

      // Style data rows
      for (let row = range.s.r + 1; row <= range.e.r; row++) {
        const isEvenRow = row % 2 === 0;

        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellAddress];

          if (cell) {
            const header = headers[col];
            const value = cell.v;

            if (!header) continue;

            let numFmt = "General";
            const headerLower = header.toLowerCase();

            // Date formatting
            if (headerLower.includes("date") && value) {
              numFmt = "dd/mm/yyyy hh:mm";
            }

            // Status alignment
            let alignment = "left";
            if (headerLower.includes("status")) {
              alignment = "center";
            } else if (headerLower.includes("id")) {
              alignment = "center";
            } else if (headerLower.includes("phone")) {
              alignment = "center";
            }

            cell.s = {
              font: {
                name: "Arial",
                sz: 10,
              },
              fill: {
                fgColor: { rgb: isEvenRow ? "F8FAFC" : "FFFFFF" },
              },
              alignment: {
                horizontal: alignment,
                vertical: "center",
              },
              border: {
                top: { style: "thin", color: { rgb: "E2E8F0" } },
                bottom: { style: "thin", color: { rgb: "E2E8F0" } },
                left: { style: "thin", color: { rgb: "E2E8F0" } },
                right: { style: "thin", color: { rgb: "E2E8F0" } },
              },
              numFmt: numFmt,
            };
          }
        }
      }

      return worksheet;
    };

    // ==========================================
    // ✅ CREATE ACTIVE USERS SHEET (Always)
    // ==========================================
    const activeSheet = createStyledWorksheet(
      activeUsers,
      "Active Users",
      activeUsers.length === 0, // Show empty message if no active users
    );
    if (activeSheet) {
      XLSX.utils.book_append_sheet(workbook, activeSheet, "Active Users");
      console.log(
        `✅ Active Users sheet created (${activeUsers.length} users)`,
      );
    }

    // ==========================================
    // ✅ CREATE INACTIVE USERS SHEET (Always)
    // ==========================================
    const inactiveSheet = createStyledWorksheet(
      inactiveUsers,
      "Inactive Users",
      inactiveUsers.length === 0, // Show empty message if no inactive users
    );
    if (inactiveSheet) {
      XLSX.utils.book_append_sheet(workbook, inactiveSheet, "Inactive Users");
      console.log(
        `✅ Inactive Users sheet created (${inactiveUsers.length} users)`,
      );
    }

    // ==========================================
    // ADD ALL USERS SHEET (Combined)
    // ==========================================
    if (data.length > 0) {
      const allUsersSheet = createStyledWorksheet(data, "All Users");
      if (allUsersSheet) {
        XLSX.utils.book_append_sheet(workbook, allUsersSheet, "All Users");
        console.log(`✅ All Users sheet created (${data.length} users)`);
      }
    }

    // ==========================================
    // ADD METADATA SHEET (Summary Information)
    // ==========================================
    const metadataSheet = XLSX.utils.aoa_to_sheet([
      ["User Export Information"],
      [""],
      ["Export Date", new Date().toLocaleString()],
      ["Total Users", data.length],
      ["Active Users", activeUsers.length],
      ["Inactive Users", inactiveUsers.length],
      ["Filename", `${filename}.xlsx`],
      [""],
      ["Sheet Structure"],
      ["Sheet 1: Active Users - Contains only active user accounts"],
      [
        `   ${activeUsers.length === 0 ? "⚠️ Currently empty - No active users" : `✅ ${activeUsers.length} active users`}`,
      ],
      ["Sheet 2: Inactive Users - Contains inactive/disabled user accounts"],
      [
        `   ${inactiveUsers.length === 0 ? "⚠️ Currently empty - No inactive users" : `✅ ${inactiveUsers.length} inactive users`}`,
      ],
      ["Sheet 3: All Users - Contains complete user directory"],
      [""],
      ["Notes"],
      ["• Both Active and Inactive sheets are always included"],
      ["• Empty sheets show a message when no users are in that status"],
      ["• Empty/null columns are automatically removed for cleaner export"],
      ["• Password fields are not included in exports for security"],
      ["• Data is split by status for easier management"],
    ]);

    // Style metadata sheet
    if (metadataSheet["A1"]) {
      metadataSheet["A1"].s = {
        font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F46E5" } },
        alignment: { horizontal: "center", vertical: "center" },
      };
    }

    // Style headers
    ["A3", "A4", "A5", "A6", "A7"].forEach((cell) => {
      if (metadataSheet[cell]) {
        metadataSheet[cell].s = {
          font: { bold: true, sz: 11 },
          fill: { fgColor: { rgb: "F1F5F9" } },
        };
      }
    });

    // Style section headers
    ["A9", "A14"].forEach((cell) => {
      if (metadataSheet[cell]) {
        metadataSheet[cell].s = {
          font: { bold: true, sz: 11 },
          fill: { fgColor: { rgb: "F1F5F9" } },
        };
      }
    });

    // Set column widths for metadata sheet
    metadataSheet["!cols"] = [{ wch: 20 }, { wch: 70 }];

    XLSX.utils.book_append_sheet(workbook, metadataSheet, "Export Info");

    // ==========================================
    // WRITE FILE
    // ==========================================
    XLSX.writeFile(workbook, `${filename}.xlsx`, {
      bookType: "xlsx",
      bookSST: false,
      type: "binary",
    });

    console.log(`✅ Excel file exported successfully: ${filename}.xlsx`);
    console.log(`   - Total: ${data.length} users`);
    console.log(`   - Active: ${activeUsers.length} users`);
    console.log(`   - Inactive: ${inactiveUsers.length} users`);
    console.log(`   - Sheets: ${workbook.SheetNames.length}`);
    console.log(`   - Sheet names: ${workbook.SheetNames.join(", ")}`);

    return true;
  } catch (error) {
    console.error("❌ Error exporting users to Excel:", error);
    console.error("❌ Error stack:", error.stack);
    alert(`Failed to export to Excel: ${error.message}`);
    return false;
  }
};

/**
 * Exports user data to professionally formatted PDF
 * ✅ ALWAYS includes both Active and Inactive Users sections (even if one is empty)
 */
export const exportUsersToPDF = (data, filename = "users_export") => {
  console.log("📄 exportUsersToPDF called with:", {
    dataLength: data?.length,
    filename,
    firstRecord: data?.[0],
  });

  if (!data || data.length === 0) {
    console.warn("⚠️ No user data to export to PDF");
    alert("No user data available to export");
    return false;
  }

  // ✅ SAFETY CHECK: Ensure data is properly formatted (Title Case headers)
  const firstKey = Object.keys(data[0])[0];
  console.log("🔍 First key in data:", firstKey);

  if (firstKey.includes("_")) {
    console.error(
      "❌ Export data contains raw database columns (snake_case). Please format data first.",
    );
    console.error(
      `❌ Found column: "${firstKey}" - Expected Title Case like "Employee Name"`,
    );
    alert("Export format error. Data must be formatted before export.");
    return false;
  }

  try {
    console.log(`📄 Exporting ${data.length} user records to PDF...`);

    // ==========================================
    // SPLIT DATA BY STATUS
    // ==========================================
    const activeUsers = data.filter(
      (user) => user["Status"]?.toLowerCase() === "active",
    );
    const inactiveUsers = data.filter(
      (user) => user["Status"]?.toLowerCase() === "inactive",
    );

    console.log(
      `📄 Split: ${activeUsers.length} Active + ${inactiveUsers.length} Inactive`,
    );

    // ==========================================
    // CREATE PDF DOCUMENT
    // ==========================================
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // ==========================================
    // PDF HEADER (Title and Metadata)
    // ==========================================
    doc.setFontSize(18);
    doc.setTextColor(31, 41, 55);
    doc.setFont("helvetica", "bold");
    doc.text("User Management Export", 14, 15);

    // Metadata
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 14, 22);
    doc.text(`Total Users: ${data.length}`, 14, 27);
    doc.text(
      `Active: ${activeUsers.length} | Inactive: ${inactiveUsers.length}`,
      150,
      27,
    );

    let currentY = 35;
    const sectionInfo = [];

    // ==========================================
    // HELPER FUNCTION: Get columns with data
    // ==========================================
    const getColumnsWithData = (users) => {
      const allKeys = new Set();
      users.forEach((user) => {
        Object.keys(user).forEach((key) => {
          const hasData = users.some((u) => {
            const val = u[key];
            return (
              val !== null && val !== undefined && val !== "" && val !== "-"
            );
          });
          if (hasData) allKeys.add(key);
        });
      });

      return Array.from(allKeys);
    };

    // ==========================================
    // HELPER FUNCTION: Format cell value
    // ==========================================
    const formatCellValue = (header, value) => {
      if (value === null || value === undefined || value === "") return "-";

      if (header.toLowerCase().includes("date") && value instanceof Date) {
        return value.toLocaleDateString("en-IN");
      }
      if (header.toLowerCase().includes("date") && typeof value === "string") {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString("en-IN");
        }
      }

      const strValue = String(value);
      if (header.toLowerCase().includes("email")) {
        return strValue.length > 30
          ? strValue.substring(0, 27) + "..."
          : strValue;
      }

      return strValue.length > 40
        ? strValue.substring(0, 37) + "..."
        : strValue;
    };

    // ==========================================
    // ✅ HELPER FUNCTION: Create section table (handles empty sections)
    // ==========================================
    const createSectionTable = (users, sectionTitle, headerColor, startY) => {
      // ✅ CHANGED: Create empty message if no users
      if (!users || users.length === 0) {
        console.log(`⚠️ Creating empty ${sectionTitle} section`);

        doc.setFontSize(14);
        doc.setTextColor(31, 41, 55);
        doc.setFont("helvetica", "bold");
        doc.text(sectionTitle, 14, startY);

        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.setFont("helvetica", "normal");
        doc.text(`0 users in this category`, 14, startY + 5);

        // Add empty state message box
        doc.setFillColor(248, 250, 252); // Light gray background
        doc.rect(14, startY + 10, pageWidth - 28, 20, "F");

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "italic");
        doc.text(
          `No ${sectionTitle.toLowerCase()} at this time.`,
          pageWidth / 2,
          startY + 20,
          { align: "center" },
        );

        return {
          nextY: startY + 35,
          headers: [],
          totalColumns: 0,
          isEmpty: true,
        };
      }

      const headers = getColumnsWithData(users);
      const totalColumns = headers.length;

      console.log(
        `📄 ${sectionTitle}: ${users.length} users, ${totalColumns} columns`,
      );

      const rows = users.map((user) =>
        headers.map((header) => formatCellValue(header, user[header])),
      );

      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.setFont("helvetica", "bold");
      doc.text(sectionTitle, 14, startY);

      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.setFont("helvetica", "normal");
      doc.text(
        `${users.length} users | ${totalColumns} columns`,
        14,
        startY + 5,
      );

      let fontSize = 8;
      let cellPadding = 3;
      let headerFontSize = 9;

      if (totalColumns > 12) {
        fontSize = 6;
        cellPadding = 2;
        headerFontSize = 7;
      } else if (totalColumns > 8) {
        fontSize = 7;
        cellPadding = 2.5;
        headerFontSize = 8;
      }

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: startY + 8,

        styles: {
          fontSize: fontSize,
          cellPadding: cellPadding,
          overflow: "linebreak",
          halign: "left",
          valign: "middle",
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
          minCellWidth: 10,
        },

        headStyles: {
          fillColor: headerColor,
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
          fontSize: headerFontSize,
          cellPadding: cellPadding,
          minCellHeight: 8,
        },

        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },

        columnStyles: headers.reduce((acc, header, index) => {
          const headerLower = header.toLowerCase();

          if (
            headerLower.includes("status") ||
            headerLower.includes("id") ||
            headerLower.includes("phone")
          ) {
            acc[index] = { halign: "center" };
          }

          return acc;
        }, {}),

        margin: { top: 10, right: 10, bottom: 25, left: 10 },
        theme: "grid",
        tableWidth: "auto",
        showHead: "everyPage",

        didDrawPage: function (hookData) {
          const pageCount = doc.internal.getNumberOfPages();

          doc.setFontSize(8);
          doc.setTextColor(107, 114, 128);
          doc.setFont("helvetica", "normal");

          doc.text(
            `Page ${hookData.pageNumber} of ${pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: "center" },
          );

          doc.text("User Management System", 14, pageHeight - 10);

          doc.text(`${filename}.pdf`, pageWidth - 14, pageHeight - 10, {
            align: "right",
          });
        },
      });

      return {
        nextY: doc.lastAutoTable.finalY + 15,
        headers: headers,
        totalColumns: totalColumns,
        isEmpty: false,
      };
    };

    // ==========================================
    // ✅ CREATE ACTIVE USERS SECTION (Always)
    // ==========================================
    const activeInfo = createSectionTable(
      activeUsers,
      "Active Users",
      [5, 150, 105],
      currentY,
    );
    currentY = activeInfo.nextY;
    sectionInfo.push({
      name: "Active Users",
      users: activeUsers.length,
      columnsShown: activeInfo.headers.length,
      columnsTotal: activeInfo.totalColumns,
      columns: activeInfo.headers,
      isEmpty: activeInfo.isEmpty,
    });
    console.log(
      `✅ Active Users section created (${activeUsers.length} users)`,
    );

    // ==========================================
    // ✅ CREATE INACTIVE USERS SECTION (Always)
    // ==========================================
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = 15;
    }

    const inactiveInfo = createSectionTable(
      inactiveUsers,
      "Inactive Users",
      [220, 38, 38],
      currentY,
    );
    currentY = inactiveInfo.nextY;
    sectionInfo.push({
      name: "Inactive Users",
      users: inactiveUsers.length,
      columnsShown: inactiveInfo.headers.length,
      columnsTotal: inactiveInfo.totalColumns,
      columns: inactiveInfo.headers,
      isEmpty: inactiveInfo.isEmpty,
    });
    console.log(
      `✅ Inactive Users section created (${inactiveUsers.length} users)`,
    );

    // ==========================================
    // ADD SUMMARY PAGE
    // ==========================================
    doc.addPage();

    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    doc.setFont("helvetica", "bold");
    doc.text("Export Summary", 14, 15);

    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.setFont("helvetica", "normal");

    let summaryY = 25;

    doc.text("Export Information:", 14, summaryY);
    summaryY += 7;
    doc.setFontSize(9);
    doc.text(
      `• Export Date: ${new Date().toLocaleString("en-IN")}`,
      20,
      summaryY,
    );
    summaryY += 6;
    doc.text(`• Total Users: ${data.length}`, 20, summaryY);
    summaryY += 6;
    doc.text(`• Active Users: ${activeUsers.length}`, 20, summaryY);
    summaryY += 6;
    doc.text(`• Inactive Users: ${inactiveUsers.length}`, 20, summaryY);
    summaryY += 6;
    doc.text(`• Filename: ${filename}.pdf`, 20, summaryY);
    summaryY += 12;

    doc.setFontSize(10);
    doc.text("PDF Structure:", 14, summaryY);
    summaryY += 7;
    doc.setFontSize(9);

    sectionInfo.forEach((section, idx) => {
      doc.setFont("helvetica", "bold");
      doc.text(`• Section ${idx + 1}: ${section.name}`, 20, summaryY);
      summaryY += 5;
      doc.setFont("helvetica", "normal");

      if (section.isEmpty) {
        doc.text(`  - 0 users (empty section)`, 25, summaryY);
        summaryY += 5;
        doc.setTextColor(150, 150, 150);
        doc.text(`  - No data to display`, 25, summaryY);
        doc.setTextColor(107, 114, 128);
        summaryY += 8;
      } else {
        doc.text(`  - ${section.users} users`, 25, summaryY);
        summaryY += 5;
        doc.text(
          `  - ${section.totalColumns} columns (all columns with data)`,
          25,
          summaryY,
        );
        summaryY += 5;

        const previewCols = section.columns.slice(0, 6).join(", ");
        const remaining =
          section.columns.length > 6
            ? ` ... +${section.columns.length - 6} more`
            : "";
        doc.text(`  - Columns: ${previewCols}${remaining}`, 25, summaryY);
        summaryY += 8;
      }
    });

    summaryY += 2;
    doc.text(
      "• Both Active and Inactive sections always included",
      20,
      summaryY,
    );
    summaryY += 5;
    doc.text("• Empty sections show placeholder message", 20, summaryY);
    summaryY += 5;
    doc.text("• All columns with data are included", 20, summaryY);
    summaryY += 5;
    doc.text("• Empty/null columns automatically removed", 20, summaryY);
    summaryY += 5;
    doc.text("• Password fields excluded for security", 20, summaryY);
    summaryY += 5;
    doc.text(
      "• Font size adjusted for readability based on column count",
      20,
      summaryY,
    );
    summaryY += 12;

    doc.setFontSize(10);
    doc.text("Notes:", 14, summaryY);
    summaryY += 7;
    doc.setFontSize(9);
    doc.text(
      "• PDF includes all user data columns (matching Excel export)",
      20,
      summaryY,
    );
    summaryY += 6;
    doc.text(
      "• Smaller fonts used for sections with many columns",
      20,
      summaryY,
    );
    summaryY += 6;
    doc.text(
      "• Landscape orientation optimized for maximum column visibility",
      20,
      summaryY,
    );
    summaryY += 6;
    doc.text(
      "• Sensitive data like passwords are never included",
      20,
      summaryY,
    );

    // ==========================================
    // SAVE PDF
    // ==========================================
    doc.save(`${filename}.pdf`);

    console.log(`✅ PDF file exported successfully: ${filename}.pdf`);
    console.log(`   - Total: ${data.length} users`);
    console.log(`   - Active: ${activeUsers.length} users`);
    console.log(`   - Inactive: ${inactiveUsers.length} users`);
    console.log(`   - Pages: ${doc.internal.getNumberOfPages()}`);

    return true;
  } catch (error) {
    console.error("❌ Error exporting users to PDF:", error);
    console.error("❌ Error details:", error.message);
    console.error("❌ Error stack:", error.stack);
    alert(`Failed to export to PDF: ${error.message}`);
    return false;
  }
};

/**
 * Helper function to format date stamp for filenames
 */
export const getDateStamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}${month}${day}_${hours}${minutes}`;
};

/**
 * Helper function to prepare user data for export
 * Converts database column names to Title Case display names
 */
export const mapUserDataForExport = (rawUserData) => {
  console.log("🔄 mapUserDataForExport called with:", {
    dataLength: rawUserData?.length,
    firstRecord: rawUserData?.[0],
  });

  if (!rawUserData || rawUserData.length === 0) {
    console.warn("⚠️ No data to map for export");
    return [];
  }

  // Get all unique keys from the dataset
  const allKeys = new Set();
  rawUserData.forEach((user) => {
    Object.keys(user).forEach((key) => allKeys.add(key));
  });

  console.log("📊 All keys found in dataset:", Array.from(allKeys));

  return rawUserData.map((user) => {
    const mapped = {
      "Employee ID": user.Emp_Id || user.emp_id || "-",
      "Employee Name": user.Emp_Name || user.emp_name || user.name || "-",
      Username: user.Username || user.username || "-",
      Email: user.Emp_Email || user.emp_email || user.email || "-",
      "Phone Number":
        user.Phone_Number || user.phone_number || user.phone || "-",
      Designation: user.Designation || user.designation || user.role || "-",
      "Base Location":
        user.Base_Location || user.base_location || user.location || "-",
      Status: user.Status || user.status || "-",
      "Created At":
        user.Created_At || user.created_at
          ? new Date(user.Created_At || user.created_at).toLocaleDateString(
              "en-IN",
            )
          : "-",
      "Updated At":
        user.Updated_At || user.updated_at
          ? new Date(user.Updated_At || user.updated_at).toLocaleDateString(
              "en-IN",
            )
          : "-",
    };

    return mapped;
  });
};
