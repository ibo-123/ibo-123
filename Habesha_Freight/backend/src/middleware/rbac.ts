import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

export type UserRole = 'SHIPPER' | 'DRIVER' | 'FLEET_OWNER' | 'ADMIN';

/**
 * Role-Based Access Control (RBAC) middleware generator.
 * Restricts endpoint access to specified user roles.
 * 
 * @param allowedRoles List of roles permitted to access the endpoint
 */
export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Please authenticate first.',
        error: { code: 'UNAUTHORIZED' },
      });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole as UserRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Access denied for role '${userRole}'. Required role(s): ${allowedRoles.join(', ')}.`,
        error: { code: 'FORBIDDEN' },
      });
    }

    next();
  };
}
