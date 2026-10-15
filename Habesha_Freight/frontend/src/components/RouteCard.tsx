import { useNavigate } from 'react-router-dom';

interface RouteCardProps {
  from: string;
  to: string;
}

export default function RouteCard({ from, to }: RouteCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/driver/requests/loads?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: '1.5rem',
        borderRadius: '0.75rem',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(200, 147, 58, 0.15)';
        e.currentTarget.style.borderColor = '#C8933A';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div>
        <div style={{ color: '#FFFFFF', fontWeight: '500', fontSize: '1.125rem' }}>
          {from}
        </div>
      </div>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        color: '#C8933A',
        fontWeight: '300',
        fontSize: '0.875rem'
      }}>
        <span style={{ fontSize: '1.5rem' }}>→</span>
      </div>
      <div>
        <div style={{ color: '#FFFFFF', fontWeight: '500', fontSize: '1.125rem' }}>
          {to}
        </div>
      </div>
    </div>
  );
}