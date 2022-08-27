(function (global) {
  'use strict';

  /**
   * デバイス判別
   * @constructor
   */
  function Device(userAgent) {
    this.userAgent = userAgent;
  }

  Device.prototype.getPlatformClass = function () {
    var ua = this.userAgent;
    switch (true) {
    case /Windows/.test(ua):
      return 'win';
    case /Android/.test(ua):
      return 'android';
    case /iPhone|iPad/.test(ua):
      return 'ios';
    case /Mac OS X/.test(ua):
      return 'mac';
    }
    return '';
  };

  Device.prototype.getPlatformAndroidOldClass = function () {
    var ua = this.userAgent;
    if (ua.indexOf('Android') > 0) {
      var version = parseFloat(ua.slice(ua.indexOf('Android') + 8));

      if (version < 4.4) {
        return 'android-old';
      } else {
        return '';
      }

    } else {
      return '';
    }
  };

  Device.prototype.getBrowserClass = function () {
    var ua = this.userAgent;
    switch (true) {
    case /Edge/.test(ua):
      return 'edge';
    case /Chrome/.test(ua):
      return 'chrome';
    case /Firefox/.test(ua):
      return 'firefox';
    case /MSIE|Trident/.test(ua):
      return 'ie';
    case /Silk\//.test(ua):
      return 'aosp';
    case /CriOS/.test(ua):
      return 'chrome';
    case /Safari\//.test(ua):
      return 'safari';
    }
    return '';
  };

  Device.prototype.getIeVersionClass = function () {
    var ua = this.userAgent;
    switch (true) {
    case /Trident\/.*rv:11/.test(ua):
      return 'ie11';
    case /MSIE 10\./.test(ua):
      return 'ie10';
    case /MSIE 9\./.test(ua):
      return 'ie9';
    case /MSIE 8\./.test(ua):
      return 'ie8';
    }
    return '';
  };

  /**
   * デバイス種別により異なるクラスを取得
   * @return {String} is-tablet is-mobile is-pc のいずれか
   */
  Device.prototype.getKindOfDeviceClass = function () {
    switch (true) {
    case this.isTablet():
      return 'is-tablet';
    case this.isMobile():
      return 'is-mobile';
    }
    return 'is-pc';
  };

  Device.prototype.isTablet = function () {
    return this.isWindowsTablet()
      || this.isIpad()
      || this.isAndroidTablet()
      || this.isKindle();
  };

  Device.prototype.isMobile = function () {
    return this.isWindowsPhone()
      || this.isIphone()
      || this.isAndroidMobile()
      || this.isFirefoxMobile()
      || this.isBlackBerry();
  };

  Device.prototype.isWindowsTablet = function () {
    return /Windows/.test(this.userAgent) && /Touch/.test(this.userAgent);
  };

  Device.prototype.isIpad = function () {
    return /iPad/.test(this.userAgent);
  };

  Device.prototype.isAndroidTablet = function () {
    return /Android/.test(this.userAgent) && (!/Mobile/.test(this.userAgent));
  };

  Device.prototype.isKindle = function () {
    return /Android/.test(this.userAgent) && /Silk/.test(this.userAgent);
  };

  Device.prototype.isWindowsPhone = function () {
    return /Windows Phone/.test(this.userAgent);
  };

  Device.prototype.isIphone = function () {
    return /iPhone/.test(this.userAgent);
  };

  Device.prototype.isAndroidMobile = function () {
    return /Android/.test(this.userAgent) && /Mobile/.test(this.userAgent);
  };

  Device.prototype.isFirefoxMobile = function () {
    return /Firefox/.test(this.userAgent) && /Android/.test(this.userAgent);
  };

  Device.prototype.isBlackBerry = function () {
    return /BlackBerry/.test(this.userAgent);
  };

  Device.prototype.getAllClasses = function (defaultClass) {
    var classes = [],
      os = this.getPlatformClass(),
      browser = this.getBrowserClass(),
      androidOld = this.getPlatformAndroidOldClass(),
      ieVersion = this.getIeVersionClass(),
      device = this.getKindOfDeviceClass();

    if (typeof defaultClass !== 'undefined') {
      classes.push(defaultClass);
    }
    if (os !== '') {
      classes.push(os);
    }
    if (androidOld !== '') {
      classes.push(androidOld);
    }
    if (browser !== '') {
      classes.push(browser);
    }
    if (ieVersion !== '') {
      classes.push(ieVersion);
    }
    if (device !== '') {
      classes.push(device);
    }
    return classes.join(' ');
  };

  /**
   * タブレット時のviewportを指定
   */
  Device.prototype.setTabletViewport = function () {
    // 指定するviewportの幅
    let tabletViewPort = document.createElement('meta');
    tabletViewPort.setAttribute('name', 'viewport');
    tabletViewPort.setAttribute('content', 'width=1300');
    document.head.appendChild(tabletViewPort);
  };

  // Exports (外部から使えるようにするイディオム)
  if ('process' in global) {
    module['exports'] = Device;
  }
  global['Device'] = Device;

})((window || 0).self || global);
