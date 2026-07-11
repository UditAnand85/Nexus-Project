import * as studentsService from '../services/students.service.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * POST /api/v1/students/apply/:jobId
 * Public endpoint — Candidate submits application form + resume.
 * Expects multipart/form-data: full_name, email, phone, resume (file)
 */
export const submitApplication = async (req, res, next) => {
  try {
    const { full_name, email, phone } = req.body;
    const jobId = parseInt(req.params.jobId, 10);

    if (!full_name || !email) {
      return next(new AppError('Full name and email are required.', 400));
    }

    if (isNaN(jobId)) {
      return next(new AppError('Invalid job ID.', 400));
    }

    if (!req.file) {
      return next(new AppError('Resume file is required. Please upload a PDF, DOC, or DOCX file.', 400));
    }

    const result = await studentsService.submitApplication({
      full_name,
      email,
      phone,
      jobId,
      resumeBuffer: req.file.buffer,
      resumeMimeType: req.file.mimetype,
      resumeOriginalName: req.file.originalname,
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully! Your resume is being processed.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/students
 * Admin: Get all student applications across all jobs.
 */
export const getAllStudents = async (req, res, next) => {
  try {
    const students = await studentsService.getAllStudents();
    res.status(200).json({ success: true, count: students.length, data: students });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/students/job/:jobId
 * Admin: Get all applications for a specific job.
 */
export const getStudentsByJob = async (req, res, next) => {
  try {
    const students = await studentsService.getStudentsByJob(parseInt(req.params.jobId, 10));
    res.status(200).json({ success: true, count: students.length, data: students });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/students/:id
 * Admin: Get a single student's application record.
 */
export const getStudentById = async (req, res, next) => {
  try {
    const student = await studentsService.getStudentById(parseInt(req.params.id, 10));
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};
