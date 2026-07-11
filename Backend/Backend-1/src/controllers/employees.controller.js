import * as employeesService from '../services/employees.service.js';
import { AppError } from '../middleware/errorHandler.js';

// ─── Create Employee ──────────────────────────────────────────────────────────

/**
 * POST /api/v1/employees
 * Super Admin only. Creates a new admin employee and returns the temp password.
 */
export const createEmployee = async (req, res, next) => {
  try {
    // Enforce Super Admin only
    if (req.user.role_key !== 'R001') {
      return next(new AppError('Only Super Admins can add new employees.', 403));
    }

    const { full_name, email, role_key, account_status, department } = req.body;

    if (!full_name || !email || !role_key) {
      return next(new AppError('full_name, email, and role_key are required.', 400));
    }

    const { employee, tempPassword } = await employeesService.createEmployee({
      full_name, email, role_key, account_status, department,
    });

    res.status(201).json({
      success: true,
      message: 'Employee account created successfully.',
      data: { employee, tempPassword },
    });
  } catch (err) {
    next(err);
  }
};

// ─── List Employees ───────────────────────────────────────────────────────────

/**
 * GET /api/v1/employees
 * Any authenticated admin can view the team list.
 */
export const listEmployees = async (req, res, next) => {
  try {
    const employees = await employeesService.listEmployees();
    res.status(200).json({ success: true, count: employees.length, data: employees });
  } catch (err) {
    next(err);
  }
};

// ─── Change Password (first login) ───────────────────────────────────────────

/**
 * PATCH /api/v1/employees/change-password
 * The authenticated admin changes their own password.
 */
export const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return next(new AppError('current_password and new_password are required.', 400));
    }

    await employeesService.changePassword(req.user.id, { current_password, new_password });

    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};
