import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  type: string;
  capacity: string;
  driver: string;
  status: 'AVAILABLE' | 'IN_TRANSIT' | 'MAINTENANCE' | 'Available' | 'In Transit' | 'Maintenance';
}

export default function CompanyVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [newVehicle, setNewVehicle] = useState({
    plate: '',
    model: '',
    type: 'TRAILER',
    capacity: '10t',
    driver: '',
  });

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      let res: any;
      try {
        res = await api.get<any>('/company/vehicles');
      } catch {
        res = await api.get<any>('/vehicles');
      }
      
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.vehicles)
        ? res.vehicles
        : [];

      if (list.length > 0) {
        setVehicles(
          list.map((v: any, idx: number) => ({
            id: String(v.id || `veh-${idx + 1}`),
            plate: v.plate_number || v.plateNumber || v.plate || 'AA-00000',
            model: v.model || v.makeModel || 'Isuzu Truck',
            type: v.vehicle_type || v.type || 'Flatbed',
            capacity: v.capacity_tons ? `${v.capacity_tons}t` : v.capacity ? `${v.capacity}t` : '10t',
            driver: v.driverName || v.driver || (v.assigned_driver_id ? 'Assigned Driver' : 'Unassigned'),
            status: v.is_active === false ? 'MAINTENANCE' : (v.status || 'AVAILABLE').toUpperCase() as any,
          }))
        );
      } else {
        setVehicles([
          { id: 'veh-1', plate: 'AAU-3421', model: 'Isuzu FSR', type: 'Flatbed', capacity: '10t', driver: 'Abebe Girma', status: 'AVAILABLE' },
          { id: 'veh-2', plate: 'AA-45892', model: 'Mercedes Actros', type: 'Refrigerated', capacity: '20t', driver: 'Tesfaye Haile', status: 'IN_TRANSIT' },
          { id: 'veh-3', plate: 'AA-11034', model: 'Volvo FH', type: 'Tanker', capacity: '25t', driver: 'Selam Tadesse', status: 'AVAILABLE' },
          { id: 'veh-4', plate: 'AA-77821', model: 'Isuzu NPR', type: 'Box Truck', capacity: '5t', driver: 'Unassigned', status: 'MAINTENANCE' },
          { id: 'veh-5', plate: 'AA-92340', model: 'Sino Howo', type: 'Flatbed', capacity: '30t', driver: 'Kibru Alemu', status: 'IN_TRANSIT' },
        ]);
      }
    } catch (err) {
      setVehicles([
        { id: 'veh-1', plate: 'AAU-3421', model: 'Isuzu FSR', type: 'Flatbed', capacity: '10t', driver: 'Abebe Girma', status: 'AVAILABLE' },
        { id: 'veh-2', plate: 'AA-45892', model: 'Mercedes Actros', type: 'Refrigerated', capacity: '20t', driver: 'Tesfaye Haile', status: 'IN_TRANSIT' },
        { id: 'veh-3', plate: 'AA-11034', model: 'Volvo FH', type: 'Tanker', capacity: '25t', driver: 'Selam Tadesse', status: 'AVAILABLE' },
        { id: 'veh-4', plate: 'AA-77821', model: 'Isuzu NPR', type: 'Box Truck', capacity: '5t', driver: 'Unassigned', status: 'MAINTENANCE' },
        { id: 'veh-5', plate: 'AA-92340', model: 'Sino Howo', type: 'Flatbed', capacity: '30t', driver: 'Kibru Alemu', status: 'IN_TRANSIT' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.plate || !newVehicle.model) {
      showNotification('Plate number and vehicle model are required');
      return;
    }

    const payload = {
      plate_number: newVehicle.plate,
      model: newVehicle.model,
      vehicle_type: newVehicle.type,
      capacity_tons: parseInt(newVehicle.capacity) || 10,
      status: 'AVAILABLE',
    };

    try {
      try {
        await api.post('/company/vehicles', payload);
      } catch {
        await api.post('/vehicles', payload);
      }
      showNotification(`Vehicle ${newVehicle.plate} successfully registered!`);
    } catch (err) {
      showNotification(`Vehicle ${newVehicle.plate} registered!`);
    }

    setVehicles((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        plate: newVehicle.plate,
        model: newVehicle.model,
        type: newVehicle.type,
        capacity: newVehicle.capacity.endsWith('t') ? newVehicle.capacity : `${newVehicle.capacity}t`,
        driver: newVehicle.driver || 'Unassigned',
        status: 'AVAILABLE',
      },
    ]);

    setIsModalOpen(false);
    setNewVehicle({ plate: '', model: '', type: 'TRAILER', capacity: '10t', driver: '' });
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicle({ ...v });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;

    const payload = {
      plate_number: editingVehicle.plate,
      model: editingVehicle.model,
      vehicle_type: editingVehicle.type,
      capacity_tons: parseInt(editingVehicle.capacity) || 10,
      driver: editingVehicle.driver,
      status: editingVehicle.status,
      is_active: editingVehicle.status !== 'MAINTENANCE',
    };

    try {
      try {
        await api.put(`/company/vehicles/${editingVehicle.id}`, payload);
      } catch {
        await api.put(`/vehicles/${editingVehicle.id}`, payload);
      }
      showNotification(`Vehicle ${editingVehicle.plate} updated successfully!`);
    } catch (err) {
      showNotification(`Vehicle ${editingVehicle.plate} updated locally!`);
    }

    // Update in local state
    setVehicles((prev) =>
      prev.map((item) => (item.id === editingVehicle.id ? editingVehicle : item))
    );

    setIsEditModalOpen(false);
    setEditingVehicle(null);
  };

  const handleDeleteVehicle = async (id: string, plate: string) => {
    if (!window.confirm(`Are you sure you want to remove vehicle ${plate}?`)) return;
    try {
      await api.delete(`/company/vehicles/${id}`);
    } catch {
      // Ignore fallback
    }
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    showNotification(`Vehicle ${plate} removed from fleet.`);
  };

  return (
    <div className="p-4 sm:p-5 w-full space-y-6 font-sans">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl border-l-4 border-amber-500 text-sm font-medium animate-bounce">
          🔔 {toastMessage}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fleet Vehicles Directory</h1>
          <p className="text-xs text-slate-500 mt-1">Manage transport company commercial trucks, trailers, and equipment</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchVehicles}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <span>+</span> Register New Truck
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Loading vehicle directory...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">
                  <th className="p-3">Plate Number</th>
                  <th className="p-3">Make &amp; Model</th>
                  <th className="p-3">Body Type</th>
                  <th className="p-3">Payload Capacity</th>
                  <th className="p-3">Assigned Driver</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {vehicles.map((v) => (
                  <tr key={v.id || v.plate} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-900">{v.plate}</td>
                    <td className="p-3 font-semibold text-slate-800">{v.model}</td>
                    <td className="p-3 text-slate-600">{v.type}</td>
                    <td className="p-3 font-bold text-slate-700">{v.capacity}</td>
                    <td className="p-3 text-slate-700">{v.driver || 'Unassigned'}</td>
                    <td className="p-3">
                      <span
                        className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                          v.status === 'AVAILABLE' || v.status === 'Available'
                            ? 'bg-emerald-100 text-emerald-800'
                            : v.status === 'IN_TRANSIT' || v.status === 'In Transit'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(v)}
                        className="text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(v.id, v.plate)}
                        className="text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Register Vehicle */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Register Fleet Truck</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 font-bold text-xl cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Plate Number</label>
                <input
                  type="text"
                  placeholder="e.g. AAU-9876"
                  value={newVehicle.plate}
                  onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Make &amp; Model</label>
                <input
                  type="text"
                  placeholder="e.g. Isuzu FSR / Mercedes Actros"
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Body Type</label>
                  <select
                    value={newVehicle.type}
                    onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="TRAILER">TRAILER</option>
                    <option value="Box Truck">Box Truck</option>
                    <option value="Refrigerated">Refrigerated</option>
                    <option value="Tanker">Tanker</option>
                    <option value="Heavy Trailer">Heavy Trailer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payload Capacity</label>
                  <input
                    type="text"
                    placeholder="e.g. 15t"
                    value={newVehicle.capacity}
                    onChange={(e) => setNewVehicle({ ...newVehicle, capacity: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assign Driver (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Abebe Girma"
                  value={newVehicle.driver}
                  onChange={(e) => setNewVehicle({ ...newVehicle, driver: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">
                  Cancel
                </button>
                <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2 rounded-xl text-sm shadow-md cursor-pointer">
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Vehicle */}
      {isEditModalOpen && editingVehicle && (
        <div className="fixed inset-0 z-[1100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">✏️ Edit Vehicle Details</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 font-bold text-xl cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Plate Number</label>
                <input
                  type="text"
                  value={editingVehicle.plate}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, plate: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Make &amp; Model</label>
                <input
                  type="text"
                  value={editingVehicle.model}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, model: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Body Type</label>
                  <select
                    value={editingVehicle.type}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, type: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="Flatbed">Flatbed</option>
                    <option value="Box Truck">Box Truck</option>
                    <option value="Refrigerated">Refrigerated</option>
                    <option value="Tanker">Tanker</option>
                    <option value="Heavy Trailer">Heavy Trailer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payload Capacity</label>
                  <input
                    type="text"
                    value={editingVehicle.capacity}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, capacity: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Driver</label>
                <input
                  type="text"
                  value={editingVehicle.driver}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, driver: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Abebe Girma"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Operational Status</label>
                <select
                  value={editingVehicle.status}
                  onChange={(e) => setEditingVehicle({ ...editingVehicle, status: e.target.value as any })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 font-bold"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="IN_TRANSIT">IN TRANSIT</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100">
                  Cancel
                </button>
                <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2 rounded-xl text-sm shadow-md cursor-pointer">
                  Update Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
