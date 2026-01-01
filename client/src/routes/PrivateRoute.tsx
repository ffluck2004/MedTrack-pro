import { Redirect } from "wouter";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Redirect to="/login" />;
    }

    return children;
};

export default PrivateRoute;
