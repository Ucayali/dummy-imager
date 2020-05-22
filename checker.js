const fs = require('fs');
const path = require('path');

const list = [];

const YIELD = 993;
const IMGDIR = '/images/web/'

for (let i = 1; i <= YIELD; i += 1) {
  list.push(i.toString().padStart(4, '0'));
}

const dir = fs.readdirSync(path.join(__dirname, IMGDIR))
  .map((item) => item.slice(0, item.indexOf('.')));

const lost = list.filter((item) => dir.indexOf(item) === -1)
  .map((item) => item.concat('.jpg'));


console.log(lost);
