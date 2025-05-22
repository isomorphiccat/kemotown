import { z } from 'zod';

export const UserCreateSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  furryName: z.string().optional(),
  profilePictureUrl: z.string().url("Invalid URL format").optional(),
  fursuitGallery: z.any().optional(), // Prisma's Json type can be complex to validate deeply with Zod initially
  characterDetails: z.any().optional(),
  socialMediaLinks: z.any().optional(),
  interestTags: z.array(z.string()).optional(),
});

export type UserCreateData = z.infer<typeof UserCreateSchema>;

export const UserUpdateSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long").optional(),
  email: z.string().email("Invalid email address").optional(),
  password: z.string().min(6, "Password must be at least 6 characters long").optional(), // For password changes
  furryName: z.string().optional(),
  profilePictureUrl: z.string().url("Invalid URL format").optional(),
  fursuitGallery: z.any().optional(),
  characterDetails: z.any().optional(),
  socialMediaLinks: z.any().optional(),
  interestTags: z.array(z.string()).optional(),
});

export type UserUpdateData = z.infer<typeof UserUpdateSchema>;
