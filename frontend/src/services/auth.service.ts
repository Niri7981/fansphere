import { getTokenGroupMemberState, resumeInstructionData } from "@solana/spl-token";


export function generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
}


export function createSignInMessage(pubkey: string, nonce: string): string {
    const timestamp = new Date().toISOString();

    return `Welcome to FanSphere!

Click to sign in and accept the FanSphere Terms of Service.
This request will not trigger a blockchain transaction or cost any gas fees.

Domain: fansphere.com
Wallet address:
${pubkey}

Nonce:
${nonce}

Timestamp:
${timestamp}`;

}

const TOKEN_KEY = 'fansphere_jwt';

export const AuthManager = {
    setToken(token: string) {
        if (typeof window !== 'undefined') {
            localStorage.setItem(TOKEN_KEY, token);
        }
    },

    getToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(TOKEN_KEY);
        }
        return null;
    },

    clearToken() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_KEY);
        }
    },

    iSAuthenticated(): boolean {
        return !!this.getToken();
    }
};

