const gulp = require('gulp');

// gulp- 系のプラグインを plugins.xxxx で利用する(ハイフン付モジュール名はキャメルケース)
const $ = require('gulp-load-plugins')();
const through = require('through2');

// gulp- 系以外のモジュール
$.fs = require('fs');
$.browserSync = require('browser-sync');
$.runSequence = require('run-sequence');
$.del = require('del');
$.frontMatter = require('front-matter');
$.imageminJpg = require('imagemin-jpeg-recompress');
$.imageminPng = require('imagemin-pngquant');

const njkFunc = require('./func.js');

// 本番環境と開発環境でタスクを変更させる設定
const mode = require('gulp-mode')({
  modes: ['production', 'development'],
  default: 'production',
  verbose: true
});

// configを読み込む
const yaml = require('js-yaml');
const config = yaml.safeLoad($.fs.readFileSync('./gulpconfig.yml', 'utf8'));

//gulp v4 pipe で callback 返すための関数
const runPipeCallBack = cb => {
  cb();
  return through.obj((file, enc, throughCb) => {
    return throughCb(null, file);
  });
};

//#--------------------------
//# libs task
//#--------------------------

// ライブラリCSSを結合
gulp.task('libs:css', cb => {
  gulp.src([
    config.path.src.libs.css + '**/*.css'
  ])
    .pipe($.plumber({
      errorHandler: $.notify.onError('Error: <%= error.message %>')
    }))
    .pipe($.concat('libs.css'))
    .pipe($.cleanCss())
    .pipe($.lineEndingCorrector({
      verbose: true,
      eolc: config.lineFeed.css,
      encoding: config.encoding.css
    }))
    .pipe(gulp.dest(config.path.dest.css + 'libs/'))
    .pipe(runPipeCallBack(cb));
});

// ライブラリJSを結合
gulp.task('libs:js', cb => {
  gulp.src([
    config.path.src.libs.js + '**/*.js'
  ])
    .pipe($.plumber({
      errorHandler: $.notify.onError('Error: <%= error.message %>')
    }))
    .pipe($.concat('libs.js'))
    .pipe($.uglify({
      output: {
        comments: /^!/
      }
    }))
    .pipe($.lineEndingCorrector({
      verbose: true,
      eolc: config.lineFeed.js,
      encoding: config.encoding.js
    }))
    .pipe(gulp.dest(config.path.dest.js + 'libs/'))
    .pipe(runPipeCallBack(cb));

  // jqueryをdestへcopy
  // ただのコピーなので series していない
  gulp.src([
    'node_modules/jquery/dist/jquery.min.js'
  ])
    .pipe(gulp.dest(config.path.dest.js + 'libs/'));
});

gulp.task('libs', gulp.parallel(['libs:js', 'libs:css']));

//#--------------------------
//# html compile task
//#--------------------------
const getDataJson = function (file) {
  return JSON.parse($.fs.readFileSync(file, 'utf8'));
};

gulp.task('html', cb => {
  const getDataProject = getDataJson('./project.json');
  gulp.src([
    config.path.src.html + 'pages/**/*.njk'
  ])
    .pipe($.plumber({
      errorHandler: $.notify.onError('Error: <%= error.message %>')
    }))
    .pipe($.data(function (file) {
      return {'filename': file.path};
    }))
    .pipe($.data(function (file) {
      const content = $.frontMatter(String(file.contents));
      file.contents = new Buffer(content.body);
      // return { 'filename': file.path }, content.attributes;
      // return content.attributes, { 'filename': file.path };
      return content.attributes;
    }))
    .pipe($.nunjucksRender({
      path: [config.path.src.html],
      data: {
        dataProject: getDataProject
      },
      envOptions: {
        autoescape: false
      },
      manageEnv: function (env) {
        env.addFilter('relative', function (str) {
          return njkFunc.func.setRelativePath(str);
        });
      }
    }))
    .pipe($.lineEndingCorrector({
      verbose: true,
      eolc: config.lineFeed.html,
      encoding: config.encoding.html
    }))
    .pipe(gulp.dest(config.path.dest.html))
    .pipe($.htmlhint('htmlhintrc.json'))
    .pipe($.htmlhint.failReporter())
    .pipe(runPipeCallBack(cb));
});


