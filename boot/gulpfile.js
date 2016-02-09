var gulp = require('gulp');
var jshint = require('gulp-jshint');
var changed = require('gulp-changed');
// var imagemin = require('gulp-imagemin');

// include plug-ins
var minifyHTML = require('gulp-minify-html');

// include plug-ins
var concat = require('gulp-concat');
var stripDebug = require('gulp-strip-debug');
var uglify = require('gulp-uglify');

// include plug-ins
var autoprefix = require('gulp-autoprefixer');
var minifyCSS = require('gulp-minify-css');

// JS hint task
gulp.task('jshint', function() {
  gulp.src('public/js/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// CSS concat, auto-prefix and minify
gulp.task('styles', function() {
  gulp.src(['public/css/*.css'])
    .pipe(concat('style.css'))
    .pipe(autoprefix('last 2 versions'))
    .pipe(minifyCSS())
    .pipe(gulp.dest('public/tes'));
});

// JS concat, strip debugging and minify
gulp.task('scripts', function() {
  gulp.src(['public/js/*.js'])
    .pipe(concat('sc.js'))
    .pipe(stripDebug())
    .pipe(uglify())
    .pipe(gulp.dest('public/tes'));
});

gulp.task('minify', function () {
   gulp.src('public/theme/validate/*.js').pipe(gulp.dest('public/theme/validate'));
});

gulp.task('minify2', function () {
   gulp.src('public/js/*.js').pipe(gulp.dest('public/js'));
});

gulp.task('default', ['minify','minify2']);
