import { kGetFileUrlBase, kPostResumableUploadUrl } from "./constants";
import { throwIfResponseNotOk } from "./error-messages";

export const getFileMetadata = async (token: string, fileId: string) => {
  const authHeader = `Bearer ${token}`;
  const url = `${kGetFileUrlBase}/${fileId}?fields=name,mimeType`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: authHeader },
  });

  await throwIfResponseNotOk("Could not get file information", response);

  const responseObj = await response.json();
  return { name: responseObj.name, mimeType: responseObj.mimeType };
};

export const getFileContent = async (token: string, fileId: string) => {
  // TODO: Stream in the body and thereby provide a progress indicator?

  const authHeader = `Bearer ${token}`;
  const url = `${kGetFileUrlBase}/${fileId}?alt=media`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: authHeader },
  });

  await throwIfResponseNotOk("Could not get file contents", response);

  return await response.arrayBuffer();
};
