import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../api/axios";

const VerifyEmail = () => {
    const [params] = useSearchParams();
    const [message, setMessage] = useState("Verifying...");

    useEffect(() => {
        const uidb64 = params.get("uid");
        const token = params.get("token");

        if (!uidb64 || !token) {
            setMessage("Invalid verification link");
            return;
        }

        api
            .get(`/auth/verify-email/?uidb64=${uidb64}&token=${token}`)
            .then(() => setMessage("Email verified successfully"))
            .catch(() => setMessage("Verification failed"));
    }, []);

    return (
        <div style={{ textAlign: "center", marginTop: 100 }}>
            <h2>{message}</h2>
            <Link to="/login">Go to Login</Link>
        </div>
    );
};

export default VerifyEmail;
