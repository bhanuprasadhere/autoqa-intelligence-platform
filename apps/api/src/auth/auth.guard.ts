import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class AuthGuard implements CanActivate {
    private supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return false;
        }

        const token = authHeader.substring(7);

        try {
            const { data: { user }, error } = await this.supabase.auth.getUser(token);

            if (error || !user) {
                return false;
            }

            // Attach user to request
            request.user = user;
            return true;
        } catch (error) {
            return false;
        }
    }
}
