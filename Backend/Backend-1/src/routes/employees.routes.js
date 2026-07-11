import { Router } from 'express';
import { authenticateAdmin } from '../middleware/auth.js';
import { createEmployee, listEmployees, changePassword } from '../controllers/employees.controller.js';

const router = Router();

// All routes require admin auth
router.use(authenticateAdmin);

router.get('/', listEmployees);                    // GET  /employees
router.post('/', createEmployee);                  // POST /employees  (Super Admin only)
router.patch('/change-password', changePassword);  // PATCH /employees/change-password

export default router;
