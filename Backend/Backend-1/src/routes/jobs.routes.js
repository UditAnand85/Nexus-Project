import { Router } from 'express';
import * as jobsController from '../controllers/jobs.controller.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { allowAnyAdmin, allowWriteAccess } from '../middleware/authorize.js';

const router = Router();

/**
 * Jobs Routes
 * Base: /api/v1/jobs
 *
 * All routes require admin authentication.
 * Read-only routes: all admin roles (R001–R004)
 * Write routes: Super Admin (R001), HR Manager (R002), Hiring Manager (R003)
 */

// GET /api/v1/jobs — View all job postings
router.get('/', authenticateAdmin, allowAnyAdmin, jobsController.getAllJobs);

// GET /api/v1/jobs/:id — View a specific job
router.get('/:id', authenticateAdmin, allowAnyAdmin, jobsController.getJobById);

// POST /api/v1/jobs — Create a new job posting
router.post('/', authenticateAdmin, allowWriteAccess, jobsController.createJob);

// PUT /api/v1/jobs/:id — Update an existing job
router.put('/:id', authenticateAdmin, allowWriteAccess, jobsController.updateJob);

// DELETE /api/v1/jobs/:id — Delete a job
router.delete('/:id', authenticateAdmin, allowWriteAccess, jobsController.deleteJob);

// PATCH /api/v1/jobs/:id/stop-shortlisting — Close AI shortlisting for a job
router.patch(
  '/:id/stop-shortlisting',
  authenticateAdmin,
  allowWriteAccess,
  jobsController.stopShortlisting
);

export default router;
