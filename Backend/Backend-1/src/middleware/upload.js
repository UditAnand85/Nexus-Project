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
  const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.mimetype);
  
  // Also check file extension (case-insensitive) for compatibility with some mobile uploads
  const extension = file.originalname ? file.originalname.split('.').pop().toLowerCase() : '';
  const isAllowedExt = ['pdf', 'doc', 'docx'].includes(extension);

  // If MIME is standard OR (MIME is generic/octet-stream/empty and extension is valid), allow it
  const isGenericMime = file.mimetype === 'application/octet-stream' || !file.mimetype;

  if (isAllowedMime || (isGenericMime && isAllowedExt)) {
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
