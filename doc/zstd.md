# ZSTD compression

## Level

### 1 - Toaster mode

The fastest level for old embedded device.

`--fast=5`

For arm7l with one core.

### 2 - Fast mode

Fast level for newer embedded device with fast storage. 

`--fast`

For arm7l with multi-core.

### 3 - Default mode

Default level. Should work correctly in most case.

`--long`

For arm64 and amd64.

### 4 - Adaptative mode

Higher adaptive compression for highly compressible usage or high-power server.

`--adapt --long`

For SPEED AND POWEEEEEEEEEEEEEEEEEEEEEERRRRR

![gif](https://media.tenor.com/3Z8pYdtIuvkAAAAC/top-gear-clarkson.gif)
