/**
 * Zod validation schemas for all forms.
 * Shared between mobile form hooks for consistent validation.
 */

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    // Either create a company or join via invite
    companyName: z.string().optional(),
    invitationToken: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const incidentReportSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  projectId: z.string().uuid('Select a project'),
  incidentType: z.enum([
    'near_miss',
    'injury',
    'property_damage',
    'environmental',
    'security',
    'fire',
    'other',
  ]),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  occurredAt: z.date(),
  locationDescription: z.string().optional(),
  injuredPerson: z.string().optional(),
  witnesses: z.array(z.string()).optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type IncidentReportFormData = z.infer<typeof incidentReportSchema>;
