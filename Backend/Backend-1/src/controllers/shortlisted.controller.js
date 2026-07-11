import * as shortlistedService from '../services/shortlisted.service.js';

/**
 * GET /api/v1/shortlisted
 * Admin: Get all shortlisted candidates with their student info.
 */
export const getAllShortlisted = async (req, res, next) => {
  try {
    const shortlisted = await shortlistedService.getAllShortlisted();
    res.status(200).json({ success: true, count: shortlisted.length, data: shortlisted });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/shortlisted/job/:jobId
 * Admin: Get shortlisted candidates for a specific job.
 */
export const getShortlistedByJob = async (req, res, next) => {
  try {
    const shortlisted = await shortlistedService.getShortlistedByJob(
      parseInt(req.params.jobId, 10)
    );
    res.status(200).json({ success: true, count: shortlisted.length, data: shortlisted });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/shortlisted/:id
 * Admin: Get a single shortlisted candidate record.
 */
export const getShortlistedById = async (req, res, next) => {
  try {
    const shortlisted = await shortlistedService.getShortlistedById(
      parseInt(req.params.id, 10)
    );
    res.status(200).json({ success: true, data: shortlisted });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/shortlisted/result
 * INTERNAL — Backend-2 posts processed resume results here.
 * Protected by X-Internal-Api-Key header.
 *
 * Body: { student_id, parsed_resume_json, resume_score, application_status? }
 */
export const processResult = async (req, res, next) => {
  try {
    const { student_id, parsed_resume_json, resume_score, application_status } = req.body;

    if (!student_id || resume_score === undefined || resume_score === null) {
      return res.status(400).json({
        success: false,
        message: 'student_id and resume_score are required fields.',
      });
    }

    const result = await shortlistedService.processResult({
      student_id,
      parsed_resume_json,
      resume_score,
      application_status,
    });

    res.status(200).json({
      success: true,
      message: 'Resume result processed and stored successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
