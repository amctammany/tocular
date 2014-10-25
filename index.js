'use strict';

var fs = require('fs');

function anchorize(string) {
  return '#' + string.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
}

function getHeader(line) {
  var header = void 0;
  var arr, title, indent;
  if (line[0] === '#') {
    arr = line.split(' ');
    indent = arr.shift().length;
    title = arr.join(' ');
    header = {
      title: title,
      anchor: anchorize(title),
      children: [],
      indent: indent
    };
  }

  return header;
}

function collapse(stack, indent) {
  while (stack.length > indent) {
    var head = stack.pop();
    if (stack.length > 0) {
      stack[stack.length-1].children.push(head);
    }
  }
  return stack;
}

String.prototype.repeat = function (count) {
  if (count < 0) {return '';}
  var result = '', pattern = this.valueOf();
  while (count > 1) {
    if (count & 1) { result += pattern;}
    count >>= 1, pattern += pattern;
  }
  return result + pattern;
};

function parseHeader(header) {
  var md = ['  '.repeat(header.indent) + '* [' + header.title + '](' + header.anchor + ')'];

  return md.concat(header.children.map(parseHeader)).join('\n');
  //return md.join('\n');
}
function generateTOC(headers) {
  var toc = headers.map(parseHeader);
  return toc.join('\n');
}
module.exports = function (mdpath) {
  function parseMd (md) {
    var toc = {};
    toc.headers = [];

    var line, lines = md.split('\n');
    var arr, header, title, indent = 0;
    var stack = [];

    line = lines.shift();
    while (lines.length > 0) {
      header = getHeader(line);
      if (header) {
        if (header.indent === 1) {
          toc.headers.push(header);
          stack = collapse(stack, 0);
          //stack = [];
          indent = 0;
        }


        if (header.indent <= indent) {
          stack = collapse(stack, header.indent - 1);
        }
        stack.push(header);
        indent = header.indent;

      }
      line = lines.shift();
    }
    collapse(stack, 1);
    toc.toc = generateTOC(toc.headers);
    return toc;
  }

  var file = fs.readFileSync(mdpath, 'utf8', function (err, data) {
    if (err) {
      throw err;
    }
    return data;
  });

  return parseMd(file);
};

module.exports.collapse = collapse;
module.exports.getHeader = getHeader;
