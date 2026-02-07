export function getErrorMessage(error: unknown): string {
    console.log('[getErrorMessage] Input:', error);
    if (error instanceof Error) {
        const axiosError = error as any;
        // Axios Error
        if (axiosError.response?.data?.message) {
            let msg = axiosError.response.data.message;
            console.log('[getErrorMessage] Found response.data.message:', msg);

            // Recursive unwrap: sometimes NestJS wraps the error inside the message property
            if (typeof msg === 'object' && msg !== null && 'message' in msg) {
                msg = msg.message;
            }

            if (Array.isArray(msg)) return msg.join(', ');
            if (typeof msg === 'object') return JSON.stringify(msg);
            return String(msg);
        }

        // Check if data itself is the error object
        if (axiosError.response?.data && typeof axiosError.response.data === 'object') {
            const data = axiosError.response.data;
            if (data.message && typeof data.message === 'string') return data.message;
            // Generic fallback
            return axiosError.message;
        }

        // Regular Error
        return error.message;
    }

    if (typeof error === 'string') return error;

    return 'Something went wrong. Please try again.';
}
