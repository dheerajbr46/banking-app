export interface UserProfile {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
}

export interface AuthCredentials {
    email: string;
    password: string;
}
