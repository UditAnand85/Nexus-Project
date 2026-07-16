import { Router } from 'express';
import userAuthRoutes from './user.auth.routes.js';
import adminAuthRoutes from './admin.auth.routes.js';
import jobsRoutes from './jobs.routes.js';
import studentsRoutes from './students.routes.js';
import shortlistedRoutes from './shortlisted.routes.js';
import employeesRoutes from './employees.routes.js';
import evaluationRoutes from './evaluation.routes.js';
import { getStats } from '../controllers/stats.controller.js';
import { getMyApplications } from '../controllers/user.auth.controller.js';
import { authenticateAdmin, authenticateToken } from '../middleware/auth.js';

const router = Router();

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.use('/auth/user', userAuthRoutes);
router.use('/auth/admin', adminAuthRoutes);

// ─── Resources ────────────────────────────────────────────────────────────────
router.use('/jobs', jobsRoutes);
router.use('/students', studentsRoutes);
router.use('/shortlisted', shortlistedRoutes);
router.use('/employees', employeesRoutes);
router.use('/evaluate', evaluationRoutes);

// ─── Stats & Dashboard ────────────────────────────────────────────────────────
router.get('/stats', authenticateAdmin, getStats);
router.get('/me/applications', authenticateToken, getMyApplications);

// ─── API Info ─────────────────────────────────────────────────────────────────
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'RecruitAI Backend-1 API',
    version: 'v1',
    endpoints: {
      auth: {
        user: '/api/v1/auth/user/register | /login | /logout | /me',
        admin: '/api/v1/auth/admin/login | /logout | /me',
      },
      jobs: '/api/v1/jobs',
      students: '/api/v1/students',
      shortlisted: '/api/v1/shortlisted',
    },
  });
});

export default router;
