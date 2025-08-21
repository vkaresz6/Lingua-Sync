
import { useCallback } from 'react';
import { useSession } from '../components/contexts/SessionContext';
import { ApiResponse } from '../utils/geminiApi';

export const useApi = () => {
    const { addTokens } = useSession();

    const withApiTracking = useCallback(async <T,>(apiCall: () => Promise<ApiResponse<T>>): Promise<T> => {
        const { data, inputTokens, outputTokens, apiCalls } = await apiCall();
        addTokens(inputTokens, outputTokens, apiCalls);
        return data;
    }, [addTokens]);

    return { withApiTracking };
};