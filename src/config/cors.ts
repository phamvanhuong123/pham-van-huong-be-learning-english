import { CorsOptions } from 'cors';
import { WHITELIST_DOMAINS } from '@/utils/constanst'; // Khuyên bạn nên đổi tên file này thành constants.ts
import { env } from '@/config/environment';
import { StatusCodes } from 'http-status-codes';
import ApiError from '@/utils/ApiError';

export const corsOptions: CorsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        if (!origin && env.BUILD_MODE === 'dev') {
            return callback(null, true);
        }

        if (origin && WHITELIST_DOMAINS.includes(origin)) {
            return callback(null, true);
        }
        return callback(
            new ApiError(`${origin || 'Unknown origin'} not allowed by our CORS Policy.`, StatusCodes.FORBIDDEN)
        );
    },
    optionsSuccessStatus: 200,
    credentials: true,
};
