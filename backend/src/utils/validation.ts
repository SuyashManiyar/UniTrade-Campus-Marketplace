import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().refine(email => email.endsWith('@umass.edu'), {
    message: 'Must be a valid UMass email address'
  }),
  name: z.string().min(1, 'Name is required'),
  pronouns: z.string().optional(),
  major: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

export const listingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(['ELECTRONICS', 'FURNITURE', 'TEXTBOOKS', 'BIKES', 'CLOTHING', 'OTHER']),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']),
  price: z.number().positive('Price must be positive'),
  type: z.enum(['DIRECT_SALE', 'AUCTION']).default('DIRECT_SALE'),
  startingBid: z.number().positive().optional(),
  bidIncrement: z.number().positive().optional(),
  auctionEndTime: z.string().datetime().optional(),
});

export const bidSchema = z.object({
  amount: z.number().positive('Bid amount must be positive'),
});

export const messageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  receiverId: z.string(),
  listingId: z.string(),
});