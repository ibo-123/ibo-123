import React from 'react';
import { useParams } from 'react-router-dom';

const ServiceDetails = () => {
  const { id } = useParams();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-4">Service Details</h1>
      <p className="text-slate-600">Viewing details for service ID: {id}</p>
    </div>
  );
};

export default ServiceDetails;
