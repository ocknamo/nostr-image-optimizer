# nostr-image-optimizer

Worker proxy to change the size and quality of the image form remote image.


## Usage

`<optimazerUrl>/image/width=<number>,height=<number>,quality=<number>,format=<string>/<originalImageUrl>`

## Deploy

```
npm install
# Deploy as cloudflare workers!
npm run deploy
```


### Example

- image width: 800px
- quarity: 50
- format: webp

`${optimazerUrl}/image/width=800,quality=50,format=webp/${originalImageUrl}`


### Params

Params for output image. All parameters are optional values.

- quality: 1-100
- width: 1-2500
- height: 1-2500
- format: 'webp' or 'jpeg' or 'png'. default is 'webp'.

### Image

- source format
  - jpeg
  - png
  - webp
  - svg
  - avif
- output format
  - jpeg
  - png
  - webp

### Response Header

Add these headers.

- `Content-Type`: `'image/jpeg' or 'image/png' or 'image/webp'`
- `Cache-Control`: `public, max-age=86400, stale-while-revalidate=7200, stale-if-error=3600, s-maxage=1209600` 

If header exists in response from remote image, add these headers.

- `ETAG`
- `LAST-MODIFIED`


## Thanks

- https://github.com/node-libraries/wasm-image-optimization
