import {
  kGetFileUrlBase,
  kGetUserInfo,
  kPostResumableUploadUrl,
} from "./constants";
import { throwIfResponseNotOk } from "./error-messages";
import { GoogleUserInfo } from "./shared";

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

export const postResumableUpload = async (
  token: string,
  resource: any
): Promise<string> => {
  const authHeader = `Bearer ${token}`;
  const response = await fetch(kPostResumableUploadUrl, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json;charset=UTF-8",
    },
    body: JSON.stringify(resource),
  });
  await throwIfResponseNotOk("Could not start upload process", response);

  const contentUrl = response.headers.get("Location");
  if (contentUrl == null) {
    // Invent a code, for consistency with other error messages.
    throw new Error(
      'Unexpected response from Google (code: "noLocationHeader")'
    );
  }

  return contentUrl;
};

export const postFileContent = async (
  token: string,
  contentUrl: string,
  data: any
) => {
  const authHeader = `Bearer ${token}`;
  const response = await fetch(contentUrl, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/octet-stream",
      "Content-Length": data.byteLength.toString(),
    },
    body: data,
  });
  await throwIfResponseNotOk("Could not upload file contents", response);
};

export const getAbout = async (token: string): Promise<GoogleUserInfo> => {
  const authHeader = `Bearer ${token}`;
  const url = `${kGetUserInfo}?fields=user`;
  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: authHeader },
  });

  await throwIfResponseNotOk("Could not get user information", response);

  const aboutObj = await response.json();
  const user = aboutObj.user;

  return { displayName: user.displayName, emailAddress: user.emailAddress };
};
