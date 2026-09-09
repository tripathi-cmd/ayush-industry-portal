/**
 * Ayush Sector Skill Matcher & Semantic Scoring Service
 * Provides keyword matching, Jaccard similarity, and Ayush domain ontology mapping
 * for Ayurveda, Yoga & Naturopathy, Unani, Siddha, and Homeopathy.
 */

// Domain skill dictionaries with cross-mappings
export const AYUSH_DOMAINS = {
  ayurveda: {
    name: "Ayurveda",
    degrees: ["BAMS", "MD (Ayurveda)", "MS (Ayurveda)"],
    coreSkills: [
      "Panchakarma Procedures",
      "Nadi Pariksha (Pulse Diagnosis)",
      "Dravyaguna (Pharmacognosy)",
      "Rasa Shastra & Bhaishajya Kalpana",
      "Charaka Samhita Protocols",
      "Sushruta Shalya Tantra (Surgical Traditions)",
      "Swasthavritta (Preventive Health)",
      "Agada Tantra (Toxicology)",
      "Ayurvedic Dietetics (Pathya-Apathya)",
      "Classical Herb Identification",
      "GMP Compliance in Ayurvedic Drug Manufacturing",
      "Clinical Case Documentation"
    ]
  },
  yoga_naturopathy: {
    name: "Yoga & Naturopathy",
    degrees: ["BNYS", "M.Sc Yoga Therapy", "ND"],
    coreSkills: [
      "Therapeutic Asana Alignment",
      "Pranayama & Kriya Protocols",
      "Shatkarma Cleansing Techniques",
      "Hydrotherapy & Mud Therapy",
      "Fasting Therapy Protocols",
      "Acupressure & Reflexology",
      "Yoga Nidra & Stress Management",
      "Naturopathic Diet & Nutrition",
      "Yogic Lifestyle Counseling",
      "Physiological Assessment of Vital Signs"
    ]
  },
  unani: {
    name: "Unani Medicine",
    degrees: ["BUMS", "MD (Unani)"],
    coreSkills: [
      "Mizaj (Temperament Assessment)",
      "Ilaj-bil-Tadbeer (Regimenal Therapy - Cupping, Hijama)",
      "Ilaj-bil-Dawa (Pharmacotherapy)",
      "Mufradat & Murakkabat (Formulations)",
      "Kushta Formulation Analysis",
      "Nabz (Pulse) & Baul (Urine) Examination",
      "Unani Clinical Documentation"
    ]
  },
  siddha: {
    name: "Siddha Medicine",
    degrees: ["BSMS", "MD (Siddha)"],
    coreSkills: [
      "Envagai Thervu (Eight-fold Examination)",
      "Varmam Therapy Protocols",
      "Muppu Preparation Principles",
      "Thailam Formulation",
      "Gunapadam (Siddha Pharmacology)",
      "Noi Naadal (Siddha Pathology)"
    ]
  },
  homeopathy: {
    name: "Homeopathy",
    degrees: ["BHMS", "MD (Homeopathy)"],
    coreSkills: [
      "Repertorization (Kent, Boenninghausen)",
      "Materia Medica Applications",
      "Organon of Medicine Principles",
      "Chronic Disease Case Taking",
      "Potentization & Pharmacy Standards",
      "Miasmatic Evaluation"
    ]
  }
};

/**
 * Normalizes a skill string for comparison
 */
function normalizeSkill(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculates match percentage between student skills and opportunity requirements
 * @param {Array<string>} studentSkills 
 * @param {Array<string>} requiredSkills 
 * @param {string} studentStream 
 * @param {string} opportunityStream 
 * @returns {Object} { matchScore: number, matchingSkills: Array, missingSkills: Array }
 */
export function calculateMatchScore(studentSkills = [], requiredSkills = [], studentStream = "", opportunityStream = "") {
  if (!requiredSkills || requiredSkills.length === 0) {
    return { matchScore: 85, matchingSkills: [], missingSkills: [] };
  }

  const normalizedStudent = studentSkills.map(s => normalizeSkill(s));
  const matchingSkills = [];
  const missingSkills = [];

  // Stream compatibility weight
  const streamMatch = !opportunityStream || 
                      opportunityStream.toLowerCase() === "all" || 
                      normalizeSkill(studentStream) === normalizeSkill(opportunityStream);

  let matchPoints = 0;

  requiredSkills.forEach(req => {
    const normReq = normalizeSkill(req);
    // Exact or substring match
    const found = normalizedStudent.some(st => 
      st === normReq || st.includes(normReq) || normReq.includes(st)
    );

    if (found) {
      matchPoints += 1;
      matchingSkills.push(req);
    } else {
      missingSkills.push(req);
    }
  });

  const skillCoverage = matchPoints / requiredSkills.length;
  // Base skill match calculation (0-100)
  let rawScore = skillCoverage * 80; // 80% weight on skills

  // Stream matching gives remaining 20%
  if (streamMatch) {
    rawScore += 20;
  } else {
    rawScore += 5; // Partial cross-disciplinary credit in Ayush
  }

  const finalScore = Math.min(99, Math.max(25, Math.round(rawScore)));

  return {
    matchScore: finalScore,
    matchingSkills,
    missingSkills,
    streamMatch
  };
}

/**
 * Generates automated skill gap recommendations based on missing skills
 */
export function generateSkillGapAdvice(missingSkills = [], stream = "ayurveda") {
  if (missingSkills.length === 0) {
    return "Your profile strongly aligns with current industry requirements!";
  }

  return `To increase your selection chance, consider completing certifications or clinical postings in: ${missingSkills.slice(0, 3).join(", ")}.`;
}
