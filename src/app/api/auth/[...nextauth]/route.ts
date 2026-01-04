/**
 * Auth.js API Route Handler
 * Handles all authentication requests at /api/auth/*
 */

import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
