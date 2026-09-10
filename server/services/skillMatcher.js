/**
 * Skill Connect – Skill Matching Service
 * Deterministic, explainable skill-based matching using normalised exact matching.
 * No false substring matches (e.g. "Java" will NOT match "JavaScript").
 */

/** Shared skill taxonomy – common technical and soft skills */
export const SKILL_TAXONOMY = {
  technical: [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin',
    'React', 'Angular', 'Vue.js', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot',
    'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap',
    'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Firebase',
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes',
    'Git', 'CI/CD', 'REST APIs', 'GraphQL',
    'Machine Learning', 'Deep Learning', 'Data Analysis', 'Data Visualisation',
    'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
    'Figma', 'UI/UX Design', 'Adobe XD',
    'Cybersecurity', 'Networking', 'Linux Administration',
    'Blockchain', 'IoT', 'Embedded Systems',
    'Mobile Development', 'Android Development', 'iOS Development', 'Flutter', 'React Native'
  ],
  soft: [
    'Communication', 'Teamwork', 'Leadership', 'Problem Solving', 'Critical Thinking',
    'Time Management', 'Adaptability', 'Creativity', 'Emotional Intelligence',
    'Project Management', 'Presentation Skills', 'Negotiation',
    'Conflict Resolution', 'Decision Making', 'Analytical Thinking',
    'Attention to Detail', 'Work Ethic', 'Self-Motivation',
    'Public Speaking', 'Technical Writing', 'Research',
    'Customer Service', 'Collaboration', 'Strategic Planning'
  ]
};

/**
 * Normalises a skill string for comparison.
 * Lowercases, collapses whitespace, removes punctuation EXCEPT dots/hashes/plus
 * so "C++" stays "c++", "Node.js" stays "node.js", "C#" stays "c#".
 */
function normaliseSkill(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9.#+\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if two normalised skill strings match.
 * Uses exact token match, NOT substring, to avoid "java" matching "javascript".
 */
function skillsMatch(studentSkill, requiredSkill) {
  const s = normaliseSkill(studentSkill);
  const r = normaliseSkill(requiredSkill);
  if (!s || !r) return false;
  // Exact match
  return s === r;
}

/**
 * Calculates match percentage between student skills and opportunity requirements.
 * Returns deterministic, explainable results.
 */
export function calculateMatchScore(studentSkills = [], requiredSkills = []) {
  if (!requiredSkills || requiredSkills.length === 0) {
    return { matchScore: null, matchingSkills: [], missingSkills: [], message: 'No required skills specified' };
  }

  if (!studentSkills || studentSkills.length === 0) {
    return { matchScore: 0, matchingSkills: [], missingSkills: [...requiredSkills], message: 'No skills on profile' };
  }

  const matchingSkills = [];
  const missingSkills = [];

  for (const req of requiredSkills) {
    const found = studentSkills.some(st => skillsMatch(st, req));
    if (found) {
      matchingSkills.push(req);
    } else {
      missingSkills.push(req);
    }
  }

  const coverage = matchingSkills.length / requiredSkills.length;
  const matchScore = Math.round(coverage * 100);

  return {
    matchScore,
    matchingSkills,
    missingSkills,
    coverage
  };
}

/**
 * Generates skill gap advice based on missing skills.
 */
export function generateSkillGapAdvice(missingSkills = []) {
  if (missingSkills.length === 0) {
    return 'Your profile skills align well with the requirements!';
  }
  const top = missingSkills.slice(0, 3).join(', ');
  return `Consider building skills in: ${top}. Look for online courses, certifications, or project experience in these areas.`;
}
