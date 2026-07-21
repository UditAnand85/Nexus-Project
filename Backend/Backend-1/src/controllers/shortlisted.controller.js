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
      req.params.jobId
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
      req.params.id
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

/**
 * PATCH /api/v1/shortlisted/status
 * Admin: Manually update candidate status (invite to shortlist or reject) before shortlisting closes,
 * regardless of resume cutoff score.
 *
 * Body: { student_id, action: 'Shortlisted' | 'Rejected' }
 */
export const updateCandidateStatus = async (req, res, next) => {
  try {
    const { student_id, action } = req.body;

    if (!student_id || !['Shortlisted', 'Rejected'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "student_id and valid action ('Shortlisted' or 'Rejected') are required.",
      });
    }

    const result = await shortlistedService.updateCandidateStatus({ student_id, action });

    res.status(200).json({
      success: true,
      message: `Candidate status updated to '${action}' successfully.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
