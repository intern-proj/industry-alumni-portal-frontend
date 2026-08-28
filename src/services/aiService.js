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
    })
};
