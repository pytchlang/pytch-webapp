import { typeFromExtension } from "./mime-types";

// For ease of testing, only require some parts of an actual Response:
interface IPartResponse {
  ok: boolean;
  statusText: string;
  url: string;
  headers: { get(name: string): string | null };
}

/** Try to make a good guess at the mime-type of the given http
 * `fetchResponse`.  If a `Content-Type` header exists, use it.
 * Otherwise guess from the extension part of the URL's pathname.
 *
 * Throw an error if:
 *
 * * the `fetchResponse` is not "ok"
 * * there is no `Content-Type` header and no extension
 * * there is no `Content-Type` header and an unknown extension
 * */
export function guessedMimeType(fetchResponse: IPartResponse): string {
  const url = new URL(fetchResponse.url);

  if (!fetchResponse.ok) {
    throw new Error(
      `failed to fetch from "${url}": "${fetchResponse.statusText}"`
    );
  }

  const mTypeFromResponse = fetchResponse.headers.get("content-type");
  if (mTypeFromResponse != null) {
    return mTypeFromResponse;
  }

  const pathParts = url.pathname.split("/");
  const basename = pathParts[pathParts.length - 1];

  const nameParts = basename.split(".");
  const nNameParts = nameParts.length;
  if (nNameParts === 1)
    throw new Error(
      `could not guess mime type for "${url}";` +
        " no content-type in response and no extension"
    );

  const mTypeFromDatabase = typeFromExtension(nameParts[nNameParts - 1]);
  if (mTypeFromDatabase === false)
    throw new Error(
      `could not guess mime type for "${url}";` +
        " no content-type in response and unknown extension"
    );

  return mTypeFromDatabase;
}
