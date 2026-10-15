import SearchCard from '../../components/SearchCard';
import StepCard from '../../components/StepCard';
import FeatureCard from '../../components/FeatureCard';
import RouteCard from '../../components/RouteCard';
import DemoCard from '../../components/DemoCard';
import Footer from '../../components/Footer';
import GoogleMapView from '../../components/GoogleMapView';
import AnimatedTruckAsphalt from '../../components/AnimatedTruckAsphalt';

export default function Home() {
  return (
    <div>
      {/* 1. HERO SECTION */}
      <section style={{ 
        backgroundColor: '#0B1F33',
        padding: '2rem 0 6rem 0',
        position: 'relative'
      }}>
        <div className="container">
          {/* Smooth Animated Large Truck on Asphalt Road Banner */}
          <AnimatedTruckAsphalt />

          <div className="hero-grid mt-8" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4rem',
            alignItems: 'center'
          }}>
            {/* Left Column */}
            <div>
              <span className="hero-badge" style={{
                display: 'inline-block',
                backgroundColor: 'rgba(200, 147, 58, 0.15)',
                color: '#C8933A',
                padding: '0.25rem 1rem',
                borderRadius: '2rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '1.5rem'
              }}>
                Ethiopia's #1 Digital Freight Marketplace
              </span>
              
              <h1 className="hero-title" style={{
                fontFamily: 'Instrument Serif, serif',
                fontSize: '4rem',
                lineHeight: '1.1',
                marginBottom: '1.5rem'
              }}>
                <span style={{ color: '#FFFFFF' }}>Move Your Cargo.<br /></span>
                <span style={{ color: '#C8933A' }}>Find the Right Truck.</span>
              </h1>
              
              <p className="hero-subtitle" style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '1.125rem',
                marginBottom: '2rem',
                maxWidth: '90%'
              }}>
                HabeshaFreight helps shippers find suitable trucks and move cargo efficiently across Ethiopia. Connect with trusted carriers and get your goods delivered safely.
              </p>
              
              <div className="hero-buttons" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <a
                  href="#search"
                  className="btn-primary"
                  style={{ fontSize: '1.125rem' }}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('search')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Find a Truck
                </a>
                <a href="/driver/dashboard" className="btn-secondary" style={{ fontSize: '1.125rem', backgroundColor: '#C8933A', color: '#FFFFFF', borderColor: '#C8933A' }}>
                  🚛 Driver Portal
                </a>
              </div>
            </div>

            {/* Right Column - Real Google Map view */}
            <div className="hero-visual" style={{
              borderRadius: '1rem',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(200, 147, 58, 0.3)'
            }}>
              <GoogleMapView
                originPos={{ lat: 9.0300, lng: 38.7400, label: 'Addis Ababa (Hub)' }}
                destinationPos={{ lat: 9.6000, lng: 41.8600, label: 'Dire Dawa' }}
                driverPos={{ lat: 9.2500, lng: 39.8500, label: 'Habesha Freight 🚚' }}
                speed={72}
                height="340px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUCK SEARCH CARD */}
      <section id="search" className="search-card" style={{ 
        marginTop: '-3rem', 
        marginBottom: '3rem', 
        position: 'relative', 
        zIndex: 10 
      }}>
        <div className="container">
          <SearchCard />
        </div>
      </section>

      {/* 3. HOW HABESHAFREIGHT WORKS */}
      <section id="how-it-works" className="bg-light section-padding">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="steps-title" style={{
            fontFamily: 'Instrument Serif, serif',
            fontSize: '3rem',
            marginBottom: '0.5rem'
          }}>
            How HabeshaFreight Works
          </h2>
          <p style={{ fontSize: '1.125rem', color: '#4a4a4a', marginBottom: '3rem' }}>
            Four simple steps to move your cargo anywhere in Ethiopia.
          </p>
          
          <div className="steps-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '2rem'
          }}>
            <StepCard number="01" title="Post Your Shipment" />
            <StepCard number="02" title="Receive Bids" />
            <StepCard number="03" title="Accept &amp; Track" />
            <StepCard number="04" title="Delivery Confirmed" />
          </div>
        </div>
      </section>

      {/* 4. FEATURES */}
      <section id="features" className="section-padding">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="features-title" style={{
            fontFamily: 'Instrument Serif, serif',
            fontSize: '3rem',
            marginBottom: '3rem'
          }}>
            Everything You Need to Ship
          </h2>
          
          <div className="features-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2rem'
          }}>
            <FeatureCard 
              icon="🔍"
              title="Truck Search"
              description="Find the right truck for your cargo from a network of trusted carriers across Ethiopia."
            />
            <FeatureCard 
              icon="🤝"
              title="Bidding &amp; Negotiation"
              description="Receive competitive bids and negotiate rates directly with carriers for the best deal."
            />
            <FeatureCard 
              icon="📦"
              title="Post a Shipment"
              description="Post your shipment details and let carriers come to you with their best offers."
            />
            <FeatureCard 
              icon="🔒"
              title="Secure Escrow"
              description="Your payment is held securely until delivery is confirmed, protecting both parties."
            />
            <FeatureCard 
              icon="📍"
              title="Live Tracking"
              description="Track your shipment in real-time with GPS tracking and estimated delivery times."
            />
            <FeatureCard 
              icon="💬"
              title="Direct Chat"
              description="Communicate directly with carriers through our built-in messaging system."
            />
          </div>
        </div>
      </section>

      {/* 5. KEY ETHIOPIAN CORRIDORS */}
      <section id="routes" className="bg-navy section-padding">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="routes-title" style={{
            fontFamily: 'Instrument Serif, serif',
            fontSize: '3rem',
            color: '#FFFFFF',
            marginBottom: '3rem'
          }}>
            Key Ethiopian Corridors
          </h2>
          
          <div className="routes-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.5rem'
          }}>
            <RouteCard from="Addis Ababa" to="Adama" />
            <RouteCard from="Adama" to="Hawassa" />
            <RouteCard from="Addis Ababa" to="Dire Dawa" />
            <RouteCard from="Addis Ababa" to="Bahir Dar" />
            <RouteCard from="Addis Ababa" to="Mekelle" />
            <RouteCard from="Hawassa" to="Jimma" />
          </div>

          {/* Interactive Google Map of Key Corridors */}
          <div style={{ marginTop: '2.5rem', borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <GoogleMapView
              originPos={{ lat: 9.0300, lng: 38.7400, label: 'Addis Ababa' }}
              destinationPos={{ lat: 11.5880, lng: 43.1450, label: 'Djibouti Corridor' }}
              driverPos={{ lat: 9.6000, lng: 41.8600, label: 'Dire Dawa Transit 🚚' }}
              speed={68}
              height="360px"
            />
          </div>
        </div>
      </section>

      {/* 5.5 FOR DRIVERS & CARRIERS SECTION */}
      <section className="section-padding" style={{ backgroundColor: '#0B1F33', color: '#FFFFFF', borderTop: '1px solid rgba(200, 147, 58, 0.2)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
            <div>
              <span style={{ color: '#C8933A', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                For Truckers &amp; Drivers
              </span>
              <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: '3rem', marginTop: '0.5rem', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                Keep Your Truck Loaded.<br /><span style={{ color: '#C8933A' }}>Maximize Earnings.</span>
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                Access thousands of verified cargo loads across Ethiopia. Submit instant bids, track active deliveries, receive milestone payments, and build your transport reputation.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <a href="/driver/dashboard" style={{
                  display: 'inline-block',
                  backgroundColor: '#C8933A',
                  color: '#FFFFFF',
                  padding: '0.75rem 1.75rem',
                  borderRadius: '0.5rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'background 0.2s'
                }}>
                  Open Driver Dashboard →
                </a>
                <a href="/driver/requests/loads" style={{
                  display: 'inline-block',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#FFFFFF',
                  padding: '0.75rem 1.75rem',
                  borderRadius: '0.5rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  Browse Available Loads
                </a>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
                <h4 style={{ color: '#FFFFFF', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Instant Load Matching</h4>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>Find shipments along your return route to avoid empty backhauls.</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
                <h4 style={{ color: '#FFFFFF', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Fast Bidding</h4>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>Submit transparent rate quotes and get confirmed directly by shippers.</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📍</div>
                <h4 style={{ color: '#FFFFFF', marginBottom: '0.5rem', fontSize: '1.1rem' }}>GPS &amp; Milestones</h4>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>Update progress with single-tap checkpoint confirmations.</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💳</div>
                <h4 style={{ color: '#FFFFFF', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Guaranteed Payouts</h4>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>Escrow-backed payment protection upon proof of delivery.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TRY THE DEMO */}
      <section className="bg-light section-padding">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="demo-title" style={{
            fontFamily: 'Instrument Serif, serif',
            fontSize: '3rem',
            marginBottom: '3rem'
          }}>
            Try the Demo
          </h2>
          
          <div className="demo-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2rem'
          }}>
            <DemoCard 
              title="Shipper Dashboard"
              description="Post &amp; track shipments"
              route="/dashboard"
            />
            <DemoCard 
              title="Driver Dashboard"
              description="Find loads &amp; manage trips"
              route="/driver/dashboard"
            />
            <DemoCard 
              title="Company Dashboard"
              description="Manage fleet &amp; dispatch drivers"
              route="/company/dashboard"
            />
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA */}
      <section className="bg-gold section-padding">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="cta-title" style={{
            fontFamily: 'Instrument Serif, serif',
            fontSize: '3rem',
            color: '#070F19',
            marginBottom: '2rem'
          }}>
            Ready to Ship Smarter?
          </h2>
          
          <div className="cta-buttons" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <a href="/register" style={{
              display: 'inline-block',
              backgroundColor: '#070F19',
              color: '#FFFFFF',
              padding: '0.75rem 2rem',
              borderRadius: '0.5rem',
              fontWeight: '500',
              fontFamily: 'DM Sans, sans-serif',
              transition: 'all 0.2s',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0B1F33'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#070F19'}
            >
              Register as Shipper
            </a>
            <a href="/driver/dashboard" style={{
              display: 'inline-block',
              backgroundColor: '#FFFFFF',
              color: '#070F19',
              padding: '0.75rem 2rem',
              borderRadius: '0.5rem',
              fontWeight: '500',
              fontFamily: 'DM Sans, sans-serif',
              transition: 'all 0.2s',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F7FA'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
            >
              Open Driver Portal 🚛
            </a>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <Footer />
    </div>
  );
}