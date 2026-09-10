import { query } from './db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Seed useful general skill assessments into the database.
 * Safe to call multiple times – skips if assessments already exist.
 */
export async function seedAssessments() {
  const { rows } = await query('SELECT COUNT(*)::int AS cnt FROM assessments');
  if (rows[0].cnt > 0) {
    console.log('ℹ Assessments already seeded, skipping');
    return;
  }

  const assessments = [
    {
      id: 'asm_tech_fundamentals',
      category: 'technical',
      title: 'Technical Fundamentals',
      description: 'Assess foundational knowledge in programming, data structures, algorithms, and software engineering principles.',
      duration_minutes: 20,
      passing_score: 70,
      questions: [
        {
          id: 1,
          question: 'What is the time complexity of binary search on a sorted array?',
          options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
          correctAnswer: 1,
          rationale: 'Binary search halves the search space each iteration, giving O(log n) time complexity.'
        },
        {
          id: 2,
          question: 'Which data structure uses FIFO (First In, First Out) ordering?',
          options: ['Stack', 'Queue', 'Binary Tree', 'Hash Map'],
          correctAnswer: 1,
          rationale: 'A Queue processes elements in the order they were added (FIFO).'
        },
        {
          id: 3,
          question: 'What does SQL stand for?',
          options: ['Structured Query Language', 'Simple Query Logic', 'Standard Question Language', 'System Query Lookup'],
          correctAnswer: 0,
          rationale: 'SQL stands for Structured Query Language, used for managing relational databases.'
        },
        {
          id: 4,
          question: 'Which HTTP method is used to update an existing resource?',
          options: ['GET', 'POST', 'PUT', 'DELETE'],
          correctAnswer: 2,
          rationale: 'PUT is used to update (replace) an existing resource on the server.'
        },
        {
          id: 5,
          question: 'What is the purpose of version control systems like Git?',
          options: [
            'To compile code faster',
            'To track changes, collaborate, and manage code history',
            'To deploy applications automatically',
            'To encrypt source code'
          ],
          correctAnswer: 1,
          rationale: 'Version control systems track code changes, enable collaboration, and maintain project history.'
        }
      ]
    },
    {
      id: 'asm_web_development',
      category: 'technical',
      title: 'Web Development Essentials',
      description: 'Evaluate knowledge of HTML, CSS, JavaScript, and modern web development practices.',
      duration_minutes: 15,
      passing_score: 70,
      questions: [
        {
          id: 1,
          question: 'Which HTML element is used to define the largest heading?',
          options: ['<h6>', '<heading>', '<h1>', '<head>'],
          correctAnswer: 2,
          rationale: '<h1> defines the largest and most important heading in HTML.'
        },
        {
          id: 2,
          question: 'What does CSS stand for?',
          options: ['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style Syntax', 'Coded Style System'],
          correctAnswer: 1,
          rationale: 'CSS stands for Cascading Style Sheets, used to style HTML elements.'
        },
        {
          id: 3,
          question: 'Which JavaScript keyword declares a block-scoped variable?',
          options: ['var', 'let', 'function', 'const and let'],
          correctAnswer: 3,
          rationale: 'Both const and let declare block-scoped variables, unlike var which is function-scoped.'
        },
        {
          id: 4,
          question: 'What is the purpose of a REST API?',
          options: [
            'To style web pages',
            'To provide a standardised interface for client-server communication',
            'To compile JavaScript',
            'To manage databases directly'
          ],
          correctAnswer: 1,
          rationale: 'REST APIs provide a standardised way for clients and servers to communicate over HTTP.'
        }
      ]
    },
    {
      id: 'asm_soft_skills',
      category: 'soft_skills',
      title: 'Professional Soft Skills',
      description: 'Evaluate communication, teamwork, problem-solving, and professional development aptitude.',
      duration_minutes: 10,
      passing_score: 60,
      questions: [
        {
          id: 1,
          question: 'Which of the following best demonstrates active listening?',
          options: [
            'Interrupting to share your opinion',
            'Paraphrasing what the speaker said to confirm understanding',
            'Checking your phone while nodding',
            'Waiting for your turn to speak without paying attention'
          ],
          correctAnswer: 1,
          rationale: 'Active listening involves paraphrasing and confirming understanding of the speaker\'s message.'
        },
        {
          id: 2,
          question: 'When facing a conflict with a team member, the best first step is:',
          options: [
            'Report them to management immediately',
            'Have a private, respectful conversation to understand their perspective',
            'Ignore the conflict and hope it resolves itself',
            'Publicly address the issue in a team meeting'
          ],
          correctAnswer: 1,
          rationale: 'Direct, respectful communication is the most effective first step in conflict resolution.'
        },
        {
          id: 3,
          question: 'What is the most effective way to manage multiple deadlines?',
          options: [
            'Work on whichever task feels easiest first',
            'Prioritise tasks by urgency and importance, then create a schedule',
            'Try to work on all tasks simultaneously',
            'Ask someone else to handle the extra work'
          ],
          correctAnswer: 1,
          rationale: 'Prioritisation by urgency and importance (e.g., Eisenhower Matrix) is the most effective approach.'
        },
        {
          id: 4,
          question: 'Constructive feedback should be:',
          options: [
            'Vague and general to avoid hurting feelings',
            'Specific, actionable, and focused on behaviour rather than personality',
            'Given only during formal reviews',
            'Always positive to maintain morale'
          ],
          correctAnswer: 1,
          rationale: 'Effective feedback is specific, actionable, timely, and focused on observable behaviours.'
        }
      ]
    },
    {
      id: 'asm_data_science',
      category: 'technical',
      title: 'Data Science & Analytics Basics',
      description: 'Test understanding of statistics, data analysis, machine learning concepts, and data visualisation.',
      duration_minutes: 15,
      passing_score: 70,
      questions: [
        {
          id: 1,
          question: 'What is the difference between supervised and unsupervised learning?',
          options: [
            'Supervised learning uses labelled data; unsupervised does not',
            'Unsupervised learning is always more accurate',
            'Supervised learning does not require training data',
            'There is no difference'
          ],
          correctAnswer: 0,
          rationale: 'Supervised learning uses labelled training data, while unsupervised learning finds patterns in unlabelled data.'
        },
        {
          id: 2,
          question: 'Which measure of central tendency is most affected by outliers?',
          options: ['Mode', 'Median', 'Mean', 'Range'],
          correctAnswer: 2,
          rationale: 'The mean is pulled towards extreme values, making it sensitive to outliers.'
        },
        {
          id: 3,
          question: 'What does a p-value less than 0.05 typically indicate?',
          options: [
            'The result is certainly correct',
            'The result is statistically significant at the 5% level',
            'The null hypothesis is proven true',
            'The sample size is too small'
          ],
          correctAnswer: 1,
          rationale: 'A p-value < 0.05 means there is less than a 5% probability the result occurred by chance.'
        }
      ]
    }
  ];

  for (const asm of assessments) {
    await query(
      `INSERT INTO assessments (id, category, title, description, duration_minutes, passing_score, questions)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [asm.id, asm.category, asm.title, asm.description, asm.duration_minutes, asm.passing_score, JSON.stringify(asm.questions)]
    );
  }

  console.log(`✓ Seeded ${assessments.length} skill assessments`);
}

/**
 * Bootstrap admin account from env vars. Only creates if no admin exists.
 */
export async function bootstrapAdmin() {
  const { rows } = await query("SELECT COUNT(*)::int AS cnt FROM users WHERE role = 'admin'");
  if (rows[0].cnt > 0) return;

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    console.log('ℹ No ADMIN_EMAIL/ADMIN_PASSWORD set. Skipping admin bootstrap.');
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(adminPassword, salt);
  const id = `usr_${uuidv4().split('-')[0]}`;

  await query(
    `INSERT INTO users (id, email, password_hash, role, name, approval) VALUES ($1, $2, $3, 'admin', 'System Admin', 'approved')
     ON CONFLICT (email) DO NOTHING`,
    [id, adminEmail.toLowerCase(), hash]
  );
  console.log(`✓ Admin account bootstrapped (${adminEmail})`);
}
