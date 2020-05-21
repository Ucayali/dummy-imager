const path = require('path');
const axios = require('axios');
const fs = require('fs');
const Promise = require('bluebird');

module.exports = function(grunt) {

  grunt.initConfig({
    fullImage: path.join(__dirname, '/images/full/'),
    tinyImage: path.join(__dirname, '/images/web/'),
    push: {
      bucket: '',
    },
  });

  grunt.registerTask('makelist', 'Put together paged responses from Lorem Picsum insto a single array.', function() {
    var done = this.async();
    var total = grunt.option('total');

    grunt.config('picList', []);

    async function getListBatched(total) {
      const pages = total / 100;

      for (let i = 1; i <= pages; i++) {
        console.log(i);
        const response = await axios.get(`https://picsum.photos/v2/list?page=${i}&limit=${total}`);
        grunt.config('picList', grunt.config('picList').concat(response.data));
        console.log('list length:', grunt.config('picList').length);
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
            //grunt.log.write(`Getting image ${index + 1}`).ok();

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
      .finally(done);
  });

  grunt.registerTask('webify', 'Resize and compress images for web use.', function() {
    var done = this.async();
    grunt.log.write('Logging some stuff...').ok();
    done();
  });

  grunt.registerTask('push', 'Upload webified images to S3.', function() {
    var done = this.async();
    grunt.log.write('Logging some stuff...').ok();
    done();
  });

  grunt.registerTask('dummy', 'Download, process, and host dummy images', ['makelist','fetch', 'webify', 'push']);

};
