import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '_') // Replace special characters with underscores
      .toLowerCase(); // Convert to lowercase
    cb(null, `${name}_${uniqueSuffix}${ext}`);
  }
});

// File filter to only allow images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
    files: 5 // Maximum 5 files
  },
  fileFilter: fileFilter
});

export const uploadImages = upload.array('images', 5);

// Middleware to handle upload errors
export const handleUploadError = (error: any, req: any, res: any, next: any): void => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum 5MB per file.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum 5 files allowed.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected field name. Use "images" field for file uploads.' });
    }
  }
  
  if (error.message.includes('Only image files are allowed')) {
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
};

// Helper function to get file URL
export const getFileUrl = (filename: string): string => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 8080}`
    : `http://localhost:${process.env.PORT || 8080}`;
  return `${baseUrl}/uploads/${filename}`;
};

// Helper function to delete files
export const deleteFiles = (filenames: string[]): void => {
  filenames.forEach(filename => {
    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
};