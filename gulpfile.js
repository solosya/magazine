// PLEASE NOTE THIS FILE NOW REQUIRES GULP V4
// https://www.liquidlight.co.uk/blog/how-do-i-update-to-gulp-4/

// to stop npm EACCESS errors install npm this way:
// https://github.com/nvm-sh/nvm

var gulp = require("gulp");
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var gp_rename = require("gulp-rename");
var gutil = require("gulp-util");
var sass = require("gulp-sass")(require("sass"));
var sourcemaps = require("gulp-sourcemaps");
var minifyCss = require("gulp-clean-css");
var hasher = require("gulp-hasher");
var buster = require("gulp-cache-buster");

gulp.task("cache", function () {
  return gulp
    .src("layouts/main.twig")
    .pipe(
      buster({
        tokenRegExp: /\/(concat\.min\.css)\?v=[0-9a-z]+/,
        assetRoot: __dirname + "/static/deploy/",
        hashes: hasher.hashes,
      })
    )
    .pipe(gulp.dest("layouts/"));
});

gulp.task("minify-css", function () {
  return gulp
    .src(["./static/deploy/concat.css"])
    .pipe(gp_rename({ suffix: ".min" }))
    .pipe(minifyCss())
    .pipe(gulp.dest("./static/deploy"))
    .pipe(hasher());
});

gulp.task("cache-amp", function () {
  return gulp
    .src("amp/layouts/main.twig")
    .pipe(
      buster({
        tokenRegExp: /\/(amp\.min\.css)\?v=[0-9a-z]+/,
        assetRoot: __dirname + "/static/deploy/",
        hashes: hasher.hashes,
      })
    )
    .pipe(gulp.dest("amp/layouts/"));
});

gulp.task("minify-amp", function () {
  return gulp
    .src(["./static/css/amp.css"])
    .pipe(gp_rename({ suffix: ".min" }))
    .pipe(minifyCss())
    .pipe(gulp.dest("./static/deploy"))
    .pipe(hasher());
});

gulp.task("concat", function () {
  return gulp
    .src([
      "./static/css/main.css",
      "./static/sass/vendors/owl.carousel.min.css",
      "./static/sass/vendors/owl.theme.default.css",
    ]) // path to your file
    .pipe(concat("concat.css"))

    .pipe(gulp.dest("./static/deploy"));
});

gulp.task("sass", function () {
  return gulp
    .src(["./static/sass/main.scss"])
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        includePaths: [
          "./static/sass/components",
          "./static/sass/cards",
          "./static/sass/vendors",
        ],
      }).on("error", sass.logError)
    )
    .pipe(sourcemaps.write())
    .pipe(gulp.dest("./static/css"));
});

gulp.task("amp_sass", function () {
  return (
    gulp
      .src(["./static/ampsass/amp.scss"])
      .pipe(sourcemaps.init())
      .pipe(sass().on("error", sass.logError))
      // .pipe(sourcemaps.write())
      .pipe(gulp.dest("./static/css"))
  );
});


gulp.task('scripts-concat', function(){
  return gulp.src([
      './static/js/vendor/jquery3.6.js',
      './static/js/vendor/waypoint/lib/jquery.waypoints.min.js',
      './static/js/vendor/jquery.lazyload.min.js',
      './static/js/vendor/jquery.dotdotdot.min.js',
      './static/js/vendor/owl.carousel.min.js',
      './static/js/scripts.js',
      // './assets/scripts/sdk/yii/yii.js',
      ])
      .pipe(concat('concat.js'))
      .pipe(gulp.dest('./static/js'))
      .pipe(gp_rename('vendor.js'))
      .pipe(gulp.dest('./static/js'))
      .pipe(hasher());        

});
gulp.task("watch", function () {
  gulp.watch("./static/sass/**/*.scss", gulp.series(["styles"]));
  gulp.watch("./static/development/js/**/*.js", gulp.series(["scripts"]));
});

gulp.task(
  "styles",
  gulp.series("sass", "concat", "minify-css", "cache", function (done) {
    done();
  })
);

gulp.task(
  "amp",
  gulp.series("amp_sass", "minify-amp", "cache", function (done) {
    done();
  })
);

gulp.task(
  "scripts",
  gulp.series("scripts-concat",  function (done) {
    done();
  })
);

gulp.task("default", gulp.parallel("scripts", "styles"));
