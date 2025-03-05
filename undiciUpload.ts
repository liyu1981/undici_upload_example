import FormData from "form-data";
import Readable from "node:stream";
import {request} from "undici";

export async function streamUploadWithUndici(url: string, streamInput: Readable) {
  // The key here is to use FormData from pkg "form-data" instead of the one
  // from "undici". The latter doesn't support streaming.
  const formData = new FormData();
  formData.append("file", streamInput);
  const res = await request(url, {
    method: "POST",
    body: formData
  });
  return res;
}
