import { streamUploadWithUndici } from "./undiciUpload";
import { createServer } from "node:http";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Buffer } from "node:buffer";
import { describe, it } from "node:test";
import assert from "node:assert";

function createLocalHttpServerForUpload(
  saveUploadedFileFn: (fileBuffer: Buffer) => void
) {
  let port: number;
  let s: any;
  const RetryMax = 5;
  let retry = 0;
  while (retry < RetryMax) {
    try {
      port = Math.floor(Math.random() * 40000 + 10000);
      s = createServer(async (req, res) => {
        if (req.method === "POST" && req.url === "/upload") {
          const chunks: any[] = [];
          try {
            await pipeline(req, async function* (source) {
              for await (const chunk of source) {
                chunks.push(chunk);
              }
              yield;
            });
            const fileBuffer = Buffer.concat(chunks);
            saveUploadedFileFn(fileBuffer);
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("File received in memory\n");
          } catch (error) {
            console.error("Upload Error:", error);
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("File upload failed\n");
          }
        } else {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not Found\n");
        }
      });
      s.listen(port);
      return [s, port];
    } catch (_e) {
      retry += 1;
    }
  }

  throw new Error("failed to create local server with random port");
}

describe("streamUploadWithUndici", () => {
  it("should upload file to server", async () => {
    let uploadedFileBuffer: Buffer = Buffer.from("");
    const [server, port] = createLocalHttpServerForUpload((b) => {
      uploadedFileBuffer = b;
    });
    const testUploadURL = `http://localhost:${port}/upload`;

    const sampleReadable = Readable.from(
      `this is a sample file content for testing uploading with undici`
    );
    const res = await streamUploadWithUndici(testUploadURL, sampleReadable);

    assert(res.statusCode === 200);
    assert(uploadedFileBuffer.length === 262);

    const contents = uploadedFileBuffer.toString().split("\r\n");
    const expectedContents = contents.slice(1, -2).join("\r\n");
    assert.equal(expectedContents, 'Content-Disposition: form-data; name="file"\r\nContent-Type: application/octet-stream\r\n\r\nthis is a sample file content for testing uploading with undici');

    server.close();
  });
});
