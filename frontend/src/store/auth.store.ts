import { AuthManager } from "@/services/auth.service"
import { atom } from 'jotai';

export const jwtAtom = atom<string | null>(AuthManager.getToken());

export const walletAddressAtom = atom<null>(null);

export const isAuthenticatedAtom = atom((get) => !!get(jwtAtom));
