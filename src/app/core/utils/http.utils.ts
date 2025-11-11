export function unwrapPayload<T>(payload: T | { data: T }): T {
    if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
        return (payload as { data: T }).data;
    }
    return payload as T;
}
