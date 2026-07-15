import { Router } from 'express';
import * as studentsController from '../controllers/students.controller.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { allowAnyAdmin } from '../middleware/authorize.js';
import { uploadResume } from '../middleware/upload.js';

const router = Router();

/**
 * Students (Applications) Routes
 * Base: /api/v1/students
 *
 * - apply/:jobId  → PUBLIC route (no auth required — candidates apply here)
 * - GET routes    → Admin only
 */

// POST /api/v1/students/apply/:jobId
// Public: Candidate submits application form + resume file
// multipart/form-data fields: full_name, email, phone, resume (file)
router.post('/apply/:jobId', uploadResume, studentsController.submitApplication);

// POST /api/v1/students/:id/video
// Stub endpoint to accept evaluation video introduction uploads
router.post('/:id/video', (req, res) => {
  res.status(200).json({ success: true, message: 'Video uploaded successfully (stub).' });
});

// GET /api/v1/students — Get all students (admin only)
router.get('/', authenticateAdmin, allowAnyAdmin, studentsController.getAllStudents);

// GET /api/v1/students/job/:jobId — Get all students for a specific job
router.get('/job/:jobId', authenticateAdmin, allowAnyAdmin, studentsController.getStudentsByJob);

// GET /api/v1/students/:id — Get a specific student record
router.get('/:id', authenticateAdmin, allowAnyAdmin, studentsController.getStudentById);

// POST /api/v1/students/retry-failed — Retry un-processed resumes (Disaster Recovery)
router.post('/retry-failed', authenticateAdmin, allowAnyAdmin, studentsController.retryFailedResumes);

export default router;
