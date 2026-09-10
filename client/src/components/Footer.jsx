import { Link } from 'react-router-dom';
import { Compass, Briefcase, GraduationCap, Building2, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="ayush-footer" style={{ borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
      <div className="footer-top">
        <div className="footer-col">
          <div className="footer-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #bfdbfe'
            }}>
              <Compass size={18} color="#2563eb" />
            </div>
            <h4 style={{ margin: 0, color: '#1e3a8a', fontSize: '18px', fontWeight: 700 }}>Skill Connect</h4>
          </div>
          <p className="footer-desc" style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.6' }}>
            A unified Academia–Industry Collaboration platform bridging students, academic institutions, 
            mentors, and recruiters with skill assessments, transparent job matching, and career development.
          </p>
          <div className="ayush-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
            <span className="chip" style={{ background: '#e0e7ff', color: '#3730a3' }}>Skill Assessment</span>
            <span className="chip" style={{ background: '#e0f2fe', color: '#0369a1' }}>Internships</span>
            <span className="chip" style={{ background: '#f0fdf4', color: '#166534' }}>Mentorship</span>
            <span className="chip" style={{ background: '#fef3c7', color: '#92400e' }}>Placements</span>
          </div>
        </div>

        <div className="footer-col">
          <h5 style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Portals</h5>
          <ul className="footer-links" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><Link to="/student" style={{ color: '#64748b', textDecoration: 'none', fontSize: '13px' }}>Student Dashboard</Link></li>
            <li><Link to="/recruiter" style={{ color: '#64748b', textDecoration: 'none', fontSize: '13px' }}>Recruiter Portal</Link></li>
            <li><Link to="/mentor" style={{ color: '#64748b', textDecoration: 'none', fontSize: '13px' }}>Academic & Industry Mentorship</Link></li>
            <li><Link to="/admin" style={{ color: '#64748b', textDecoration: 'none', fontSize: '13px' }}>Admin Console</Link></li>
            <li><Link to="/opportunities" style={{ color: '#64748b', textDecoration: 'none', fontSize: '13px' }}>Browse Opportunities</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h5 style={{ color: '#0f172a', fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Skill Development</h5>
          <ul className="footer-links" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><Link to="/assessment" style={{ color: '#64748b', textDecoration: 'none', fontSize: '13px' }}>Standardized Assessments</Link></li>
            <li><Link to="/skills" style={{ color: '#64748b', textDecoration: 'none', fontSize: '13px' }}>Technical & Soft Skill Profiles</Link></li>
            <li><span style={{ color: '#64748b', fontSize: '13px' }}>Explainable Skill Compatibility</span></li>
            <li><span style={{ color: '#64748b', fontSize: '13px' }}>Personalized Learning Milestones</span></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom" style={{ borderTop: '1px solid #e2e8f0', marginTop: '24px', paddingTop: '16px' }}>
        <div className="footer-bottom-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>
            © {new Date().getFullYear()} Skill Connect. All Rights Reserved.
          </p>
          <p className="footer-meta" style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>
            Academia–Industry Collaborative Skill Mapping & Placement Platform
          </p>
        </div>
      </div>
    </footer>
  );
}
