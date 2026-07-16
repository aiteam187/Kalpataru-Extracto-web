// ============================================
// FILE: src/services/uploadService.js (SIMPLE VERSION)
// ============================================

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

/**
 * Upload and extract invoice data with simple real-time progress
 */
const uploadAndExtract = async (file, onProgress) => {
  try {
    console.log("📤 Uploading file:", file.name);
    console.log("🌐 Backend URL:", BACKEND_URL);

    const formData = new FormData();
    formData.append("files", file);

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      let uploadComplete = false;
      let processingInterval = null;
      let currentProgress = 0;

      // Track actual upload progress (0-50%)
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && !uploadComplete) {
          // Map upload to 0-50% of total progress
          currentProgress = Math.round((e.loaded / e.total) * 50);
          onProgress?.(currentProgress);
          console.log(`📊 Upload: ${currentProgress}%`);
        }
      });

      // When upload completes, simulate backend processing (50-95%)
      xhr.upload.addEventListener("load", () => {
        uploadComplete = true;
        currentProgress = 50;
        onProgress?.(50);
        console.log("✅ Upload complete, processing...");

        // Gradually increment progress while backend processes
        processingInterval = setInterval(() => {
          if (currentProgress < 95) {
            currentProgress += 2;
            onProgress?.(currentProgress);
            console.log(`🔄 Processing: ${currentProgress}%`);
          }
        }, 400); // Update every 400ms
      });

      // Handle successful response
      xhr.addEventListener("load", () => {
        // Clear interval
        if (processingInterval) {
          clearInterval(processingInterval);
        }

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            onProgress?.(98);
            const response = JSON.parse(xhr.responseText);

            // Validate response
            if (!response.files || response.files.length === 0) {
              onProgress?.(0);
              reject(new Error("No files processed in response"));
              return;
            }

            const fileData = response.files[0];

            // Check if rejected
            if (fileData.meta?.decision === "REJECTED") {
              onProgress?.(0);
              reject(
                new Error(
                  fileData.meta.verification_summary ||
                    "Document was rejected by OCR engine",
                ),
              );
              return;
            }

            // Complete
            onProgress?.(100);
            console.log("✅ Complete!");

            setTimeout(() => {
              resolve({
                success: true,
                data: response,
              });
            }, 300);
          } catch (error) {
            console.error("❌ Error parsing response:", error);
            onProgress?.(0);
            reject(new Error("Invalid response from server"));
          }
        } else {
          console.error("❌ Upload failed with status:", xhr.status);
          onProgress?.(0);
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      // Error handler
      xhr.addEventListener("error", () => {
        if (processingInterval) {
          clearInterval(processingInterval);
        }
        console.error("❌ Network error");
        onProgress?.(0);
        reject(new Error("Network error during upload"));
      });

      // Timeout handler
      xhr.addEventListener("timeout", () => {
        if (processingInterval) {
          clearInterval(processingInterval);
        }
        console.error("❌ Upload timeout");
        onProgress?.(0);
        reject(new Error("Upload timeout - please try again"));
      });

      // Configure and send
      const uploadUrl = `${BACKEND_URL}/auto-extract`;
      console.log("📡 Uploading to:", uploadUrl);

      xhr.open("POST", uploadUrl);
      xhr.timeout = 120000; // 2 minutes
      xhr.send(formData);
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    onProgress?.(0);
    return {
      success: false,
      error: error.message || "Upload failed",
    };
  }
};

/**
 * Check backend health
 */
const checkBackendHealth = async () => {
  try {
    const healthUrl = `${BACKEND_URL}/health`;
    console.log("🏥 Checking backend health:", healthUrl);

    const response = await fetch(healthUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const isHealthy = response.ok;
    console.log(isHealthy ? "✅ Backend is healthy" : "❌ Backend is down");
    return isHealthy;
  } catch (error) {
    console.error("❌ Backend health check failed:", error);
    return false;
  }
};

/**
 * Get backend URL
 */
const getBackendUrl = () => BACKEND_URL;

const uploadService = {
  uploadAndExtract,
  checkBackendHealth,
  getBackendUrl,
};

export default uploadService;
