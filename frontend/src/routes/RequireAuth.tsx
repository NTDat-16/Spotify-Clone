// src/routes/RequireAuth.tsx
import { Navigate, useLocation } from "react-router-dom";

const RequireAuth = ({ children }: { children: JSX.Element }) => {
    const location = useLocation();
    const isLoggedIn = localStorage.getItem("token");

    if (!isLoggedIn) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default RequireAuth;