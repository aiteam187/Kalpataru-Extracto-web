import React, { useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

const LoginCard = ({
  identifier,
  setIdentifier,
  password,
  setPassword,
  onSubmit,
  loading,
  errors = {},
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-card-wrapper">
      {/* loginbox.png background */}
      <img src="/loginbox.png" alt="" className="login-card-box" />

      {/* loginblue.png overlay */}
      <img src="/loginblue.png" alt="" className="login-card-blue" />

      {/* Form content on top */}
      <div className="login-form">
        <h1 className="login-title">Loginn</h1>

        {errors.general && (
          <div className="login-error">
            <AlertCircle size={20} />
            <p>{errors.general}</p>
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Enter Your Email</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="admin@gmail.com"
              disabled={loading}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="XXX XXX"
                disabled={loading}
                className="form-input"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <span className="button-loading">
                <div className="spinner"></div> Processing...
              </span>
            ) : (
              "Proceed"
            )}
          </button>

          <p className="terms-text">
            By continuing, you agree to our{" "}
            <span className="terms-link">Terms of Service</span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginCard;
