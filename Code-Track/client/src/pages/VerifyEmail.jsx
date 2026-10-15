import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    verifyEmail();
  }, []);

  const verifyEmail = async () => {
    try {
      const token = searchParams.get("token");

      if (!token) {
        setLoading(false);
        setVerified(false);
        setMessage("Verification token is missing.");
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/auth/verify-email?token=${token}`
      );

      setVerified(true);
      setMessage(response.data.message);

      toast.success(response.data.message);

      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (error) {
      setVerified(false);

      setMessage(
        error.response?.data?.message ||
        "Verification failed."
      );

      toast.error(
        error.response?.data?.message ||
        "Verification failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-slate-100">

      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md text-center">

        {loading ? (
          <>
            <Loader2
              className="mx-auto animate-spin text-blue-600"
              size={60}
            />

            <h2 className="text-2xl font-bold mt-6">
              Verifying Email...
            </h2>

            <p className="text-slate-500 mt-2">
              Please wait.
            </p>
          </>
        ) : verified ? (
          <>
            <CheckCircle
              className="mx-auto text-green-600"
              size={60}
            />

            <h2 className="text-2xl font-bold mt-6">
              Email Verified
            </h2>

            <p className="text-slate-500 mt-3">
              {message}
            </p>

            <p className="text-sm text-slate-400 mt-5">
              Redirecting to login...
            </p>
          </>
        ) : (
          <>
            <XCircle
              className="mx-auto text-red-600"
              size={60}
            />

            <h2 className="text-2xl font-bold mt-6">
              Verification Failed
            </h2>

            <p className="text-slate-500 mt-3">
              {message}
            </p>

            <button
              onClick={() => navigate("/login")}
              className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Back to Login
            </button>
          </>
        )}

      </div>
    </div>
  );
}

export default VerifyEmail;