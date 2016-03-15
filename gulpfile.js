const
    gulp = require('gulp'),
    $ = require('gulp-load-plugins')(),
    karma = require('karma').Server,
    pkg = require('./package.json'),
    del = require('del');

var banner = [
  '/**',
  ' * @name <%= pkg.name %>',
  ' * @version v<%= pkg.version %>',
  ' * @author <%= pkg.author %>',
  ' * @license <%= pkg.license %>',
  ' */',
  ''
].join('\n');


/**
 * Concat source files into one plugin file.
 */
gulp.task('concat:src', function() {
  return gulp.src([
        './src/oauth2.module.js',
        './src/**/*.js'
      ])
      .pipe($.insert.append('\n'))
      .pipe($.concat('mindsmash-oauth2.js'))
      .pipe($.ngAnnotate({ add: true, remove: true, single_quotes: true }))
      .pipe($.wrap('(function(angular) {'
          + '\n\'use strict\';'
          + '\n\n<%=contents%>'
          + '})(angular);'))
      .pipe(gulp.dest('./.tmp'));
});


/**
 * Copy source files.
 */
gulp.task('copy:src', ['concat:src'], function() {
  return gulp.src('./.tmp/mindsmash-oauth2.js')
      .pipe($.header(banner, { pkg: pkg }))
      .pipe(gulp.dest('./dist'));
});


/**
 * Uglify the plugin file and also append header to it.
 */
gulp.task('uglify:src', ['copy:src'], function() {
  return gulp.src('./dist/mindsmash-oauth2.js')
      .pipe($.uglify())
      .pipe($.header(banner, { pkg: pkg }))
      .pipe($.rename({ suffix: '.min' }))
      .pipe(gulp.dest('./dist'));
});


/**
 * Delete temporary folders.
 */
gulp.task('clean:tmp', function() {
  return del(['./.tmp']);
});
gulp.task('clean:dist', function() {
  return del(['./dist']);
});
gulp.task('clean:docs', function() {
  return del(['./docs']);
});


/**
 * Lint source files.
 */
gulp.task('lint:src', function() {
	return gulp.src('./src/**/*.js')
  		.pipe($.jshint({latedef : false}))
  		.pipe($.jshint.reporter('jshint-stylish'));
});


/**
 * Generate docs templates with plugin source file
 */
gulp.task('build:docs', ['build'], function() {
  return gulp.src('.tmp/mindsmash-oauth2.js')
      .pipe($.ngdocs.process({
        html5Mode: false,
        startPage: '/api/mindsmash-oauth2',
        loadDefaults: {
          angular: false,
          angularAnimate: false,
          marked: false
        },
        scripts: [
          'bower_components/angular/angular.min.js'
        ]
      }))
      .pipe(gulp.dest('./docs'));
});


/**
 * Perform tests.
 */
gulp.task('test:spec', ['build'], function(done) {
  new karma({
        configFile: __dirname + '/karma.conf.js'
      }, function() {
        done();
      }
  ).start();
});


gulp.task('clean', ['clean:tmp', 'clean:dist', 'clean:docs']);

gulp.task('build', ['clean', 'lint:src', 'concat:src', 'copy:src', 'uglify:src']);

gulp.task('test', ['build', 'test:spec']);

gulp.task('docs', ['build:docs']);

gulp.task('default', ['build', 'test']);
