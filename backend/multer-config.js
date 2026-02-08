/**
 * Multer configuration for media uploads
 */

import multer from 'multer';
import path from 'path';

// Configure multer for memory storage (we'll handle file saving manually)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only images and videos are allowed!'));
};

// Multer upload configuration
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter,
});

export default upload;
