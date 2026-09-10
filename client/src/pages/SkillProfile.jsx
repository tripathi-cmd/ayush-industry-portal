import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentService, getTaxonomy } from '../services/api';
import { 
  Award, 
  BookOpen, 
  Plus, 
  X, 
  CheckCircle, 
  Sparkles, 
  Save,
  Info
} from 'lucide-react';

export default function SkillProfile() {
  const { user, updateUser } = useAuth();
  const [skills, setSkills] = useState(user?.profile?.skills || []);
  const [customSkill, setCustomSkill] = useState('');
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [degree, setDegree] = useState(user?.profile?.degree || '');
  const [institution, setInstitution] = useState(user?.profile?.institution || '');
  const [location, setLocation] = useState(user?.profile?.location || '');
  const [phone, setPhone] = useState(user?.profile?.phone || '');
  const [taxonomy, setTaxonomy] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchTax() {
      try {
        const tax = await getTaxonomy();
        setTaxonomy(tax);
      } catch (err) {
        console.error("Failed to load skill taxonomy:", err);
      }
    }
    fetchTax();
  }, []);

  const handleAddSkill = (skillToAdd) => {
    const trimmed = skillToAdd.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills(prev => [...prev, trimmed]);
    }
    setCustomSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(prev => prev.filter(s => s !== skillToRemove));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    try {
      const res = await studentService.updateProfile({
        skills,
        bio,
        degree,
        institution,
        location,
        phone
      });
      updateUser(res.user);
      setMessage('Skill profile and academic credentials updated successfully.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="page-header-row">
        <div>
          <h2>Academic & Technical Skill Profile</h2>
          <p className="page-subtitle">
            Curate your verified competencies, technical skills, and academic background to power automated matching with industry internships.
          </p>
        </div>
      </div>

      {message && (
        <div className="alert-box alert-success" style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          backgroundColor: '#f0fdf4',
          color: '#166534',
          border: '1px solid #bbf7d0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={16} />
          <span>{message}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left: Skill Selection & Taxonomy */}
        <div>
          {/* Selected Skills Card */}
          <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} color="#2563eb" /> Active Skills ({skills.length})
            </h3>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px 0' }}>
              These skills are matched against recruiter requirements when calculating compatibility scores.
            </p>

            {skills.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                No skills added yet. Select from the taxonomy below or type custom skills.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {skills.map(sk => (
                  <span
                    key={sk}
                    style={{
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    {sk}
                    <X
                      size={14}
                      onClick={() => handleRemoveSkill(sk)}
                      style={{ cursor: 'pointer', opacity: 0.7 }}
                    />
                  </span>
                ))}
              </div>
            )}

            {/* Custom Skill Input */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <input
                type="text"
                placeholder="Add custom skill (e.g. Docker, GraphQL, System Design)..."
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(customSkill); } }}
                style={{ flex: 1, padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
              <button
                type="button"
                onClick={() => handleAddSkill(customSkill)}
                className="btn btn-outline"
                style={{ fontSize: '13px', padding: '0 16px' }}
              >
                <Plus size={16} /> Add
              </button>
            </div>
          </div>

          {/* Skill Taxonomy Browser */}
          <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="#059669" /> Industry Skill Taxonomy
            </h3>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px 0' }}>
              Click any skill below to add it to your profile.
            </p>

            {taxonomy ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Object.entries(taxonomy).map(([catKey, catData]) => (
                  <div key={catKey}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#334155', margin: '0 0 8px 0' }}>
                      {catData.name}
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {catData.skills.map(sk => {
                        const isAdded = skills.includes(sk);
                        return (
                          <button
                            key={sk}
                            type="button"
                            onClick={() => isAdded ? handleRemoveSkill(sk) : handleAddSkill(sk)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              border: isAdded ? '1px solid #2563eb' : '1px solid #e2e8f0',
                              background: isAdded ? '#eff6ff' : '#f8fafc',
                              color: isAdded ? '#1d4ed8' : '#475569',
                              cursor: 'pointer',
                              fontWeight: isAdded ? 600 : 400,
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isAdded ? `✓ ${sk}` : `+ ${sk}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '13px' }}>Loading taxonomy...</div>
            )}
          </div>
        </div>

        {/* Right: Academic & Contact Profile Form */}
        <div>
          <div className="card" style={{ background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} color="#2563eb" /> Academic Background
            </h3>

            <form onSubmit={handleSaveProfile}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Degree / Program</label>
                <input
                  type="text"
                  placeholder="e.g. B.Tech Computer Science, BCA"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Institution</label>
                <input
                  type="text"
                  placeholder="e.g. National Institute of Technology"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Location</label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, Karnataka"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Phone Number</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Professional Bio</label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of your academic projects and career objectives..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary btn-block"
                style={{ width: '100%', padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Save size={16} /> {isSaving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>

          {/* Document Verification Notice (Explicitly deferred per plan) */}
          <div className="card" style={{ background: '#f8fafc', borderRadius: '12px', padding: '18px', border: '1px dashed #cbd5e1', marginTop: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <Info size={18} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#334155' }}>Document Verification</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                  Digital credential upload and third-party certificate verification will be available in future releases.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
