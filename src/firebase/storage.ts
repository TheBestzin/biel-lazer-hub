import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

import { getFirebaseStorage } from "./config";

export const StorageService = {
  async enviar(caminho: string, arquivo: File): Promise<string> {
    const referencia = ref(getFirebaseStorage(), caminho);
    await uploadBytes(referencia, arquivo);
    return getDownloadURL(referencia);
  },
  async remover(caminho: string): Promise<void> {
    await deleteObject(ref(getFirebaseStorage(), caminho));
  },
};
