export interface UserProfile {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
}

export interface AuthCredentials {
    email: string;
    password: string;
    remember?: boolean;
}

export interface RegistrationPayload {
    name: string;
    username: string;
    email: string;
    password: string;
}
