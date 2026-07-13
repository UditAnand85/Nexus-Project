import * as jobsService from '../services/jobs.service.js';

/**
 * GET /api/v1/jobs
 * Retrieve all job postings, ordered by newest first.
 */
export const getAllJobs = async (req, res, next) => {
  try {
    const jobs = await jobsService.getAllJobs();
    res.status(200).json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/jobs/:id
 * Retrieve a single job posting by ID.
 */
export const getJobById = async (req, res, next) => {
  try {
    const job = await jobsService.getJobById(req.params.id);
    res.status(200).json({ success: true, data: job });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/jobs
 * Create a new job posting. The creator's admin ID is taken from JWT.
 */
export const createJob = async (req, res, next) => {
  try {
    const job = await jobsService.createJob(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Job posting created successfully.',
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/jobs/:id
 * Update an existing job posting.
 */
export const updateJob = async (req, res, next) => {
  try {
    const job = await jobsService.updateJob(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Job posting updated successfully.',
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/jobs/:id
 * Delete a job posting permanently.
 */
export const deleteJob = async (req, res, next) => {
  try {
    await jobsService.deleteJob(req.params.id);
    res.status(200).json({ success: true, message: 'Job posting deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/jobs/:id/stop-shortlisting
 * Close AI shortlisting for this job. Sets status to "Shortlisting Closed".
 * After this, the job appears as "Closed" on the candidate portal.
 */
export const stopShortlisting = async (req, res, next) => {
  try {
    const job = await jobsService.stopShortlisting(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Shortlisting closed. No further applications will be processed.',
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/jobs/:id/start-evaluation
 * Start evaluation for this job. Sets status to "Evaluation Started".
 */
export const startEvaluation = async (req, res, next) => {
  try {
    const job = await jobsService.startEvaluation(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Evaluation started successfully.',
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/jobs/:id/candidates
 * Retrieve all candidates for a job, ranked by score.
 */
export const getRankedStudents = async (req, res, next) => {
  try {
    const studentsList = await jobsService.getRankedStudents(req.params.id);
    res.status(200).json({ success: true, count: studentsList.length, data: studentsList });
  } catch (error) {
    next(error);
  }
};
