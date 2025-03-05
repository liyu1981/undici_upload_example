This is a complete example on how to stream uploading with undici library.

Somehow following popular results from search are not complete, or lack of description of key secret.

1. https://github.com/nodejs/undici/issues/2202
2. https://github.com/nodejs/undici/blob/main/docs/examples/README.md
3. https://gist.github.com/PaulMougel/7511372

This is my try. It is working with current node v22.13.0. And the key secret is actually the FormData provided by undici is broken in supporting streams.
