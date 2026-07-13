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

// GET /api/v1/jobs — View all job postings (PUBLIC)
router.get('/', jobsController.getAllJobs);

// GET /api/v1/jobs/:id — View a specific job (PUBLIC)
router.get('/:id', jobsController.getJobById);

// GET /api/v1/jobs/:id/candidates — View ranked candidates for a job
router.get('/:id/candidates', authenticateAdmin, allowAnyAdmin, jobsController.getRankedStudents);

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

// PATCH /api/v1/jobs/:id/start-evaluation — Start evaluating candidates
router.patch(
  '/:id/start-evaluation',
  authenticateAdmin,
  allowWriteAccess,
  jobsController.startEvaluation
);

export default router;
