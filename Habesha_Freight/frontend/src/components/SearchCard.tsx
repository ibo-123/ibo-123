import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchCard() {
  const navigate = useNavigate();
  const [fromCity, setFromCity] = useState('Addis Ababa');
  const [toCity, setToCity] = useState('Dire Dawa');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to loads marketplace with selected corridor filters
    navigate(`/driver/requests/loads?from=${encodeURIComponent(fromCity)}&to=${encodeURIComponent(toCity)}`);
  };

  return (
    <form onSubmit={handleSearch} className="search-grid" style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '1rem',
      padding: '2rem',
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr auto',
      gap: '1.5rem',
      alignItems: 'end'
    }}>
      <div>
        <label style={{ 
          display: 'block', 
          fontSize: '0.875rem', 
          fontWeight: '500', 
          color: '#4a4a4a',
          marginBottom: '0.5rem'
        }}>
          FROM (PICKUP CITY)
        </label>
        <select
          value={fromCity}
          onChange={(e) => setFromCity(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #e0e0e0',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            backgroundColor: '#FFFFFF',
            color: '#1a1a1a',
            fontFamily: 'DM Sans, sans-serif',
            cursor: 'pointer'
          }}
        >
          <option value="Addis Ababa">Addis Ababa</option>
          <option value="Adama">Adama</option>
          <option value="Hawassa">Hawassa</option>
          <option value="Dire Dawa">Dire Dawa</option>
          <option value="Bahir Dar">Bahir Dar</option>
          <option value="Mekelle">Mekelle</option>
          <option value="Jimma">Jimma</option>
          <option value="Djibouti">Djibouti</option>
        </select>
      </div>
      
      <div>
        <label style={{ 
          display: 'block', 
          fontSize: '0.875rem', 
          fontWeight: '500', 
          color: '#4a4a4a',
          marginBottom: '0.5rem'
        }}>
          TO (DESTINATION)
        </label>
        <select
          value={toCity}
          onChange={(e) => setToCity(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #e0e0e0',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            backgroundColor: '#FFFFFF',
            color: '#1a1a1a',
            fontFamily: 'DM Sans, sans-serif',
            cursor: 'pointer'
          }}
        >
          <option value="Dire Dawa">Dire Dawa</option>
          <option value="Addis Ababa">Addis Ababa</option>
          <option value="Adama">Adama</option>
          <option value="Hawassa">Hawassa</option>
          <option value="Bahir Dar">Bahir Dar</option>
          <option value="Mekelle">Mekelle</option>
          <option value="Jimma">Jimma</option>
          <option value="Djibouti">Djibouti</option>
        </select>
      </div>
      
      <button
        type="submit"
        className="search-btn"
        style={{
          backgroundColor: '#C8933A',
          color: '#FFFFFF',
          padding: '0.75rem 2rem',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '1rem',
          fontWeight: '600',
          fontFamily: 'DM Sans, sans-serif',
          cursor: 'pointer',
          transition: 'background-color 0.2s, transform 0.1s',
          whiteSpace: 'nowrap'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F0B84A'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C8933A'}
      >
        🔍 Find a Truck
      </button>
    </form>
  );
}