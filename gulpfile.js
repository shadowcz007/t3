// libs
var browserSync = require('browser-sync');
var watchify = require('watchify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var exec = require('child_process').exec;
var pkg = require('./package.json');

// gulp extras
var gulp = require('gulp');
var git = require('gulp-git');
var bump = require('gulp-bump');
var filter = require('gulp-filter');
var tagVersion = require('gulp-tag-version');
var useWatchify;

function run(bundler, minify) {
  if (minify) {
    bundler = bundler.plugin('minifyify', {
      map: pkg.name + '.map.json',
      output: './dist/' + pkg.name + '.map.json'
    });
  }

  console.time('build');
  return bundler
    .bundle({
      debug: true,
      standalone: pkg.name
    })
    .pipe(source(pkg.name + (minify ? '.min' : '') + '.js'))
    .pipe(gulp.dest('./dist/'))
    .on('end', function () {
      console.timeEnd('build');
    });
}

gulp.task('browserify', function () {
  var method = useWatchify ? watchify : browserify;

  var bundler = method({
    entries: ['./src/js/index.js'],
    extensions: ['js']
  });

  var bundle = function () {
    if (!useWatchify) {
      // concat + min
      run(bundler, true);
    }
    // concat
    return run(bundler);
  };

  if (useWatchify) {
    bundler.on('update', bundle);
  }

  return bundle();
});

gulp.task('browserSync', ['build'], function () {
  browserSync.init(['./examples/**/*'], {
    server: {
      baseDir: '.'
    }
  });
});



function createTag(type) {
  return gulp.src(['./package.json', './bower.json'])
    .pipe(bump({ type: type }))
    .pipe(gulp.dest('./'))
    .pipe(git.commit('bump version'))
    .pipe(filter('package.json'))
    .pipe(tagVersion());
};

gulp.task('tag', ['bump'], function (cb) {
  var version = require('./package.json').version;
  var message = 'Release ' + version;
  console.log(message);
  // gulp.src('./')
  //   .pipe(git.commit(message));
  // git.tag(version, message);
  // exec('./push.sh', function (err, stdout, stderr) {
  //   console.log(stdout);
  //   console.log(stderr);
  //   cb(err);
  // });
  // git.push('origin', 'master', {args: '--tags'});
});

gulp.task('useWatchify', function () {
  useWatchify = true;
});

gulp.task('watch', ['useWatchify', 'browserSync'], function () {
});

// main tasks
gulp.task('build', ['browserify']);

gulp.task('release.major', function () { return createTag('major') });
gulp.task('release.minor', function () { return createTag('minor') });
gulp.task('release.patch', function () { return createTag('patch') });

gulp.task('default', ['watch']);