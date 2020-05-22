# dummy-imager
Batch downloads images, resizes, compresses, and pushes to S3

# Requirements

- AWS CLI needs to be installed and configured.
- Grunt CLI needs to be installed globally

```sh
npm install -g grunt-cli
```

# Configuration

You may wish to set a few of the config options at the top of the Gruntfile. These include:
- intended paths for the full-sized, resized, and compressed images
- the intended size of the final images `[width, height]`
- the name of the bucket you want to upload to
- the intended size of image to be uploaded (by directory path)

# Commands

If you want to just run the whole process, there is a batch task:

```sh
grunt dummy --total=1234
```
where the `total` option sets the number of images you want to fetch and process. Currently it seems like there are only 993 items available from lorum pictum, so if total is set higher than that you'll just get them all.

You can also run the commands individually:
- `grunt makelist total=4321`
- `grunt fetch`
- `grunt resize`
- `grunt compress`
- `grunt makebucket`
- `grunt push`