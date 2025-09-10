import express from 'express';
import multer from 'multer';
import path from 'path';
import { aiService, CVAnalysisResult, JobPosition, InterviewFeedback } from '../services/aiService';

const router = express.Router();

// Configurazione upload per CV
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/cvs/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported. Only PDF, DOCX, and TXT files are allowed.'));
    }
  }
});

/**
 * @route POST /api/ai/cv-analysis
 * @desc Analizza CV con AI e NLP
 * @access Private
 */
router.post('/cv-analysis', upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'CV file is required'
      });
    }

    const { positionId } = req.body;
    const filePath = req.file.path;

    console.log(`🔍 Starting CV analysis for file: ${req.file.originalname}`);

    const analysis = await aiService.analyzeCV(filePath, positionId);

    res.json({
      success: true,
      data: {
        analysis,
        metadata: {
          filename: req.file.originalname,
          fileSize: req.file.size,
          processedAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('CV analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'CV analysis failed'
    });
  }
});

/**
 * @route GET /api/ai/cv-analysis/:candidateId
 * @desc Recupera analisi CV esistente
 * @access Private
 */
router.get('/cv-analysis/:candidateId', async (req, res) => {
  try {
    const { candidateId } = req.params;

    // In produzione, recuperare dal database
    // Per ora ritorniamo mock data
    const mockAnalysis: CVAnalysisResult = {
      candidateInfo: {
        name: 'Marco Rossi',
        email: 'marco.rossi@example.com',
        phone: '+39 123 456 7890',
        location: 'Milano, Italy',
        summary: 'Software Developer con 3 anni di esperienza'
      },
      skills: {
        technical: ['JavaScript', 'React', 'Node.js', 'SQL', 'Git'],
        soft: ['Leadership', 'Communication', 'Problem solving'],
        languages: ['Italian', 'English'],
        certifications: ['AWS Certified Developer']
      },
      experience: {
        totalYears: 3,
        positions: [
          {
            title: 'Full Stack Developer',
            company: 'Tech Solutions',
            duration: '2021-2024',
            description: 'Sviluppo applicazioni web con React e Node.js',
            relevanceScore: 88
          }
        ],
        industries: ['Technology', 'Software Development']
      },
      education: [
        {
          degree: 'Laurea in Informatica',
          institution: 'Università di Milano',
          year: '2020',
          field: 'Computer Science'
        }
      ],
      aiInsights: {
        overallScore: 84,
        strengths: [
          'Competenze tecniche solide in JavaScript e React',
          'Esperienza pratica nello sviluppo full-stack',
          'Buone soft skills e capacità comunicative'
        ],
        concerns: [
          'Esperienza limitata in ruoli senior',
          'Mancanza di esperienza in leadership'
        ],
        recommendations: [
          'Valutare per posizioni mid-level',
          'Approfondire competenze di leadership durante il colloquio',
          'Considerare per progetti che richiedono React/Node.js'
        ],
        fitScore: 81,
        summaryAI: 'Candidato promettente con solide competenze tecniche. Ha un buon background in sviluppo web moderno e mostra potenziale di crescita. Consigliato per ruoli di sviluppo mid-level con opportunità di mentorship.'
      }
    };

    res.json({
      success: true,
      data: {
        candidateId,
        analysis: mockAnalysis,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to retrieve CV analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve CV analysis'
    });
  }
});

/**
 * @route POST /api/ai/interview-questions
 * @desc Genera domande per colloquio personalizzate
 * @access Private
 */
router.post('/interview-questions', async (req, res) => {
  try {
    const { positionId, candidateId } = req.body;

    if (!positionId) {
      return res.status(400).json({
        success: false,
        error: 'Position ID is required'
      });
    }

    // Mock position data - in produzione recuperare dal database
    const mockPosition: JobPosition = {
      id: positionId,
      title: 'Full Stack Developer',
      description: 'Cerchiamo uno sviluppatore full-stack esperto in React e Node.js per unirsi al nostro team di sviluppo.',
      requiredSkills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Git'],
      preferredSkills: ['TypeScript', 'Docker', 'AWS', 'MongoDB'],
      experience: '2-4 years',
      industry: 'Technology',
      location: 'Milano',
      salary: {
        min: 35000,
        max: 50000,
        currency: 'EUR'
      }
    };

    // Recupera CV analysis se candidateId fornito
    let candidateCV: CVAnalysisResult | undefined;
    if (candidateId) {
      // In produzione, recuperare analisi CV dal database
      // Per ora usiamo mock data
      candidateCV = await aiService.analyzeCV('mock-cv-path');
    }

    console.log(`❓ Generating interview questions for position: ${mockPosition.title}`);

    const questions = await aiService.generateInterviewQuestions(mockPosition, candidateCV);

    res.json({
      success: true,
      data: {
        questions,
        metadata: {
          positionId,
          candidateId,
          generatedAt: new Date().toISOString(),
          customized: !!candidateCV
        }
      }
    });
  } catch (error) {
    console.error('Failed to generate interview questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate interview questions'
    });
  }
});

