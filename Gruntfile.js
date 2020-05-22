const path = require('path');
const axios = require('axios');
const fs = require('fs');
const Promise = require('bluebird');
const jimp = require('jimp');
const compress_images = require('compress-images');
var AWS = require('aws-sdk');

AWS.config.update({region: 'us-east-2'});

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-shell');

  grunt.initConfig({
    fullImage: path.join(__dirname, '/images/full/'),
    mediumImage: path.join(__dirname, '/images/resized/'),
    tinyImage: path.join(__dirname, '/images/web/'),
    picList: [],
    targetSize: [160, 160],
    bucketParams: {
      Bucket : 'sdcwebimages',
      ACL : 'public-read'
    },
    shell: {
      upload: {
        command: bucket => `aws s3 cp ${grunt.config('tinyImage')} s3://${bucket}/ --recursive --acl public-read`,
      }
    }
  });

  grunt.registerTask('makelist', 'Put together paged responses from Lorem Picsum into a single array.', function() {
    var done = this.async();
    var total = grunt.option('total');

    grunt.config('picList', []);

    async function getListBatched(total) {
      const pages = total / 100;

      for (let i = 1; i <= pages; i++) {
        const response = await axios.get(`https://picsum.photos/v2/list?page=${i}&limit=${total}`);
        grunt.config('picList', grunt.config('picList').concat(response.data));
      }
    }

    getListBatched(total)
        .finally(done);
  });

  grunt.registerTask('fetch', 'Get images from Lorem Picsum.', function() {
    var done = this.async();
    var total = grunt.option('total');
    var picList = grunt.config('picList');

    async function getImages() {
      await fs.mkdir(grunt.config('fullImage'), { recursive: true }, (err) => {
        if (err) {
          grunt.log.write(err).ok();
        }
      });

      return Promise.map(picList, (picData, index) => {
          async function getImage() {

            const writer = fs.createWriteStream(`${grunt.config('fullImage')}${String(index + 1).padStart(4, '0')}.jpg`);

            const picResponse = await axios.get(picData.download_url, {
              responseType: 'stream'
            })

            picResponse.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
              });
          }

          return getImage();
        },
        { concurrency: 10 }
      );
    }

    getImages()
      .catch((err) => { grunt.log.write(err).ok(); })
      .finally(done);
  });

  grunt.registerTask('resize', 'Resize images for web use.', function() {
    var done = this.async();

    async function resizeImages() {
      await fs.mkdir(grunt.config('mediumImage'), { recursive: true }, (err) => {
        if (err) {
          grunt.log.write(err).ok();
        }
      });

      let fileArray = fs.readdirSync(grunt.config('fullImage'));

      return Promise.map(fileArray, (filePath) => {
          async function resizeImage() {
            await jimp.read(grunt.config('fullImage') + filePath)
            .then ((image) => {
              image.resize(grunt.config('targetSize')[0], grunt.config('targetSize')[1])
                .writeAsync(grunt.config('mediumImage') + filePath);
            })
            .catch((err) => { grunt.log.write(err).ok(); });
          }

          return resizeImage();
        },
        { concurrency: 10 }
      );
    }

    resizeImages()
      .catch((err) => { grunt.log.write(err).ok(); })
      .finally(done);
  });

  grunt.registerTask('compress', 'Compress images for web use.', function() {
    var done = this.async();

    fs.mkdir(grunt.config('tinyImage'), { recursive: true }, (err) => {
      if (err) {
        grunt.log.write(err).ok();
      }
      compress_images(
        `${grunt.config('mediumImage')}*.{jpg,JPG,jpeg,JPEG,gif,png,svg}`,
        grunt.config('tinyImage'),
        {compress_force: false, statistic: true, autoupdate: true},
        false,
        {jpg: {engine: 'mozjpeg', command: ['-quality', '60']}},
        {png: {engine: 'pngquant', command: ['--quality=20-50']}},
        {svg: {engine: 'svgo', command: '--multipass'}},
        {gif: {engine: 'gif2webp', command: ['--colors', '64', '--use-col=web']}},
        () => { done() }
      );
    });
  });

  grunt.registerTask('makebucket', 'Make the bucket in S3.', function() {
    var done = this.async();

    s3 = new AWS.S3({apiVersion: '2006-03-01'});

    s3.createBucket(grunt.config('bucketParams'), function(err, data) {
      if (err) {
        console.log("Error", err);
        done();
      } else {
        console.log("Success", data.Location);
        done();
      }
    });
  });

  grunt.registerTask('push', 'Upload webified images to S3', [`shell:upload:${grunt.config('bucketParams').Bucket}`]);


  grunt.registerTask('dummy', 'Download, process, and host dummy images', ['makelist','fetch', 'resize', 'compress', 'makebucket', 'push']);

};
