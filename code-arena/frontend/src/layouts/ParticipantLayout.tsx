// frontend/src/components/layout/ParticipantLayout.tsx
import { Outlet } from "react-router-dom";
import { ParticipantSidebar } from "../components/navigation/ParticipantSidebar";

export const ParticipantLayout = () => {
  return (
    <div className="participant-layout">
      <ParticipantSidebar />
      <main className="participant-main">
        <div className="participant-main-inner">
          <Outlet />
        </div>
      </main>

      <style>{`
        .participant-layout {
          min-height: 100vh;
          background: 
            radial-gradient(ellipse at top, rgba(41, 121, 255, 0.06), transparent 50%),
            radial-gradient(ellipse at bottom right, rgba(56, 189, 248, 0.05), transparent 50%),
            #080A14;
          position: relative;
        }

        .participant-layout::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse at center, black 30%, transparent 80%);
          pointer-events: none;
          z-index: 0;
        }

        .participant-main {
          margin-left: 260px;
          min-height: 100vh;
          padding: 32px 40px;
          position: relative;
          z-index: 1;
        }

        .participant-main-inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        @media (max-width: 900px) {
          .participant-main {
            margin-left: 0;
            padding: 80px 20px 32px;
          }
        }

        @media (max-width: 480px) {
          .participant-main {
            padding: 76px 16px 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default ParticipantLayout;
