/**
 * Custom Prisma type definitions for Docker environment compatibility
 */

// User creation input type that works in Docker environment
export interface DockerSafeUserCreate {
  name: string;
  email: string;
  password: string;
  role?: string;
  emailVerified?: Date;
  image?: string | null;
  isActive?: boolean;
  organizationId?: string | null;
} 