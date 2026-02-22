/**
 * Basic server-side logging utility.
 * In a real-world scenario, this would send logs to a service like Sentry, Axiom, or CloudWatch.
 */
export const logger = {
    info: (message: string, context?: any) => {
        console.log(`[INFO] [${new Date().toISOString()}] ${message}`, context ? JSON.stringify(context, null, 2) : "");
    },
    warn: (message: string, context?: any) => {
        console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, context ? JSON.stringify(context, null, 2) : "");
    },
    error: (message: string, error?: any, context?: any) => {
        const errorDetails = {
            message: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            ...context
        };
        console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, JSON.stringify(errorDetails, null, 2));
    }
};

/**
 * Specifically for catching and logging unhandled server-side errors in Next.js actions/routes
 */
export function captureError(context: string, error: unknown) {
    logger.error(`Error occurred in ${context}`, error);
    // Future: send to Sentry here
}
