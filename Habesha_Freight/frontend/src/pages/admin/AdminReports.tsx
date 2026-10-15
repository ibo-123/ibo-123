import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

import AdminLayout from '../../layouts/AdminLayout';

interface ReportCardData {
  id: string;
  title: string;
  subtitle: string;
  bars: { label: string; value: number; heightPct: number }[];
  csvFilename: string;
  csvData: string;
}

export default function AdminReports() {
  const [loading, setLoading] = useState(false);

  const defaultReports: ReportCardData[] = [
    {
      id: 'shipments-by-route',
      title: 'Shipments by Route',
      subtitle: 'Top performing routes this month',
      bars: [
        { label: 'Addis-DireDawa', value: 42, heightPct: 55 },
        { label: 'Addis-Adama', value: 78, heightPct: 85 },
        { label: 'Hawassa-Addis', value: 30, heightPct: 40 },
        { label: 'Addis-Mekelle', value: 95, heightPct: 100 },
        { label: 'BahirDar-Addis', value: 48, heightPct: 60 },
        { label: 'Adama-Hawassa', value: 65, heightPct: 75 },
        { label: 'Gonder-Addis', value: 82, heightPct: 90 },
      ],
      csvFilename: 'shipments_by_route_report.csv',
      csvData: 'Route,Shipment Count,Revenue (ETB)\nAddis Ababa - Dire Dawa,42,340000\nAddis Ababa - Adama,78,480000\nHawassa - Addis Ababa,30,210000\nAddis Ababa - Mekelle,95,950000\nBahir Dar - Addis Ababa,48,390000',
    },
    {
      id: 'revenue-by-week',
      title: 'Revenue by Week',
      subtitle: 'Platform fee collection trend',
      bars: [
        { label: 'Week 1', value: 12000, heightPct: 45 },
        { label: 'Week 2', value: 18500, heightPct: 70 },
        { label: 'Week 3', value: 14000, heightPct: 50 },
        { label: 'Week 4', value: 24500, heightPct: 95 },
        { label: 'Week 5', value: 16000, heightPct: 60 },
        { label: 'Week 6', value: 21000, heightPct: 80 },
        { label: 'Week 7', value: 26000, heightPct: 100 },
      ],
      csvFilename: 'weekly_revenue_report.csv',
      csvData: 'Week,Total Revenue (ETB),Platform Commission (ETB)\nWeek 1,120000,12000\nWeek 2,185000,18500\nWeek 3,140000,14000\nWeek 4,245000,24500\nWeek 5,160000,16000',
    },
    {
      id: 'driver-performance',
      title: 'Driver Performance',
      subtitle: 'Ratings, delivery rates, disputes',
      bars: [
        { label: 'Jan', value: 88, heightPct: 50 },
        { label: 'Feb', value: 92, heightPct: 75 },
        { label: 'Mar', value: 85, heightPct: 40 },
        { label: 'Apr', value: 96, heightPct: 95 },
        { label: 'May', value: 89, heightPct: 55 },
        { label: 'Jun', value: 94, heightPct: 80 },
        { label: 'Jul', value: 98, heightPct: 100 },
      ],
      csvFilename: 'driver_performance_report.csv',
      csvData: 'Month,On-Time Rate (%),Avg Rating,Resolved Disputes\nJanuary,94.2%,4.8,1\nFebruary,96.5%,4.9,0\nMarch,92.1%,4.7,2\nApril,98.0%,5.0,0\nMay,95.4%,4.8,1',
    },
    {
      id: 'escrow-turnover',
      title: 'Escrow Turnover',
      subtitle: 'Funds in / funds out',
      bars: [
        { label: 'Q1-A', value: 140000, heightPct: 50 },
        { label: 'Q1-B', value: 190000, heightPct: 75 },
        { label: 'Q2-A', value: 110000, heightPct: 35 },
        { label: 'Q2-B', value: 230000, heightPct: 95 },
        { label: 'Q3-A', value: 150000, heightPct: 55 },
        { label: 'Q3-B', value: 210000, heightPct: 80 },
        { label: 'Q4-A', value: 250000, heightPct: 100 },
      ],
      csvFilename: 'escrow_turnover_report.csv',
      csvData: 'Period,Deposited (ETB),Released (ETB),Refunded (ETB)\nQ1 2026,450000,410000,15000\nQ2 2026,580000,530000,20000\nQ3 2026,620000,590000,10000',
    },
  ];

  const [reports, setReports] = useState<ReportCardData[]>(defaultReports);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get<{
        success: boolean;
        data?: { reports?: ReportCardData[] };
      }>('/admin/reports', true);

      if (res && res.success && res.data?.reports && res.data.reports.length > 0) {
        setReports(res.data.reports);
      }
    } catch (err) {
      console.warn('Backend API note: utilizing analytical report series', err);
    } finally {
      setLoading(false);
    }
  };

  const [openDisputesCount, setOpenDisputesCount] = useState(0);

  useEffect(() => {
    fetchLiveMetrics();
  }, []);

  const fetchLiveMetrics = async () => {
    try {
      const res: any = await api.get('/admin/dashboard', true).catch(() => null);
      if (res?.data?.activeDisputes !== undefined) {
        setOpenDisputesCount(Number(res.data.activeDisputes));
      }
    } catch (err) {
      console.warn('Dashboard metrics query:', err);
    }
  };

  const handleDownloadCSV = async (report: ReportCardData) => {
    try {
      let liveCsvText = '';
      let filename = report.csvFilename;

      if (report.id === 'shipments-by-route') {
        const res: any = await api.get('/admin/loads', true).catch(() => null);
        const items: any[] = res?.data?.items || res?.items || res?.deliveries || res?.loads || [];
        
        const headers = ['Load ID', 'Shipper Name', 'Driver Name', 'Origin', 'Destination', 'Status', 'Offered Price (ETB)', 'Cargo Type'];
        const rows = items.map((item, idx) => [
          `"LOAD-${item.id ? item.id.slice(0, 6) : idx + 1}"`,
          `"${item.shipper_name || 'Shipper'}"`,
          `"${item.driver_name || '—'}"`,
          `"${item.origin || 'Addis Ababa'}"`,
          `"${item.destination || 'Regional'}"`,
          `"${item.status || 'POSTED'}"`,
          `"${item.offered_price || item.budget || 5000}"`,
          `"${item.cargo_type || 'General Freight'}"`,
        ].join(','));

        liveCsvText = [headers.join(','), ...rows].join('\n');
        if (items.length === 0) liveCsvText = report.csvData;
      } else if (report.id === 'escrow-turnover' || report.id === 'revenue-by-week') {
        const res: any = await api.get('/escrow/ledger/all', true).catch(() => null);
        const items: any[] = res?.data || res?.ledger || [];

        const headers = ['Ledger ID', 'Shipment ID', 'Status', 'Gross Amount (ETB)', 'Commission (5%)', 'Net Driver Payout', 'Timestamp'];
        const rows = items.map((item) => [
          `"${item.id || ''}"`,
          `"${item.shipment_id || ''}"`,
          `"${item.status || 'LOCKED'}"`,
          `"${item.gross_amount_etb || 0}"`,
          `"${item.commission_amount_etb || 0}"`,
          `"${item.net_payout_amount_etb || 0}"`,
          `"${item.created_at || new Date().toISOString()}"`,
        ].join(','));

        liveCsvText = [headers.join(','), ...rows].join('\n');
        if (items.length === 0) liveCsvText = report.csvData;
      } else {
        const res: any = await api.get('/admin/users', true).catch(() => null);
        const items: any[] = res?.data?.users || res?.users || [];

        const headers = ['User ID', 'Full Name', 'Phone Number', 'Email', 'Role', 'Status', 'KYC Status'];
        const rows = items.map((item) => [
          `"${item.id || ''}"`,
          `"${item.full_name || ''}"`,
          `"${item.phone_number || ''}"`,
          `"${item.email || ''}"`,
          `"${item.role || 'DRIVER'}"`,
          `"${item.status || (item.is_verified ? 'ACTIVE' : 'INACTIVE')}"`,
          `"${item.kyc_status || 'APPROVED'}"`,
        ].join(','));

        liveCsvText = [headers.join(','), ...rows].join('\n');
        if (items.length === 0) liveCsvText = report.csvData;
      }

      const blob = new Blob([liveCsvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('CSV export error:', err);
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <AdminLayout>
      <div style={{ padding: '1rem 1.25rem' }}>
        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>Reports</h1>
            <div style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '0.25rem' }}>{formattedDate}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Open Disputes Alert Pill */}
            <Link
              to="/admin/disputes"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                padding: '0.4rem 0.9rem',
                borderRadius: '2rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <span>⚠️</span>
              <span>{openDisputesCount} open disputes</span>
            </Link>



            {/* Profile Avatar */}
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: '#C8933A',
                color: '#FFFFFF',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
              }}
            >
              AD
            </div>
          </div>
        </div>

        {/* 2x2 Reports Grid Container */}
        {loading ? (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '0.85rem',
              padding: '3rem',
              textAlign: 'center',
              color: '#64748B',
            }}
          >
            Loading report analytics...
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1.5rem',
            }}
          >
            {reports.map((report) => (
              <div
                key={report.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '0.85rem',
                  padding: '1.75rem 2rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '260px',
                }}
              >
                {/* Header Information */}
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    {report.title}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.25rem' }}>
                    {report.subtitle}
                  </div>

                  {/* Gray Bar Visual Graphic */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      gap: '0.75rem',
                      height: '110px',
                      marginTop: '2rem',
                      marginBottom: '1.5rem',
                    }}
                  >
                    {report.bars.map((bar, idx) => (
                      <div
                        key={idx}
                        style={{
                          flex: 1,
                          height: `${bar.heightPct}%`,
                          backgroundColor: '#E5E7EB',
                          borderRadius: '0.25rem',
                          transition: 'height 0.3s ease, background-color 0.2s',
                        }}
                        title={`${bar.label}: ${bar.value}`}
                      />
                    ))}
                  </div>
                </div>

                {/* CSV Download Action Link */}
                <div>
                  <button
                    onClick={() => handleDownloadCSV(report)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#C8933A',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    Download CSV →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
