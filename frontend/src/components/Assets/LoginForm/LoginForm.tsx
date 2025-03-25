import React, { useState, useRef } from "react";
import "./LoginForm.css";
import { MdOutlineMailOutline } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Ref để focus chuyển từ email -> password -> submit
  const passwordRef = useRef(null);
  const submitButtonRef = useRef(null);

  // Hàm xử lý sự kiện Enter
  const handleEnter = (e, nextFocus) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nextFocus?.current?.focus(); // Focus vào element tiếp theo
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="login-wrapper"> {/* Div bọc toàn bộ nội dung */}
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Log in to Spotify</h1>
            <p className="text-gray-600">{isLogin ? "Sign in to your account" : "Create a new account"}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="input-container">
                <MdOutlineMailOutline className="input-icon" />
                <input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => handleEnter(e, passwordRef)} // Chuyển focus sang password khi nhấn Enter
                  className="input-field text-black"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="input-container">
                <RiLockPasswordFill className="input-icon" />
                <input
                  id="password"
                  ref={passwordRef} // Ref cho password input
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => handleEnter(e, submitButtonRef)} // Focus sang nút Submit khi nhấn Enter
                  className="input-field text-black"
                  required
                />
              </div>
            </div>

            {/* Confirm Password (Only for Sign Up) */}
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  required
                />
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                ref={submitButtonRef} // Ref cho nút Submit
                className="btnSubmib py-2 px-4 bg-gray-800 text-white font-medium rounded-lg hover:bg-green-700"
              >
                {isLogin ? "Sign In" : "Sign Up"}
              </button>
            </div>
          </form>

          {/* Toggle between Sign In / Sign Up */}
          <div className="mt-6 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-black hover:text-blue-900">
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
