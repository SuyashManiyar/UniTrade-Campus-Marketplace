import { getFileUrl, deleteFiles, handleUploadError } from '../upload';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Mock fs
jest.mock('fs');

describe('Upload Middleware', () => {
    const mockFs = fs as jest.Mocked<typeof fs>;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getFileUrl', () => {
        const originalEnv = process.env;

        beforeEach(() => {
            process.env = { ...originalEnv };
        });

        afterEach(() => {
            process.env = originalEnv;
        });

        it('should generate URL with default port in development', () => {
            process.env.NODE_ENV = 'development';
            delete process.env.PORT;

            const url = getFileUrl('test.jpg');

            expect(url).toBe('http://localhost:8080/uploads/test.jpg');
        });

        it('should generate URL with custom port', () => {
            process.env.NODE_ENV = 'development';
            process.env.PORT = '3000';

            const url = getFileUrl('test.jpg');

            expect(url).toBe('http://localhost:3000/uploads/test.jpg');
        });

        it('should use BACKEND_URL in production', () => {
            process.env.NODE_ENV = 'production';
            process.env.BACKEND_URL = 'https://api.example.com';

            const url = getFileUrl('test.jpg');

            expect(url).toBe('https://api.example.com/uploads/test.jpg');
        });

        it('should handle filenames with special characters', () => {
            process.env.NODE_ENV = 'development';

            const url = getFileUrl('test image 123.jpg');

            expect(url).toContain('test image 123.jpg');
        });
    });

    describe('deleteFiles', () => {
        it('should delete existing files', () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.unlinkSync.mockImplementation(() => { });

            deleteFiles(['file1.jpg', 'file2.png']);

            expect(mockFs.existsSync).toHaveBeenCalledTimes(2);
            expect(mockFs.unlinkSync).toHaveBeenCalledTimes(2);
        });

        it('should skip non-existent files', () => {
            mockFs.existsSync.mockReturnValue(false);

            deleteFiles(['nonexistent.jpg']);

            expect(mockFs.existsSync).toHaveBeenCalledTimes(1);
            expect(mockFs.unlinkSync).not.toHaveBeenCalled();
        });

        it('should handle empty array', () => {
            deleteFiles([]);

            expect(mockFs.existsSync).not.toHaveBeenCalled();
            expect(mockFs.unlinkSync).not.toHaveBeenCalled();
        });

        it('should delete multiple files', () => {
            mockFs.existsSync.mockReturnValue(true);
            mockFs.unlinkSync.mockImplementation(() => { });

            const files = ['file1.jpg', 'file2.png', 'file3.gif'];
            deleteFiles(files);

            expect(mockFs.unlinkSync).toHaveBeenCalledTimes(3);
        });
    });

    describe('handleUploadError', () => {
        let mockReq: any;
        let mockRes: any;
        let mockNext: jest.Mock;

        beforeEach(() => {
            mockReq = {};
            mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            };
            mockNext = jest.fn();
        });

        it('should handle LIMIT_FILE_SIZE error', () => {
            const error = new multer.MulterError('LIMIT_FILE_SIZE');

            handleUploadError(error, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'File size too large. Maximum 5MB per file.'
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle LIMIT_FILE_COUNT error', () => {
            const error = new multer.MulterError('LIMIT_FILE_COUNT');

            handleUploadError(error, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Too many files. Maximum 5 files allowed.'
            });
        });

        it('should handle LIMIT_UNEXPECTED_FILE error', () => {
            const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE');

            handleUploadError(error, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Unexpected field name. Use "images" field for file uploads.'
            });
        });

        it('should handle file type error', () => {
            const error = new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)');

            handleUploadError(error, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Only image files are allowed (jpeg, jpg, png, gif, webp)'
            });
        });

        it('should pass other errors to next middleware', () => {
            const error = new Error('Some other error');

            handleUploadError(error, mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should handle unknown multer errors', () => {
            const error = new multer.MulterError('UNKNOWN_ERROR' as any);
            error.message = 'Unknown multer error';

            handleUploadError(error, mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });
});
