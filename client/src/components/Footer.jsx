export default function Footer() {
  return (
    <footer className="ayush-footer">
      <div className="footer-top">
        <div className="footer-col">
          <div className="footer-brand">
            <span className="footer-leaf">🌿</span>
            <h4>Ministry of Ayush</h4>
          </div>
          <p className="footer-desc">
            An initiative under the National Ayush Mission (NAM) bridging academic institutions, 
            research councils, and leading industry partners in Ayurveda, Yoga, Naturopathy, 
            Unani, Siddha, and Homeopathy.
          </p>
          <div className="ayush-chips">
            <span className="chip">Ayurveda</span>
            <span className="chip">Yoga</span>
            <span className="chip">Naturopathy</span>
            <span className="chip">Unani</span>
            <span className="chip">Siddha</span>
            <span className="chip">Homeopathy</span>
          </div>
        </div>

        <div className="footer-col">
          <h5>Statutory Councils & Institutes</h5>
          <ul className="footer-links">
            <li><a href="https://ccras.nic.in" target="_blank" rel="noreferrer">CCRAS (Ayurvedic Sciences)</a></li>
            <li><a href="https://ccrhindia.nic.in" target="_blank" rel="noreferrer">CCRH (Homeopathic Research)</a></li>
            <li><a href="https://ccrum.res.in" target="_blank" rel="noreferrer">CCRUM (Unani Medicine)</a></li>
            <li><a href="https://siddhacouncil.com" target="_blank" rel="noreferrer">CCRS (Siddha Research)</a></li>
            <li><a href="https://aiia.gov.in" target="_blank" rel="noreferrer">All India Institute of Ayurveda (AIIA)</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h5>Helpline & Regulatory Links</h5>
          <ul className="footer-links">
            <li>National Ayush Helpline: <strong>14443</strong> (Toll Free)</li>
            <li>Schedule T (GMP) Verification Guidelines</li>
            <li>E-Aushadhi Drug Licensing Portal</li>
            <li>Pharmacopoeia Commission for Indian Medicine (PCIM&H)</li>
            <li>Smart India Hackathon 2024–2026 Initiative</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>© 2026 Ministry of Ayush, Government of India. All Rights Reserved.</p>
          <p className="footer-meta">Academia-Industry Collaborative Skill Mapping & Placement Framework</p>
        </div>
      </div>
    </footer>
  );
}
