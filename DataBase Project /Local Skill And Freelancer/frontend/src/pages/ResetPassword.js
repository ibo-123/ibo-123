import React from 'react';
import { useParams } from 'react-router-dom';

const ResetPassword = () => {
  const { token } = useParams();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-4">Reset Password</h1>
      <p className="text-slate-600">Use the token below to reset your password:</p>
      <pre className="mt-4 p-4 bg-slate-100 rounded">{token}</pre>
    </div>
  );
};

export default ResetPassword;
