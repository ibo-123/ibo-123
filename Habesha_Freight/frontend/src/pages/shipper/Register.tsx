import { useState, ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

type Role = 'shipper' | 'driver' | 'transport';

interface RoleOption {
  id: Role;
  icon: string;
  title: string;
  subtitle: string;
}

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState<'role' | 'details'>('role');
  const [selectedRole, setSelectedRole] = useState<Role>('shipper');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    licenseNumber: '',
    companyRegNumber: '',
  });

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const roles: RoleOption[] = [
    {
      id: 'shipper',
      icon: '📦',
      title: 'I need a truck',
      subtitle: 'Shipper',
    },
    {
      id: 'driver',
      icon: '🚚',
      title: 'I drive a truck',
      subtitle: 'Driver',
    },
    {
      id: 'transport',
      icon: '🏢',
      title: 'I manage a fleet',
      subtitle: 'Transport Company',
    },
  ];

  const roleLabels: Record<Role, string> = {
    shipper: 'Shipper',
    driver: 'Driver',
    transport: 'Transport Company',
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocumentFile(e.target.files[0]);
    }
  };

  const validateDetails = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email address';
    if (!formData.password.trim()) newErrors.password = 'Password is required';

    if (selectedRole === 'driver' && !formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'Driver license number is required';
    }
    if (selectedRole === 'transport' && !formData.companyRegNumber.trim()) {
      newErrors.companyRegNumber = 'Company registration number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateDetails()) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      const roleMapping: Record<Role, string> = {
        shipper: 'SHIPPER',
        driver: 'DRIVER',
        transport: 'FLEET_OWNER',
      };

      const payload = new FormData();
      payload.append('full_name', fullName);
      payload.append('email', formData.email.trim());
      payload.append('password', formData.password);
      payload.append('role', roleMapping[selectedRole]);
      if (formData.phoneNumber) payload.append('phone_number', formData.phoneNumber);

      if (selectedRole === 'driver') {
        payload.append('license_number', formData.licenseNumber);
      } else if (selectedRole === 'transport') {
        payload.append('company_registration_number', formData.companyRegNumber);
      }

      if (documentFile) {
        payload.append('document', documentFile);
      }

      const res: any = await register(payload);

      if (selectedRole === 'driver' || selectedRole === 'transport') {
        if (res?.token && res?.user) {
          localStorage.setItem('hf_token', res.token);
          localStorage.setItem('hf_user', JSON.stringify(res.user));
        }
        navigate('/pending-approval');
      } else {
        localStorage.setItem('registrationEmail', formData.email.trim());
        localStorage.setItem('registrationRole', selectedRole);
        navigate('/verify-otp');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      <header className="register-header">
        <div className="register-header-content">
          <Link to="/" className="register-back">
            ← Back
          </Link>
          <div className="register-brand">
            <span className="brand-icon">🚚</span>
            <span className="brand-habesha">Habesha</span>
            <span className="brand-freight">Freight</span>
          </div>
        </div>
      </header>

      <div className="register-page-content">
        <div className="register-card">
          <div className="register-switch">
            <Link to="/login" className="register-tab">Log In</Link>
            <button className="register-tab active">Register</button>
          </div>

          {step === 'role' && (
            <>
              <h1 className="register-welcome">Who are you?</h1>
              <p className="register-subtitle">Choose your role on HabeshaFreight.</p>

              <div className="role-list">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRole(r.id)}
                    className={`role-item ${selectedRole === r.id ? 'selected' : ''}`}
                  >
                    <div className="role-item-left">
                      <span className="role-item-icon">{r.icon}</span>
                      <div className="role-item-text">
                        <span className="role-item-title">{r.title}</span>
                        <span className="role-item-subtitle">{r.subtitle}</span>
                      </div>
                    </div>
                    {selectedRole === r.id && <span className="role-item-check">✓</span>}
                  </button>
                ))}
              </div>

              <button onClick={() => setStep('details')} className="register-continue-btn">
                Continue →
              </button>

              <div className="register-login-prompt">
                Already have an account? <Link to="/login" className="register-login-link">Log In</Link>
              </div>
            </>
          )}

          {step === 'details' && (
            <>
              <h1 className="register-welcome">Create Account</h1>
              <p className="register-subtitle">
                Registering as <strong>{roleLabels[selectedRole]}</strong>
              </p>

              {errorMessage && <div className="auth-error-banner">{errorMessage}</div>}

              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="register-details-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Dawit"
                      className={`form-input ${errors.firstName ? 'input-error' : ''}`}
                    />
                    {errors.firstName && <span className="input-error-text">{errors.firstName}</span>}
                  </div>

                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Bekele"
                      className={`form-input ${errors.lastName ? 'input-error' : ''}`}
                    />
                    {errors.lastName && <span className="input-error-text">{errors.lastName}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="dawit@example.com"
                    className={`form-input ${errors.email ? 'input-error' : ''}`}
                  />
                  {errors.email && <span className="input-error-text">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label>Phone Number <span className="field-optional">(optional)</span></label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="+251 912 345 678"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a strong password"
                    className={`form-input ${errors.password ? 'input-error' : ''}`}
                  />
                  {errors.password && <span className="input-error-text">{errors.password}</span>}
                </div>

                {/* Role-Specific KYC Inputs */}
                {selectedRole === 'driver' && (
                  <>
                    <div className="form-group">
                      <label>Driver License Number</label>
                      <input
                        type="text"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleInputChange}
                        placeholder="e.g. ET-LIC-887766"
                        className={`form-input ${errors.licenseNumber ? 'input-error' : ''}`}
                      />
                      {errors.licenseNumber && <span className="input-error-text">{errors.licenseNumber}</span>}
                    </div>

                    <div className="form-group">
                      <label>Driver License Document <span className="field-optional">(Photo / PDF)</span></label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="form-input file-input"
                      />
                    </div>
                  </>
                )}

                {selectedRole === 'transport' && (
                  <>
                    <div className="form-group">
                      <label>Company Registration Number</label>
                      <input
                        type="text"
                        name="companyRegNumber"
                        value={formData.companyRegNumber}
                        onChange={handleInputChange}
                        placeholder="e.g. ET-REG-2026-09"
                        className={`form-input ${errors.companyRegNumber ? 'input-error' : ''}`}
                      />
                      {errors.companyRegNumber && <span className="input-error-text">{errors.companyRegNumber}</span>}
                    </div>

                    <div className="form-group">
                      <label>Business License Certificate <span className="field-optional">(Photo / PDF)</span></label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="form-input file-input"
                      />
                    </div>
                  </>
                )}

                <div className="register-details-actions">
                  <button
                    type="button"
                    onClick={() => setStep('role')}
                    className="register-back-btn"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="register-next-btn"
                  >
                    {isSubmitting ? 'Registering...' : 'Register & Verify Email →'}
                  </button>
                </div>
              </form>

              <div className="register-login-prompt">
                Already have an account? <Link to="/login" className="register-login-link">Log In</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}