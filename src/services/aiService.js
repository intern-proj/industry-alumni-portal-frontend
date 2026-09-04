import api from '../lib/api';

export const aiService = {
  /**
   * Automatically parse a flyer image or PDF document and create/draft a vacancy record.
   * Performs OCR + LLM structured extraction, NSBM faculty alignment check, and flags missing fields.
   */
  parseAndSaveFlyer: (imageUrl, partnerId = null) =>
    api.post('/vacancies/parse-and-save', { image_url: imageUrl, partner_id: partnerId }),

  /**
   * Standalone NSBM institutional suitability & compliance evaluation.
   */
  checkInstitutionalFit: (vacancyPayload) =>
    api.post('/vacancies/institutional-check', vacancyPayload),

  /**
   * Natural Language Universal Multi-Domain Smart AI Search
   * Classifies intent and orchestrates search across vacancies, companies, and students.
   */
  universalSmartSearch: (query, currentRoute = null, userRole = 'STUDENT') =>
    api.post('/ai/smart-search/universal', {
      query,
      current_route: currentRoute,
      user_role: userRole
    }),

  /**
   * Natural Language Smart AI Search for vacancies
   * e.g., "find me vacancy within colombo that pays more than 100000LKR for software engineering graduate"
   */
  smartSearchVacancies: (query, itemsToRank = []) =>
    api.post('/ai/smart-search/vacancies', {
      query,
      search_type: 'vacancies',
      items_to_rank: itemsToRank
    }),

  /**
   * Natural Language Smart AI Search for candidates
   * e.g., "find me candidates that excel in react and springboot"
   */
  smartSearchCandidates: (query, itemsToRank = []) =>
    api.post('/ai/smart-search/candidates', {
      query,
      search_type: 'candidates',
      items_to_rank: itemsToRank
    }),

  /**
   * Parse search query intent breakdown
   */
  parseSearchIntent: (query) =>
    api.get(`/ai/smart-search/parse-intent?q=${encodeURIComponent(query)}`),

  /**
   * Analyze candidate resume and provide market-informed skill guidance and competitiveness score
   */
  analyzeResumeAndAdvise: (data) =>
    api.post('/ai/resume/analyze-and-advise', data),

  /**
   * Generate an AI Cover Letter for a specific vacancy
   */
  generateCoverLetter: (payload) =>
    api.post('/ai/resume/generate-cover-letter', payload, { timeout: 60000 }),

  /**
   * Calculate match percentages and recommend vacancies for a candidate based on skills & preferences
   */
  recommendVacanciesForCandidate: (candidateSkills = [], vacancies = [], preferredLocations = []) =>
    api.post('/ai/vacancies/recommend-for-candidate', {
      candidate_skills: candidateSkills,
      vacancies,
      preferred_locations: preferredLocations
    }),

  /**
   * Suggest matching candidates for a recruiter's vacancy (strictly only actively searching candidates)
   */
  recommendCandidatesForVacancy: (vacancyTitle, requiredSkills = [], preferredSkills = [], candidates = []) =>
    api.post('/ai/candidates/recommend-for-vacancy', {
      vacancy_title: vacancyTitle,
      required_skills: requiredSkills,
      preferred_skills: preferredSkills,
      candidates
    }),

  /**
   * Immediately analyzes, OCRs, and embeds a newly uploaded resume
   */
  processResumeUpload: (resumeUrl, userId = null, candidateSkills = []) =>
    api.post('/ai/resume/process-upload', {
      resume_url: resumeUrl,
      user_id: userId,
      candidate_skills: candidateSkills,
      vacancies: []
    }),

  /**
   * Explicitly rebuild the unified candidate profile
   */
  rebuildProfile: (userId, resumeUrls = [], profileSkills = []) =>
    api.post('/ai/resume/profile/rebuild', {
      user_id: userId,
      resume_urls: resumeUrls,
      profile_skills: profileSkills
    }),

  /**
   * Evaluates student's cached unified profile against vacancies with 5-pillar ATS scoring
   */
  matchResumeToVacancies: (resumeUrl, vacancies = [], preferredLocations = [], userId = null, candidateSkills = []) =>
    api.post('/ai/resume/match-vacancies', {
      resume_url: resumeUrl,
      vacancies,
      preferred_locations: preferredLocations,
      user_id: userId,
      candidate_skills: candidateSkills
    }),

  /**
   * Evaluates a single candidate application on submission (Option B)
   */
  matchSingleApplicant: (payload) =>
    api.post('/ai/resume/match-single-applicant', payload),

  /**
   * Partner bulk recalculation for all applicants of a vacancy
   */
  matchApplicantsBulk: (vacancyId, vacancyTitle, vacancyDescription, vacancyRequirements, vacancyTags, applicants = []) =>
    api.post('/ai/resume/match-applicants-bulk', {
      vacancy_id: vacancyId,
      vacancy_title: vacancyTitle,
      vacancy_description: vacancyDescription,
      vacancy_requirements: vacancyRequirements,
      vacancy_tags: vacancyTags,
      applicants
    }),

  /**
   * Generates a real, authentic LLM executive profile summary for a student
   */
  generateCandidateSummary: (payload) =>
    api.post('/ai/resume/candidate-summary', payload),

  /**
   * Enhances candidate profile by parsing primary resume using LLM
   */
  enhanceProfileFromResume: (userId, resumeUrl, fallbackSkills = []) =>
    api.post('/ai/resume/enhance-profile', {
      user_id: userId,
      resume_url: resumeUrl,
      fallback_skills: fallbackSkills
    }),

  /**
   * AI Infrastructure & Azure GPU Model Configuration
   */
  getModelConfigs: () =>
    api.get('/ai/models/config'),

  updateModelConfig: (data) =>
    api.put('/ai/models/config', data),

  testModelInference: (prompt) =>
    api.post('/ai/models/test', { prompt })
};
