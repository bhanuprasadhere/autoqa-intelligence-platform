import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

export const Roles = (...roles: string[]) => {
    return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
        if (descriptor) {
            Reflect.defineMetadata('roles', roles, descriptor.value);
            return descriptor;
        }
        Reflect.defineMetadata('roles', roles, target);
        return target;
    };
};

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prisma: PrismaService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const roles = this.reflector.get<string[]>('roles', context.getHandler());
        if (!roles) {
            return true; // No role requirement
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        // Get user profile with role
        const profile = await this.prisma.profile.findUnique({
            where: { id: user.id },
            select: { role: true },
        });

        if (!profile || !roles.includes(profile.role)) {
            throw new ForbiddenException('Insufficient permissions');
        }

        return true;
    }
}
