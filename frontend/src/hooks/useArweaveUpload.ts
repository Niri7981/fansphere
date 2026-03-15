import { uploadToArweave } from "@/services/arweave.service";
import { isUploadingAtom, uploadProgressAtom, uploadedHashAtom } from "@/store/upload.store";
import { useAtom } from "jotai";

export function useArweaveUpload() {
    const [isUploading, setIsUploading] = useAtom(isUploadingAtom);
    const [progress, setProgress] = useAtom(uploadProgressAtom);
    const [uploadedHash, setUploadedHash] = useAtom(uploadedHashAtom);

    const upload = async (file: File) => {
        if (!file) return;

        try {
            setIsUploading(true);
            setProgress(0);
            setUploadedHash(null);

            const hash = await uploadToArweave(file, (p) => setProgress(p));

            setUploadedHash(hash);
        } catch (error: any) {
            console.error("上传翻车:", error);
            alert(error.message);
            setProgress(0);
        } finally {
            setIsUploading(false);
        }
    };
    const reset = () => {
        setIsUploading(false);
        setProgress(0);
        setUploadedHash(null);
    };

    return {
        isUploading,
        progress,
        uploadedHash,
        upload,
        reset
    };
}