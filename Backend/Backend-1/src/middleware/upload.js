import multer from 'multer';
import { AppError } from './errorHandler.js';

// ─── Config ───────────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ─── Multer Setup ─────────────────────────────────────────────────────────────

const storage = multer.memoryStorage(); // Store file in memory (buffer), not on disk

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Invalid file type. Only PDF, DOC, and DOCX files are allowed.',
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter,
});

/**
 * Middleware to handle single resume file upload.
 * The file will be available in req.file as a Buffer.
 * Field name: "resume"
 */
export const uploadResume = upload.single('resume');
