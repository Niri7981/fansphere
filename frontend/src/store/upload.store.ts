import { atom } from 'jotai';
import { DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_CREATE_ROOT_CONTAINERS } from 'react-dom/client';

export const isUploadingAtom = atom<boolean>(false);

export const uploadProgressAtom = atom<number>(0);

export const uploadedHashAtom = atom<string | null>(null);