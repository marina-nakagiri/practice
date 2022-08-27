/* global Device */
(function (window, $) {
  'use strict';

  // Set Namespace
  var APP = window.APP = window.APP || {};

  // サンプル処理（※参考用なので実装時は削除してください）
  APP.SampleFunction = function ($elm) {
    var that = this;
    that.$elm = $elm;

    that.init();

    $(window).on('load resize', function () {
      // CSSの表示切り替えと同じタミングでJSの処理を行うことが可能
      if ($('.check-media').is(':visible')) {
        console.log('SP表示');
      } else {
        console.log('PC表示');
      }
    });
  };
  APP.SampleFunction.prototype = {
    init: function () {
      var that = this;

      // タイムライン処理
      var d = new $.Deferred();
      d.promise()
        .then(function () {
          setTimeout(function () {
            that.procA();
          }, 10);
        })
        .then(function () {
          setTimeout(function () {
            that.procB();
          }, 500);
        })
        .then(function () {
          setTimeout(function () {
            that.procC();
          }, 1000);
        });
      d.resolve();
    },
    procA: function() {
      console.log('0.01秒経過');
    },
    procB: function() {
      console.log('0.5秒経過');
    },
    procC: function() {
      console.log('1秒経過');
    }
  };

  // SPメニューボタン設定
  APP.SetSpHeaderBtn = function ($elm) {
    var that = this;
    that.$elm = $elm;
    that.$body = $('body');
    that.$wrapper = $('.l-wrapper');
    that.$header = $('.l-header-menu-inner');
    that.$target = $('.l-header-nav');
    that.$closeBtn = $('.l-header-close-btn');
    that.MENUOPEN = 'is-menu-open';
    that.topPos = 0;
    that.isOpen = false;

    that.$elm.on('click', function () {
      that.changeStatus();
    });

    that.$closeBtn.on('click', function () {
      that.close();
      that.isOpen = !that.isOpen;
    });
  };
  APP.SetSpHeaderBtn.prototype = {
    changeStatus: function () {
      var that = this;
      if (that.isOpen) {
        that.close();
      } else {
        that.open();
      }
      that.isOpen = !that.isOpen;
    },
    close: function () {
      var that = this;

      that.$body.removeClass(that.MENUOPEN);
      that.$wrapper.css({
        'top': 0
      });
      $('html, body').prop({scrollTop: that.topPos});
    },
    open: function () {
      var that = this;

      that.topPos = $(window).scrollTop();
      that.$body.addClass(that.MENUOPEN);
      that.$wrapper.css({
        'top': -(that.topPos)
      });

      that.$header.animate({
        scrollTop: 0
      }, 0);
    }
  };

  // アコーディオン
  APP.SetAc = function($elm) {
    var that = this;
    that.$elm = $elm;
    that.$trigger = $elm.find('.mod-ac-trigger');
    that.$target = $elm.find('.mod-ac-target');
    that.ACTIVE = 'is-active';

    that.$trigger.on('click', function() {
      if ($elm.hasClass(that.ACTIVE)) {
        $elm.removeClass(that.ACTIVE);
        that.$target.slideUp(500, 'swing');
      } else {
        $elm.addClass(that.ACTIVE);
        that.$target.slideDown(500, 'swing');
      }
    });
  };

  // スクロールイベント（ページトップ）
  APP.SetPageTop = function($elm) {
    var that = this;
    that.$elm = $elm;
    that.$body = $('body');
    that.$footer = $('.l-footer');
    that.scr = $(window).scrollTop();
    that.winH = $(window).height();
    that.maxH = 0;

    $(window).on('load resize scroll', function() {
      that.update();
    });
  };
  APP.SetPageTop.prototype = {
    update: function() {
      var that = this;

      that.scr = $(window).scrollTop();
      that.winH = $(window).height();
      that.maxH = that.$footer.offset().top - that.winH;
      if (that.scr >= that.maxH) {
        that.$body.addClass('is-pagetop-fixed');
        that.$elm.css({'bottom': that.$footer.outerHeight() + 20 +'px'});
      } else if (that.scr > that.winH/2 && that.scr < that.maxH) {
        that.$body.addClass('is-pagetop-active').removeClass('is-pagetop-fixed');
        that.$elm.removeAttr('style');
      } else {
        that.$body.removeClass('is-pagetop-active is-pagetop-fixed');
        that.$elm.removeAttr('style');
      }
    }
  };

  $(function () {
    var html = window.document.getElementsByTagName('html');
    // デバイス情報にもとづくクラス名をbodyに追加
    var device = new Device(navigator.userAgent);
    html[0].className = device.getAllClasses(html[0].className);

    if ($('html').hasClass('is-tablet')) {
      device.setTabletViewport();
    }

    // mediaチェック用タグ追加
    $('body').append('<div class="check-media"></div>');

    // 画像背景置換
    $('.mod-img2bg').each(function() {
      var src = $(this).attr('src');
      $(this).parent().css({
        background: 'url('+src+') no-repeat 50% 50%',
        'background-size': 'cover'
      });
      $(this).css({
        visibility: 'hidden',
        width: '100%',
        height: '100%'
      });
    });

    // サンプル処理（※参考用なので実装時は削除してください）
    $('.mod-sample').each(function () {
      new APP.SampleFunction($(this));
    });

    // SP メニューボタン設定
    $('.mod-sp-menu').each(function () {
      APP.spmenu = new APP.SetSpHeaderBtn($(this));
    });

    // アコーディオン
    $('.mod-ac').each(function() {
      new APP.SetAc($(this));
    });

    // ページ内リンク
    $('a[href^="#"]').on('click', function () {
      if (!$(this).hasClass('no-scroll')) {
        var href = $(this).attr('href');
        var $target = $(href === '#' || href === '' ? 'html' : href);
        $target.velocity('scroll', {
          duration: 500,
          easing: 'easeInOutQuad'
        });
        return false;
      }
    });

    // インスタ表示参考スクリプト（環境ごとに表示分け）
    // アクセストークンはインスタDevelopperサイトで取得。
    // 一部効率が良くないのでリファクタリングをお願いします。
    $('#instafeed').each(function() {
      var token = '';
      var numPhotos = 6; // 表示件数
      var container = document.getElementById('instafeed');
      var scrElement = document.createElement('script');
      var HONBAN = 'honban.c-brains.jp';
      var TEST = 'test.c-brains.jp';
      var LOCAL = 'localhost:3000';

      if (document.URL.match(HONBAN)) {
        token = 'honban.token';
      } else if (document.URL.match(TEST)) {
        token = 'test.token';
      } else if (document.URL.match(LOCAL)) {
        token = 'local.token';
      }

      window.processResult = function( data ) {
        for ( var x in data.data ) {
          container.innerHTML += '<li><a href="'+ data.data[x].link +'" target="_blank"><img src="' + data.data[x].images.low_resolution.url + '"></a></li>';
        }
      };

      scrElement.setAttribute( 'src', 'https://api.instagram.com/v1/users/self/media/recent?access_token=' + token + '&count=' + numPhotos + '&callback=processResult' );
      document.body.appendChild( scrElement );
    });


    // 固定ヘッダー横スクロール発生時に追従
    // .l-headerにmin-widthを設定。
    // HTMLの構成によっては邪魔する場合あり。
    // 使用しない場合は、この処理と.l-headerのmin-widthを削除
    $(window).on('scroll', function(){
      $('.l-header').css('left', -$(window).scrollLeft());
    });

    // スクロールイベント（ページトップ）
    $('.c-pagetop').each(function() {
      new APP.SetPageTop($(this));
    });

    //header toggle
    $('.p-hamburger-menu label').on('click', function () {
      $('.p-header-nav').toggleClass('is-active');
    });
  });
})(window, jQuery);
