import { useState } from 'react';
import { updateUserProfile } from '../../services/authService';

export default function DriverSettings() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await updateUserProfile({ full_name: fullName || undefined, email: email || undefined });
      setMessage('Profile updated successfully.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>


      <div className="p2-card" style={{ maxWidth: '560px' }}>
        <form onSubmit={handleSave}>
          <div className="p2-form-group">
            <label className="p2-form-label">Full Name</label>
            <input className="p2-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="p2-form-group">
            <label className="p2-form-label">Email</label>
            <input className="p2-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {message && <p style={{ marginBottom: '1rem', color: message.includes('success') ? '#1e7e34' : '#c53030' }}>{message}</p>}
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