/**
 * @route POST /api/ai/candidate-matching
 * @desc Calcola compatibilità candidato-posizione
 * @access Private
 */
router.post('/candidate-matching', async (req, res) => {
  try {
    const { candidateId, positionId } = req.body;

    if (!candidateId || !positionId) {
      return res.status(400).json({
        success: false,
        error: 'Candidate ID and Position ID are required'
      });
    }

    console.log(`🎯 Calculating match between candidate ${candidateId} and position ${positionId}`);

    // In produzione, recuperare dati reali dal database
    const mockCandidateCV: CVAnalysisResult = {
      candidateInfo: { name: 'Sara Colombo' },
      skills: {
        technical: ['JavaScript', 'React', 'Vue.js', 'Python', 'SQL'],
        soft: ['Communication', 'Teamwork', 'Problem solving'],
        languages: ['Italian', 'English', 'Spanish'],
        certifications: ['AWS Solutions Architect']
      },
      experience: {
        totalYears: 4,
        positions: [
          {
            title: 'Frontend Developer',
            company: 'Web Agency',
            duration: '3 years',
            description: 'Frontend development with React and Vue.js',
            relevanceScore: 90
          }
        ],
        industries: ['Technology', 'Web Development']
      },
      education: [],
      aiInsights: {
        overallScore: 87,
        strengths: ['Strong frontend skills', 'Multi-framework experience'],
        concerns: ['Limited backend experience'],
        recommendations: ['Consider for frontend-focused roles'],
        fitScore: 85,
        summaryAI: 'Excellent frontend developer with strong technical skills'
      }
    };

    const mockPosition: JobPosition = {
      id: positionId,
      title: 'Frontend Developer',
      description: 'Looking for an experienced frontend developer',
      requiredSkills: ['JavaScript', 'React', 'CSS', 'HTML'],
      preferredSkills: ['TypeScript', 'Vue.js', 'Testing'],
      experience: '3+ years',
      industry: 'Technology',
      location: 'Remote'
    };

    const matchResult = await aiService.calculateCandidateMatch(mockCandidateCV, mockPosition);

    res.json({
      success: true,
      data: {
        match: matchResult,
        metadata: {
          calculatedAt: new Date().toISOString(),
          version: '1.0'
        }
      }
    });
  } catch (error) {
    console.error('Failed to calculate candidate matching:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate candidate matching'
    });
  }
});

/**
 * @route POST /api/ai/sentiment-analysis
 * @desc Analizza sentiment del feedback colloquio
 * @access Private
 */
