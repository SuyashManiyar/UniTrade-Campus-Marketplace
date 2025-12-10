import request from 'supertest';
import express from 'express';
import apiRouter from '../api';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

describe('API Routes', () => {
    describe('GET /api/health', () => {
        it('should return health check status', async () => {
            const response = await request(app)
                .get('/api/health');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'OK');
            expect(response.body).toHaveProperty('message', 'UMass Marketplace API is working!');
            expect(response.body).toHaveProperty('timestamp');
        });

        it('should return valid ISO timestamp', async () => {
            const response = await request(app)
                .get('/api/health');

            const timestamp = new Date(response.body.timestamp);
            expect(timestamp.toString()).not.toBe('Invalid Date');
        });

        it('should return timestamp close to current time', async () => {
            const before = Date.now();
            const response = await request(app)
                .get('/api/health');
            const after = Date.now();

            const timestamp = new Date(response.body.timestamp).getTime();
            expect(timestamp).toBeGreaterThanOrEqual(before);
            expect(timestamp).toBeLessThanOrEqual(after);
        });
    });

    describe('Route mounting', () => {
        it('should mount auth routes', async () => {
            // This will fail with 400 (validation) but proves route is mounted
            const response = await request(app)
                .post('/api/auth/register')
                .send({});

            expect(response.status).not.toBe(404);
        });

        it('should mount user routes', async () => {
            const response = await request(app)
                .get('/api/users/profile');

            // Will fail with auth error (401) but proves route is mounted
            expect(response.status).not.toBe(404);
        });

        it('should mount listing routes', async () => {
            const response = await request(app)
                .get('/api/listings');

            expect(response.status).not.toBe(404);
        });

        it('should mount message routes', async () => {
            const response = await request(app)
                .get('/api/messages/conversations');

            // Will fail with auth but proves route is mounted
            expect(response.status).not.toBe(404);
        });

        it('should mount admin routes', async () => {
            const response = await request(app)
                .get('/api/admin/stats');

            // Will fail with auth but proves route is mounted
            expect(response.status).not.toBe(404);
        });

        it('should mount wishlist routes', async () => {
            const response = await request(app)
                .get('/api/wishlist');

            // Will fail with auth but proves route is mounted
            expect(response.status).not.toBe(404);
        });

        it('should mount report routes', async () => {
            const response = await request(app)
                .post('/api/reports')
                .send({});

            // Will fail with auth but proves route is mounted
            expect(response.status).not.toBe(404);
        });

        it('should mount notification routes', async () => {
            const response = await request(app)
                .get('/api/notifications');

            // Will fail with auth but proves route is mounted
            expect(response.status).not.toBe(404);
        });
    });
});