//#--------------------------
//# sass compile task
//#--------------------------
gulp.task('css', cb => {
  gulp.src([config.path.src.sass + '/**/*.scss'])
    .pipe(mode.development($.sourcemaps.init()))
    .pipe($.plumber({
      errorHandler: $.notify.onError('Error: <%= error.message %>')
    }))
    .pipe($.sass({
      style: 'expanded',
      includePaths: config.path.src.sass
    }))
    // ベンダープレフィックスを追加
    .pipe($.autoprefixer())
    // ソースマップ出力
    .pipe(mode.development($.sourcemaps.write('./')))
    // CSSプロパティの順序を並び替え
    .pipe($.csscomb('./csscomb.json'))
    // media query整理
    .pipe($.groupCssMediaQueries())
    // CSS整形
    .pipe($.cssbeautify({
      indent: config.style.indent,
      openbrace: 'end-of-line',
      autosemicolon: true
    }))
    // 改行が2つ連続してる場合は、1つにする
    .pipe(mode.production($.replace(/(;\n)\n/g, '$1')))
    // 連続するコメント行は1行あける
    .pipe(mode.production($.replace(/(\*\/\n)(\/\*)/g, '$1\n$2')))
    // 改行コード設定
    .pipe($.lineEndingCorrector({
      verbose: true,
      eolc: config.lineFeed.css,
      encoding: config.encoding.css
    }))
    .pipe(gulp.dest(config.path.dest.css))
    .pipe(runPipeCallBack(cb));
});

//#--------------------------
//# javascript task
//#--------------------------
gulp.task('js', cb => {
  gulp.src([
    config.path.src.js + 'modules/*.js',
    config.path.src.js + 'app.js'
  ])
    .pipe($.plumber({
      errorHandler: $.notify.onError('Error: <%= error.message %>')
    }))
    .pipe($.concat('app.bundle.js'))
    .pipe($.lineEndingCorrector({
      verbose: true,
      eolc: config.lineFeed.js,
      encoding: config.encoding.js
    }))
    .pipe(gulp.dest(config.path.dest.js))
    .pipe(runPipeCallBack(cb));
});

//#--------------------------
//# ESLint task
//#--------------------------
gulp.task('eslint', cb => {
  gulp.src([
    config.path.src.js + '**/*.js'
  ])
    .pipe($.plumber({
      errorHandler: $.notify.onError('Error: <%= error.message %>')
    }))
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failAfterError())
    .pipe(runPipeCallBack(cb));
});

//#--------------------------
//# imagemin task
//#--------------------------
// jpg,png画像の圧縮タスク
gulp.task('imagemin', cb => {
  gulp.src(config.path.dest.img + '/**/*.+(jpg|jpeg|png)')
    .pipe($.imagemin([
      $.imageminPng(),
      $.imageminJpg()
    ]))
    .pipe(gulp.dest(config.path.dest.img))
    .pipe(runPipeCallBack(cb));
});

//#--------------------------
//# server task
//#--------------------------
//# PHPビルトインサーバ
//const php = require('gulp-connect-php');
// PHPビルトインサーバ用
//gulp.task('built-in-server', cb => {
//  return php.server({
//    base: 'htdocs',
//    port: 8000
//  }, cb());
//});

gulp.task('serve', cb => {
  $.browserSync.init({
    server: {
      baseDir: config.destRoot
    },
    startPath: config.server.startPath,
    // port: config.server.port,
    open: config.server.open
  }, cb());
});

gulp.task('srcWatch', cb => {
  gulp.watch(
    [
      'project.json',
      config.path.src.html + '**/*.njk'
    ],
    gulp.series(['html', 'reload'])
  );
  gulp.watch([config.path.src.js + '**/*.js'], gulp.series(['js', 'eslint', 'reload']));
  gulp.watch([config.path.src.sass + '**/*.scss'], gulp.series(['css', 'reload']));
  gulp.watch(
    [
      config.path.src.libs.css + '**/*.css',
      config.path.src.libs.js + '**/*.js'
    ],
    gulp.series(['libs', 'reload'])
  );
  cb();
});


gulp.task('reload', cb => {
  if ($.browserSync.active) {
    $.browserSync.reload();
  }
  cb();
});

//# 以下 Base タスク -----------------------------

//# buildタスク
const buildTasks = [
  'libs',
  'html',
  'css',
  'js'
];


gulp.task('build', gulp.parallel(buildTasks));

//# defaultタスク
gulp.task('default',
  gulp.series(
    //まず build task 実行後
    gulp.parallel(buildTasks),
    gulp.series(['serve', 'srcWatch'])
  )
);