router.post('/sentiment-analysis', async (req, res) => {
  try {
    const { interviewId, candidateId, feedback, ratings } = req.body;

    if (!feedback) {
      return res.status(400).json({
        success: false,
        error: 'Feedback text is required'
      });
    }

    const mockFeedback: InterviewFeedback = {
      candidateId: candidateId || 'candidate-1',
      interviewId: interviewId || 'interview-1',
      phase: 1,
      feedback: feedback,
      ratings: ratings || {
        technical: 4,
        communication: 5,
        cultural: 4,
        overall: 4
      },
      timestamp: new Date()
    };

    console.log(`😊 Analyzing sentiment for feedback: "${feedback.substring(0, 50)}..."`);

    const sentimentResult = await aiService.analyzeFeedbackSentiment(mockFeedback);

    res.json({
      success: true,
      data: {
        sentiment: sentimentResult,
        feedback: {
          interviewId: mockFeedback.interviewId,
          candidateId: mockFeedback.candidateId,
          analyzedAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Failed to analyze sentiment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze sentiment'
    });
  }
});

/**
 * @route POST /api/ai/predictive-scoring
 * @desc Genera score predittivo per candidato
 * @access Private
 */
router.post('/predictive-scoring', async (req, res) => {
  try {
    const { candidateId, positionId, includeInterviews = false } = req.body;

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        error: 'Candidate ID is required'
      });
    }

    console.log(`🔮 Generating predictive score for candidate ${candidateId}`);

    // Mock data - in produzione recuperare dal database
    const mockCandidateCV: CVAnalysisResult = {
      candidateInfo: { name: 'Andrea Ferrari' },
      skills: {
        technical: ['Java', 'Spring', 'PostgreSQL', 'Docker', 'Kubernetes'],
        soft: ['Leadership', 'Analytical thinking', 'Communication'],
        languages: ['Italian', 'English'],
        certifications: ['Oracle Certified Java Developer']
      },
      experience: {
        totalYears: 6,
        positions: [
          {
            title: 'Backend Developer',
            company: 'Enterprise Corp',
            duration: '4 years',
            description: 'Backend development with Java and Spring',
            relevanceScore: 92
          }
        ],
        industries: ['Enterprise Software', 'Finance']
      },
      education: [],
      aiInsights: {
        overallScore: 89,
        strengths: ['Strong technical expertise', 'Leadership potential', 'Enterprise experience'],
        concerns: ['May be overqualified for junior roles'],
        recommendations: ['Consider for senior or lead positions'],
        fitScore: 88,
        summaryAI: 'Highly qualified senior developer with leadership potential'
      }
    };

    const mockPosition: JobPosition = {
      id: positionId || 'pos-1',
      title: 'Senior Backend Developer',
      description: 'Senior backend developer for enterprise applications',
      requiredSkills: ['Java', 'Spring Boot', 'SQL', 'Microservices'],
      preferredSkills: ['Kubernetes', 'AWS', 'Leadership'],
      experience: '5+ years',
      industry: 'Enterprise Software',
      location: 'Milano'
    };

    const mockInterviews: InterviewFeedback[] = includeInterviews ? [
      {
        candidateId,
        interviewId: 'int-1',
        phase: 1,
        feedback: 'Excellent technical skills, great communication, shows leadership potential',
        ratings: { technical: 5, communication: 4, cultural: 5, overall: 5 },
        timestamp: new Date()
      }
    ] : [];

    const predictiveScore = await aiService.generatePredictiveScore(
      mockCandidateCV, 
      mockPosition, 
      mockInterviews
    );

    res.json({
      success: true,
      data: {
        scoring: predictiveScore,
        metadata: {
          candidateId,
          positionId,
          includeInterviews,
          generatedAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Failed to generate predictive scoring:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate predictive scoring'
    });
  }
});

/**
 * @route GET /api/ai/bulk-analysis/:positionId
 * @desc Analisi bulk di tutti i candidati per una posizione
 * @access Private
 */
router.get('/bulk-analysis/:positionId', async (req, res) => {
  try {
    const { positionId } = req.params;
    
    console.log(`📊 Running bulk analysis for position ${positionId}`);

    // Mock data per demo
    const candidatesAnalysis = [
      {
        candidateId: 'cand-1',
        name: 'Marco Rossi',
        matchScore: 85,
        aiScore: 84,
        predictiveScore: 78,
        recommendation: 'hire',
        topStrengths: ['React expertise', 'Strong communication'],
        concerns: ['Limited leadership experience']
      },
      {
        candidateId: 'cand-2',
        name: 'Sara Colombo',
        matchScore: 92,
        aiScore: 87,
        predictiveScore: 89,
        recommendation: 'hire',
        topStrengths: ['Full-stack capabilities', 'Problem solving'],
        concerns: []
      },
      {
        candidateId: 'cand-3',
        name: 'Luigi Verdi',
        matchScore: 67,
        aiScore: 72,
        predictiveScore: 65,
        recommendation: 'consider',
        topStrengths: ['Fresh perspective', 'Learning agility'],
        concerns: ['Limited experience', 'Skill gaps in key areas']
      }
    ];

    // Ordinamento per score complessivo
    candidatesAnalysis.sort((a, b) => {
      const scoreA = (a.matchScore + a.aiScore + a.predictiveScore) / 3;
      const scoreB = (b.matchScore + b.aiScore + b.predictiveScore) / 3;
      return scoreB - scoreA;
    });

    res.json({
      success: true,
      data: {
        positionId,
        totalCandidates: candidatesAnalysis.length,
        analysis: candidatesAnalysis,
        summary: {
          recommendedHires: candidatesAnalysis.filter(c => c.recommendation === 'hire').length,
          averageMatchScore: Math.round(
            candidatesAnalysis.reduce((acc, c) => acc + c.matchScore, 0) / candidatesAnalysis.length
          ),
          topCandidate: candidatesAnalysis[0]?.name
        },
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to run bulk analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run bulk analysis'
    });
  }
});

/**
 * @route GET /api/ai/skills-trending
 * @desc Analisi trending delle competenze richieste
 * @access Private
 */
router.get('/skills-trending', async (req, res) => {
  try {
    console.log('📈 Analyzing skills trending data');

    // Mock data - in produzione analizzare job postings e CV database
    const trendingSkills = {
      technical: [
        { skill: 'React', demand: 95, growth: '+12%', avgSalary: 45000 },
        { skill: 'Node.js', demand: 88, growth: '+8%', avgSalary: 42000 },
        { skill: 'TypeScript', demand: 82, growth: '+25%', avgSalary: 48000 },
        { skill: 'Python', demand: 90, growth: '+15%', avgSalary: 50000 },
        { skill: 'Docker', demand: 75, growth: '+18%', avgSalary: 52000 },
        { skill: 'AWS', demand: 78, growth: '+22%', avgSalary: 55000 },
        { skill: 'Kubernetes', demand: 65, growth: '+35%', avgSalary: 58000 }
      ],
      emerging: [
        { skill: 'Machine Learning', demand: 45, growth: '+40%', avgSalary: 65000 },
        { skill: 'GraphQL', demand: 35, growth: '+30%', avgSalary: 47000 },
        { skill: 'Rust', demand: 25, growth: '+50%', avgSalary: 60000 },
        { skill: 'WebAssembly', demand: 15, growth: '+60%', avgSalary: 62000 }
      ],
      declining: [
        { skill: 'jQuery', demand: 35, growth: '-15%', avgSalary: 35000 },
        { skill: 'PHP', demand: 45, growth: '-8%', avgSalary: 38000 },
        { skill: 'Flash', demand: 5, growth: '-80%', avgSalary: 30000 }
      ]
    };

    res.json({
      success: true,
      data: {
        trending: trendingSkills,
        insights: [
          'TypeScript showing highest growth rate at +25%',
          'Container technologies (Docker/Kubernetes) in high demand',
          'Machine Learning skills commanding premium salaries',
          'Traditional web technologies declining in demand'
        ],
        recommendations: [
          'Focus recruitment on React/TypeScript developers',
          'Consider upskilling existing team in cloud technologies',
          'ML skills becoming essential for senior roles'
        ],
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to analyze skills trending:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze skills trending'
    });
  }
});

export default router;