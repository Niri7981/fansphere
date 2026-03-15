import { atom } from 'jotai';

export const isUploadingAtom = atom<boolean>(false);

export const uploadProgressAtom = atom<number>(0);

export const uploadedHashAtom = atom<string | null>(null);