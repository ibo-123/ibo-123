import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: '#070F19',
      padding: '3rem 0',
      borderTop: '1px solid rgba(255,255,255,0.05)'
    }}>
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2rem'
        }}>
          {/* Brand */}
          <div>
            <Link to="/" style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              fontFamily: 'DM Sans, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <span style={{ color: '#FFFFFF' }}>Habesha</span>
              <span style={{ color: '#C8933A' }}>Freight</span>
            </Link>
          </div>

          {/* Languages */}
          <div style={{
            display: 'flex',
            gap: '1.5rem',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.95rem'
          }}>
            <span style={{ color: '#FFFFFF', fontWeight: '500' }}>English</span>
            <span>አማርኛ</span>
            <span>Afaan Oromo</span>
          </div>
        </div>

        {/* Copyright */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '2rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.4)',
          fontSize: '0.875rem'
        }}>
          © 2026 HabeshaFreight. All rights reserved.
        </div>
      </div>
    </footer>
  );
}