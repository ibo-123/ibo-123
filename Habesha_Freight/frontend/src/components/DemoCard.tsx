import { Link } from 'react-router-dom';

interface DemoCardProps {
  title: string;
  description: string;
  route: string;
}

export default function DemoCard({ title, description, route }: DemoCardProps) {
  return (
    <Link to={route} style={{ textDecoration: 'none' }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        padding: '1.75rem 1.5rem',
        borderRadius: '0.75rem',
        border: '1.5px solid #e8eaed',
        textAlign: 'center',
        transition: 'all 0.25s ease-in-out',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(200, 147, 58, 0.18), 0 0 0 1px #C8933A';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = '#C8933A';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = '#e8eaed';
      }}
      >
        <h3 style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#0B1F33',
          marginBottom: '0.5rem'
        }}>
          {title}
        </h3>
        <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>
          {description}
        </p>
      </div>
    </Link>
  );
}