var shell = require('shelljs/make'),
    ug = require('uglify-js'),
    fs = require('fs'),
    vm = require('vm'),
    tar = require('tar-fs'),
    zlib = require('zlib'),
    copy = "// Copyright 2015 Olaf Frohn https://github.com/ofrohn, see LICENSE\n",
    begin = "!(function() {",
    end = "this.Celestial = Celestial;\n})();",
    filename = './celestial';

    
target.all = function() {
  target.test()
  target.build()
};

target.test = function() {
  cd('src');

  //jshint linting
  ls("*.js").forEach(function(file) {
    if (exec('jshint ' + file).code !== 0) {
      echo('JSHINT FAILED');
      exit(0);
    }
  });

  echo('JSHint tests passed');
  cd('..');

  //run tests
  cd('test');
  ls("*-test.js").forEach(function(file) {
    if (exec('node ' + file).code !== 123) {
      echo('TEST FAILED for ' + file);
      exit(0);  
    }
  });

  echo('Unit tests passed');

  cd('..');
};

target.build = function() {

  vm.runInThisContext(fs.readFileSync('./src/celestial.js', 'utf-8'), './src/celestial.js');
  echo('V' + Celestial.version);
  filename += Celestial.version;
  
  var file = cat([
    './src/celestial.js', 
    './src/projection.js', 
    './src/transform.js', 
    './src/config.js', 
    './src/symbol.js',
    './lib/d3.geo.zoom.js'
  ]);
  file = copy + begin + file.replace(/\/\* global.*/g, '') + end;
  file.to(filename + '.js');

  echo('Minifying');

  var out = ug.minify(filename + '.js');
  fs.writeFileSync(filename + '.min.js', copy + out.code);
  /*var read = ug.parse(fs.readFileSync(filename + '.js', "utf8"));
  read.figure_out_scope();

  var comp = read.transform( UglifyJS.Compressor(); );
  comp.figure_out_scope();
  comp.compute_char_frequency();
  comp.mangle_names();

  var out = comp.print_to_string();
  fs.writeFileSync(filename + '.min.js', out);
  */

  echo('Writing data');

  // zip data + prod. code + css
  tar.pack('./', {
       entries: ['viewer.html', 'style.css', 'readme.md', 'LICENSE', 'celestial.min.js', 'data', 'lib/d3.min.js', 'lib/d3.geo.projection.min.js'] 
     })
     .pipe(zlib.createGzip())
     .pipe(fs.createWriteStream(filename + '.tar.gz'))

  echo('Done');
};