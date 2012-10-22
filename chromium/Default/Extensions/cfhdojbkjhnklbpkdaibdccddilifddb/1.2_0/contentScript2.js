/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the "License"). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

function reportError(e)
{
  if (e == "Cache writing not supported")
    return;

  console.error(e);
  console.trace();
}

function ElemHidePatch()
{
  /**
   * Returns a list of selectors to be applied on a particular domain. With
   * specificOnly parameter set to true only the rules listing specific domains
   * will be considered.
   */
  ElemHide.getSelectorsForDomain = function(/**String*/ domain, /**Boolean*/ specificOnly)
  {
    var result = [];
    for (var key in filterByKey)
    {
      var filter = Filter.knownFilters[filterByKey[key]];
      if (specificOnly && (!filter.domains || filter.domains[""]))
        continue;

      if (filter.isActiveOnDomain(domain))
        result.push(filter.selector);
    }
    return result;
  };

  ElemHide.init = function() {};
}

function MatcherPatch()
{
  // Very ugly - we need to rewrite _checkEntryMatch() function to make sure
  // it calls Filter.fromText() instead of assuming that the filter exists.
  var origFunction = Matcher.prototype._checkEntryMatch.toString();
  var newFunction = origFunction.replace(/\bFilter\.knownFilters\[(.*?)\];/g, "Filter.fromText($1);");
  eval("Matcher.prototype._checkEntryMatch = " + newFunction);
}


// Replace FilterStorage.loadFromDisk, it assumes synchronous file reads - we
// need to read data first and run the original function then.
var files = {};
function FilterStoragePatch()
{
  var origLoadFromDisk = FilterStorage.loadFromDisk;
  FilterStorage.loadFromDisk = function(silent)
  {
    function callback(e)
    {
      if (e)
        reportError("File system error " + e.code);
      if (!(Prefs.patternsfile in files) || !files[Prefs.patternsfile].data)
      {
        // Data got lost, make sure to add default file subscription
        delete localStorage["currentVersion"];
      }
      origLoadFromDisk(silent);
    }

    // We request a gigabyte of space, just in case
    (window.requestFileSystem || window.webkitRequestFileSystem)(window.PERSISTENT, 1024*1024*1024, function(fs)
    {
      var part1 = Prefs.patternsfile;
      var part2 = "";
      if (/^(.*)(\.\w+)$/.test(part1)) {
        part1 = RegExp["$1"];
        part2 = RegExp["$2"];
      }

      var fileList = [];
      for (var i = 0; i <= Prefs.patternsbackups; i++)
        fileList.push(part1 + (i > 0 ? "-backup" + i : "") + part2);

      var currentIndex = 0;
      readNextFile();

      function readNextFile()
      {
        if (currentIndex >= fileList.length)
        {
          // We are done checking all files, now we can call the original function
          callback(null);
          return;
        }

        var filePath = fileList[currentIndex++];
        fs.root.getFile(filePath, {}, function(fileEntry)
        {
          files[filePath] = {exists: fileEntry.isFile, data: "", lastModified: 0};
          if (files[filePath].exists)
          {
            fileEntry.getMetadata(function(metadata)
            {
              files[filePath].lastModified = metadata.modificationTime.getTime();

              if (filePath == fileList[0])
              {
                // We don't read the backup files but we have to read the main file
                fileEntry.file(function(file)
                {
                  var reader = new FileReader();
                  reader.onloadend = function()
                  {
                    if (reader.error)
                      callback(reader.error);
                    else
                    {
                      files[filePath].data = reader.result;
                      readNextFile();
                    }
                  };
                  reader.readAsText(file);
                }, callback);
              }
              else
                readNextFile();
            }, callback);
          }
          else
            readNextFile();
        }, callback);
      }
    }, callback);
  };
}

var Components =
{
  interfaces:
  {
    nsIFile: {DIRECTORY_TYPE: 0},
    nsIFileURL: function() {},
    nsIFileInputStream: null,
    nsIFileOutputStream: null,
    nsIHttpChannel: function() {},
    nsIConverterInputStream: {DEFAULT_REPLACEMENT_CHARACTER: null},
    nsIConverterOutputStream: null,
    nsIUnicharLineInputStream: null,
    nsISafeOutputStream: null,
    nsITimer: {TYPE_REPEATING_SLACK: 0},
    nsIInterfaceRequestor: null,
    nsIChannelEventSink: null
  },
  classes:
  {
    "@mozilla.org/network/file-input-stream;1":
    {
      createInstance: function()
      {
        return new FakeInputStream();
      }
    },
    "@mozilla.org/network/file-output-stream;1":
    {
      createInstance: function()
      {
        return new FakeOutputStream();
      }
    },
    "@mozilla.org/timer;1":
    {
      createInstance: function()
      {
        return new FakeTimer();
      }
    }
  },
  results: {},
  utils: {
    reportError: reportError
  },
  manager: null,
  ID: function()
  {
    return null;
  },
  Constructor: function()
  {
    // This method is only used to get XMLHttpRequest constructor
    return XMLHttpRequest;
  }
};
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;

Cc["@mozilla.org/intl/converter-input-stream;1"] = Cc["@mozilla.org/network/file-input-stream;1"];
Cc["@mozilla.org/network/safe-file-output-stream;1"] = Cc["@mozilla.org/intl/converter-output-stream;1"] = Cc["@mozilla.org/network/file-output-stream;1"];

var Prefs =
{
  patternsfile: "patterns.ini",
  patternsbackups: 5,
  patternsbackupinterval: 24,
  data_directory: "",
  savestats: false,
  privateBrowsing: false,
  subscriptions_fallbackerrors: 5,
  subscriptions_fallbackurl: "https://adblockplus.org/getSubscription?version=%VERSION%&url=%SUBSCRIPTION%&downloadURL=%URL%&error=%ERROR%&channelStatus=%CHANNELSTATUS%&responseStatus=%RESPONSESTATUS%",
  addListener: function() {}
};

var Utils =
{
  systemPrincipal: null,
  getString: function(id)
  {
    return id;
  },
  getLineBreak: function()
  {
    return "\n";
  },
  resolveFilePath: function(path)
  {
    return new FakeFile(path);
  },
  ioService:
  {
    newURI: function(uri)
    {
      if (!uri.length || uri[0] == "~")
        throw new Error("Invalid URI");

      /^([^:\/]*)/.test(uri);
      var scheme = RegExp.$1.toLowerCase();

      return {scheme: scheme, spec: uri};
    }
  },
  observerService:
  {
    addObserver: function() {},
    removeObserver: function() {}
  },
  chromeRegistry:
  {
    convertChromeURL: function() {}
  },
  runAsync: function(callback, thisPtr)
  {
    var params = Array.prototype.slice.call(arguments, 2);
    window.setTimeout(function()
    {
      callback.apply(thisPtr, params);
    }, 0);
  },
  addonVersion: "2.0.3", // Hardcoded for now
  get appLocale()
  {
    var locale = chrome.i18n.getMessage("@@ui_locale").replace(/_/g, "-");
    Utils.__defineGetter__("appLocale", function() {return locale});
    return Utils.appLocale;
  },
  generateChecksum: function(lines)
  {
    // We cannot calculate MD5 checksums yet :-(
    return null;
  },
  makeURI: function(url)
  {
    return Utils.ioService.newURI(url);
  },
  checkLocalePrefixMatch: function(prefixes)
  {
    if (!prefixes)
      return null;

    var list = prefixes.split(",");
    for (var i = 0; i < list.length; i++)
      if (new RegExp("^" + list[i] + "\\b").test(Utils.appLocale))
        return list[i];

    return null;
  },
  versionComparator:
  {
    compare: function(v1, v2)
    {
      var parts1 = v1.split(".");
      var parts2 = v2.split(".");
      for (var i = 0; i < Math.max(parts1.length, parts2.length); i++)
      {
        // TODO: Handle non-integer version parts properly
        var part1 = parseInt(i < parts1.length ? parts1[i] : "0");
        var part2 = parseInt(i < parts2.length ? parts2[i] : "0");
        if (part1 != part2)
          return part1 - part2;
      }
      return 0;
    }
  }
};

var XPCOMUtils =
{
  generateQI: function() {}
};

var fileActions = null;
function pushFileAction(action)
{
  var fs = null;
  if (fileActions == null)
  {
    fileActions = [];
    // We request a gigabyte of space, just in case
    (window.requestFileSystem || window.webkitRequestFileSystem)(window.PERSISTENT, 1024*1024*1024, function(aFs)
    {
      fs = aFs;
      processNextAction();
    }, function(e)
    {
      reportError("File system error " + e.code);
      fileActions = null;
    });
  }
  fileActions.push(action);

  function processNextAction()
  {
    if (fileActions.length == 0)
    {
      fileActions = null;
      return;
    }

    var action = fileActions.shift();
    var path = action[1];
    fs.root.getFile(path, {create: true}, function(fileEntry)
    {
      switch (action[0])
      {
        case "write":
          var blob = action[2];
          fileEntry.createWriter(function(writer)
          {
            writer.onwriteend = function()
            {
              if (writer.error)
                reportError("File system error " + writer.error.code);
              processNextAction();
            };
            writer.write(blob);
          }, errorCallback);
          break;
        case "remove":
          fileEntry.remove(function()
          {
            if (path in files)
              delete files[path];
            processNextAction();
          }, errorCallback);
          break;
        case "rename":
          var newPath = action[2];
          fileEntry.moveTo(fs.root, newPath, function()
          {
            if (path in files)
            {
              files[newPath] = files[path];
              delete files[path];
            }
            processNextAction();
          }, errorCallback);
          break;
        default:
          errorCallback({code: "unknown action"});
          break;
      }
    }, errorCallback)
  }

  function errorCallback(e)
  {
    reportError("File system error: " + e.code);
    processNextAction();
  }
}

function FakeFile(path)
{
  this.path = path;
}
FakeFile.prototype =
{
  get leafName()
  {
    return this.path;
  },
  set leafName(value)
  {
    this.path = value;
  },
  append: function(path)
  {
    this.path += path;
  },
  clone: function()
  {
    return new FakeFile(this.path);
  },
  exists: function()
  {
    return this.path in files && files[this.path].exists;
  },
  remove: function()
  {
    pushFileAction(["remove", this.path]);
  },
  moveTo: function(parent, newPath)
  {
    pushFileAction(["rename", this.path, newPath]);
  },
  get lastModifiedTime()
  {
    return this.path in files ? files[this.path].lastModified : 0;
  },
  get parent()
  {
    return {create: function() {}};
  },
  normalize: function() {}
};

function FakeInputStream()
{
}
FakeInputStream.prototype =
{
  lines: null,
  currentIndex: 0,

  init: function(file)
  {
    if (file instanceof FakeInputStream)
      this.lines = file.lines;
    else
      this.lines = (file.path in files && files[file.path].data ? files[file.path].data.split(/\n/) : []);
  },
  readLine: function(line)
  {
    if (this.currentIndex < this.lines.length)
      line.value = this.lines[this.currentIndex];
    this.currentIndex++;
    return (this.currentIndex < this.lines.length);
  },
  close: function() {},
  QueryInterface: function()
  {
    return this;
  }
};

function FakeOutputStream()
{
}
FakeOutputStream.prototype =
{
  file: null,
  buffer: null,

  init: function(file)
  {
    if (file instanceof FakeOutputStream)
    {
      this.file = file.file;
      this.buffer = file.buffer;
    }
    else
    {
      this.file = file;
      this.buffer = new (window.BlobBuilder || window.WebKitBlobBuilder);
    }

    if (this.file.path == "cache.js")
      throw "Cache writing not supported";
  },
  writeString: function(string)
  {
    this.buffer.append(string);
  },
  finish: function()
  {
    pushFileAction(["write", this.file.path, this.buffer.getBlob("text/plain")]);
  },
  flush: function() {},
  QueryInterface: function()
  {
    return this;
  }
};

function FakeTimer()
{
}
FakeTimer.prototype =
{
  delay: 0,
  callback: null,
  initWithCallback: function(callback, delay)
  {
    this.callback = callback;
    this.delay = delay;
    this.scheduleTimeout();
  },
  scheduleTimeout: function()
  {
    var me = this;
    window.setTimeout(function()
    {
      try
      {
        me.callback();
      }
      catch(e)
      {
        reportError(e);
      }
      me.scheduleTimeout();
    }, this.delay);
  }
};

XMLHttpRequest.prototype.channel =
{
  status: -1,
  notificationCallbacks: {},
  loadFlags: 0,
  INHIBIT_CACHING: 0,
  VALIDATE_ALWAYS: 0,
  QueryInterface: function()
  {
    return this;
  }
};
/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the "License"). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

//
// This file has been generated automatically from Adblock Plus source code
//

(function (_patchFunc2) {
  function Filter(text) {
    this.text = text;
    this.subscriptions = [];
  }
  Filter.prototype = {
    text: null,
    subscriptions: null,
    serialize: function (buffer) {
      buffer.push("[Filter]");
      buffer.push("text=" + this.text);
    }
    ,
    toString: function () {
      return this.text;
    }
    
  };
  Filter.knownFilters = {
    __proto__: null
  };
  Filter.elemhideRegExp = /^([^\/\*\|\@"!]*?)#(?:([\w\-]+|\*)((?:\([\w\-]+(?:[$^*]?=[^\(\)"]*)?\))*)|#([^{}]+))$/;
  Filter.regexpRegExp = /^(@@)?\/.*\/(?:\$~?[\w\-]+(?:=[^,\s]+)?(?:,~?[\w\-]+(?:=[^,\s]+)?)*)?$/;
  Filter.optionsRegExp = /\$(~?[\w\-]+(?:=[^,\s]+)?(?:,~?[\w\-]+(?:=[^,\s]+)?)*)$/;
  Filter.fromText = (function (text) {
    if (text in Filter.knownFilters)
      return Filter.knownFilters[text];
    if (!/\S/.test(text))
      return null;
    var ret;
    if (Filter.elemhideRegExp.test(text))
      ret = ElemHideFilter.fromText(text, RegExp["$1"], RegExp["$2"], RegExp["$3"], RegExp["$4"]);
     else
      if (text[0] == "!")
        ret = new CommentFilter(text);
       else
        ret = RegExpFilter.fromText(text);
    Filter.knownFilters[ret.text] = ret;
    return ret;
  }
  );
  Filter.fromObject = (function (obj) {
    var ret = Filter.fromText(obj.text);
    if (ret instanceof ActiveFilter) {
      if ("disabled" in obj)
        ret._disabled = (obj.disabled == "true");
      if ("hitCount" in obj)
        ret._hitCount = parseInt(obj.hitCount) || 0;
      if ("lastHit" in obj)
        ret._lastHit = parseInt(obj.lastHit) || 0;
    }
    return ret;
  }
  );
  Filter.normalize = (function (text) {
    if (!text)
      return text;
    text = text.replace(/[^\S ]/g, "");
    if (/^\s*!/.test(text)) {
      return text.replace(/^\s+/, "").replace(/\s+$/, "");
    }
     else
      if (Filter.elemhideRegExp.test(text)) {
        /^(.*?)(#+)(.*)$/.test(text);
        var domain = RegExp["$1"];
        var separator = RegExp["$2"];
        var selector = RegExp["$3"];
        return domain.replace(/\s/g, "") + separator + selector.replace(/^\s+/, "").replace(/\s+$/, "");
      }
       else
        return text.replace(/\s/g, "");
  }
  );
  function InvalidFilter(text, reason) {
    Filter.call(this, text);
    this.reason = reason;
  }
  InvalidFilter.prototype = {
    __proto__: Filter.prototype,
    reason: null,
    serialize: function (buffer) {}
  };
  function CommentFilter(text) {
    Filter.call(this, text);
  }
  CommentFilter.prototype = {
    __proto__: Filter.prototype,
    serialize: function (buffer) {}
  };
  function ActiveFilter(text, domains) {
    Filter.call(this, text);
    if (domains) {
      this.domainSource = domains;
      this.__defineGetter__("domains", this._getDomains);
    }
  }
  ActiveFilter.prototype = {
    __proto__: Filter.prototype,
    _disabled: false,
    _hitCount: 0,
    _lastHit: 0,
    get disabled() {
      return this._disabled;
    },
    set disabled(value) {
      if (value != this._disabled) {
        var oldValue = this._disabled;
        this._disabled = value;
        FilterNotifier.triggerListeners("filter.disabled", this, value, oldValue);
      }
      return this._disabled;
    }
    ,
    get hitCount() {
      return this._hitCount;
    },
    set hitCount(value) {
      if (value != this._hitCount) {
        var oldValue = this._hitCount;
        this._hitCount = value;
        FilterNotifier.triggerListeners("filter.hitCount", this, value, oldValue);
      }
      return this._hitCount;
    }
    ,
    get lastHit() {
      return this._lastHit;
    },
    set lastHit(value) {
      if (value != this._lastHit) {
        var oldValue = this._lastHit;
        this._lastHit = value;
        FilterNotifier.triggerListeners("filter.lastHit", this, value, oldValue);
      }
      return this._lastHit;
    }
    ,
    domainSource: null,
    domainSeparator: null,
    domains: null,
    _getDomains: function () {
      this._generateDomains();
      return this.domains;
    }
    ,
    _generateDomains: function () {
      var domains = this.domainSource.split(this.domainSeparator);
      delete this.domainSource;
      delete this.domains;
      if (domains.length == 1 && domains[0][0] != "~") {
        this.domains = {
          __proto__: null,
          "": false
        };
        this.domains[domains[0]] = true;
      }
       else {
        var hasIncludes = false;
        for (var i = 0;
        i < domains.length; i++) {
          var domain = domains[i];
          if (domain == "")
            continue;
          var include;
          if (domain[0] == "~") {
            include = false;
            domain = domain.substr(1);
          }
           else {
            include = true;
            hasIncludes = true;
          }
          if (!this.domains)
            this.domains = {
              __proto__: null
            };
          this.domains[domain] = include;
        }
        this.domains[""] = !hasIncludes;
      }
    }
    ,
    isActiveOnDomain: function (docDomain) {
      if (!this.domains)
        return true;
      if (!docDomain)
        return this.domains[""];
      docDomain = docDomain.replace(/\.+$/, "").toUpperCase();
      while (true) {
        if (docDomain in this.domains)
          return this.domains[docDomain];
        var nextDot = docDomain.indexOf(".");
        if (nextDot < 0)
          break;
        docDomain = docDomain.substr(nextDot + 1);
      }
      return this.domains[""];
    }
    ,
    isActiveOnlyOnDomain: function (docDomain) {
      if (!docDomain || !this.domains || this.domains[""])
        return false;
      docDomain = docDomain.replace(/\.+$/, "").toUpperCase();
      for (var domain in this.domains)
        if (this.domains[domain] && domain != docDomain && (domain.length <= docDomain.length || domain.indexOf("." + docDomain) != domain.length - docDomain.length - 1))
          return false;
      return true;
    }
    ,
    serialize: function (buffer) {
      if (this._disabled || this._hitCount || this._lastHit) {
        Filter.prototype.serialize.call(this, buffer);
        if (this._disabled)
          buffer.push("disabled=true");
        if (this._hitCount)
          buffer.push("hitCount=" + this._hitCount);
        if (this._lastHit)
          buffer.push("lastHit=" + this._lastHit);
      }
    }
    
  };
  function RegExpFilter(text, regexpSource, contentType, matchCase, domains, thirdParty) {
    ActiveFilter.call(this, text, domains);
    if (contentType != null)
      this.contentType = contentType;
    if (matchCase)
      this.matchCase = matchCase;
    if (thirdParty != null)
      this.thirdParty = thirdParty;
    if (regexpSource.length >= 2 && regexpSource[0] == "/" && regexpSource[regexpSource.length - 1] == "/") {
      this.regexp = new RegExp(regexpSource.substr(1, regexpSource.length - 2), this.matchCase ? "" : "i");
    }
     else {
      this.regexpSource = regexpSource;
      this.__defineGetter__("regexp", this._generateRegExp);
    }
  }
  RegExpFilter.prototype = {
    __proto__: ActiveFilter.prototype,
    domainSeparator: "|",
    regexpSource: null,
    regexp: null,
    contentType: 2147483647,
    matchCase: false,
    thirdParty: null,
    _generateRegExp: function () {
      var source = this.regexpSource.replace(/\*+/g, "*");
      if (source[0] == "*")
        source = source.substr(1);
      var pos = source.length - 1;
      if (pos >= 0 && source[pos] == "*")
        source = source.substr(0, pos);
      source = source.replace(/\^\|$/, "^").replace(/\W/g, "\\$&").replace(/\\\*/g, ".*").replace(/\\\^/g, "(?:[\\x00-\\x24\\x26-\\x2C\\x2F\\x3A-\\x40\\x5B-\\x5E\\x60\\x7B-\\x80]|$)").replace(/^\\\|\\\|/, "^[\\w\\-]+:\\/+(?!\\/)(?:[^.\\/]+\\.)*?").replace(/^\\\|/, "^").replace(/\\\|$/, "$");
      var regexp = new RegExp(source, this.matchCase ? "" : "i");
      delete this.regexp;
      delete this.regexpSource;
      return (this.regexp = regexp);
    }
    ,
    matches: function (location, contentType, docDomain, thirdParty) {
      if (this.regexp.test(location) && (RegExpFilter.typeMap[contentType] & this.contentType) != 0 && (this.thirdParty == null || this.thirdParty == thirdParty) && this.isActiveOnDomain(docDomain)) {
        return true;
      }
      return false;
    }
    
  };
  RegExpFilter.fromText = (function (text) {
    var blocking = true;
    var origText = text;
    if (text.indexOf("@@") == 0) {
      blocking = false;
      text = text.substr(2);
    }
    var contentType = null;
    var matchCase = null;
    var domains = null;
    var siteKeys = null;
    var thirdParty = null;
    var collapse = null;
    var options;
    if (Filter.optionsRegExp.test(text)) {
      options = RegExp["$1"].toUpperCase().split(",");
      text = RegExp.leftContext;
      for (var _loopIndex0 = 0;
      _loopIndex0 < options.length; ++ _loopIndex0) {
        var option = options[_loopIndex0];
        var value = null;
        var separatorIndex = option.indexOf("=");
        if (separatorIndex >= 0) {
          value = option.substr(separatorIndex + 1);
          option = option.substr(0, separatorIndex);
        }
        option = option.replace(/-/, "_");
        if (option in RegExpFilter.typeMap) {
          if (contentType == null)
            contentType = 0;
          contentType |= RegExpFilter.typeMap[option];
        }
         else
          if (option[0] == "~" && option.substr(1) in RegExpFilter.typeMap) {
            if (contentType == null)
              contentType = RegExpFilter.prototype.contentType;
            contentType &= ~RegExpFilter.typeMap[option.substr(1)];
          }
           else
            if (option == "MATCH_CASE")
              matchCase = true;
             else
              if (option == "DOMAIN" && typeof value != "undefined")
                domains = value;
               else
                if (option == "THIRD_PARTY")
                  thirdParty = true;
                 else
                  if (option == "~THIRD_PARTY")
                    thirdParty = false;
                   else
                    if (option == "COLLAPSE")
                      collapse = true;
                     else
                      if (option == "~COLLAPSE")
                        collapse = false;
                       else
                        if (option == "SITEKEY" && typeof value != "undefined")
                          siteKeys = value.split(/\|/);
      }
    }
    if (!blocking && (contentType == null || (contentType & RegExpFilter.typeMap.DOCUMENT)) && (!options || options.indexOf("DOCUMENT") < 0) && !/^\|?[\w\-]+:/.test(text)) {
      if (contentType == null)
        contentType = RegExpFilter.prototype.contentType;
      contentType &= ~RegExpFilter.typeMap.DOCUMENT;
    }
    if (!blocking && siteKeys)
      contentType = RegExpFilter.typeMap.DOCUMENT;
    try {
      if (blocking)
        return new BlockingFilter(origText, text, contentType, matchCase, domains, thirdParty, collapse);
       else
        return new WhitelistFilter(origText, text, contentType, matchCase, domains, thirdParty, siteKeys);
    }
    catch (e){
      return new InvalidFilter(text, e);
    }
  }
  );
  RegExpFilter.typeMap = {
    OTHER: 1,
    SCRIPT: 2,
    IMAGE: 4,
    STYLESHEET: 8,
    OBJECT: 16,
    SUBDOCUMENT: 32,
    DOCUMENT: 64,
    XBL: 1,
    PING: 1,
    XMLHTTPREQUEST: 2048,
    OBJECT_SUBREQUEST: 4096,
    DTD: 1,
    MEDIA: 16384,
    FONT: 32768,
    BACKGROUND: 4,
    POPUP: 268435456,
    DONOTTRACK: 536870912,
    ELEMHIDE: 1073741824
  };
  RegExpFilter.prototype.contentType &= ~(RegExpFilter.typeMap.ELEMHIDE | RegExpFilter.typeMap.DONOTTRACK | RegExpFilter.typeMap.POPUP);
  function BlockingFilter(text, regexpSource, contentType, matchCase, domains, thirdParty, collapse) {
    RegExpFilter.call(this, text, regexpSource, contentType, matchCase, domains, thirdParty);
    this.collapse = collapse;
  }
  BlockingFilter.prototype = {
    __proto__: RegExpFilter.prototype,
    collapse: null
  };
  function WhitelistFilter(text, regexpSource, contentType, matchCase, domains, thirdParty, siteKeys) {
    RegExpFilter.call(this, text, regexpSource, contentType, matchCase, domains, thirdParty);
    if (siteKeys != null)
      this.siteKeys = siteKeys;
  }
  WhitelistFilter.prototype = {
    __proto__: RegExpFilter.prototype,
    siteKeys: null
  };
  function ElemHideFilter(text, domains, selector) {
    ActiveFilter.call(this, text, domains ? domains.toUpperCase() : null);
    if (domains)
      this.selectorDomain = domains.replace(/,~[^,]+/g, "").replace(/^~[^,]+,?/, "").toLowerCase();
    this.selector = selector;
  }
  ElemHideFilter.prototype = {
    __proto__: ActiveFilter.prototype,
    domainSeparator: ",",
    selectorDomain: null,
    selector: null
  };
  ElemHideFilter.fromText = (function (text, domain, tagName, attrRules, selector) {
    if (!selector) {
      if (tagName == "*")
        tagName = "";
      var id = null;
      var additional = "";
      if (attrRules) {
        attrRules = attrRules.match(/\([\w\-]+(?:[$^*]?=[^\(\)"]*)?\)/g);
        for (var _loopIndex1 = 0;
        _loopIndex1 < attrRules.length; ++ _loopIndex1) {
          var rule = attrRules[_loopIndex1];
          rule = rule.substr(1, rule.length - 2);
          var separatorPos = rule.indexOf("=");
          if (separatorPos > 0) {
            rule = rule.replace(/=/, "=\"") + "\"";
            additional += "[" + rule + "]";
          }
           else {
            if (id)
              return new InvalidFilter(text, Utils.getString("filter_elemhide_duplicate_id"));
             else
              id = rule;
          }
        }
      }
      if (id)
        selector = tagName + "." + id + additional + "," + tagName + "#" + id + additional;
       else
        if (tagName || additional)
          selector = tagName + additional;
         else
          return new InvalidFilter(text, Utils.getString("filter_elemhide_nocriteria"));
    }
    return new ElemHideFilter(text, domain, selector);
  }
  );
  if (typeof _patchFunc2 != "undefined")
    eval("(" + _patchFunc2.toString() + ")()");
  window.Filter = Filter;
  window.InvalidFilter = InvalidFilter;
  window.CommentFilter = CommentFilter;
  window.ActiveFilter = ActiveFilter;
  window.RegExpFilter = RegExpFilter;
  window.BlockingFilter = BlockingFilter;
  window.WhitelistFilter = WhitelistFilter;
  window.ElemHideFilter = ElemHideFilter;
}
)(window.FilterClassesPatch);
/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the "License"). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

//
// This file has been generated automatically from Adblock Plus source code
//

(function (_patchFunc0) {
  function Matcher() {
    this.clear();
  }
  Matcher.prototype = {
    filterByKeyword: null,
    keywordByFilter: null,
    clear: function () {
      this.filterByKeyword = {
        __proto__: null
      };
      this.keywordByFilter = {
        __proto__: null
      };
    }
    ,
    add: function (filter) {
      if (filter.text in this.keywordByFilter)
        return ;
      var keyword = this.findKeyword(filter);
      switch (typeof this.filterByKeyword[keyword]) {
        case "undefined": {
          this.filterByKeyword[keyword] = filter.text;
          break;
        }
        case "string": {
          this.filterByKeyword[keyword] = [this.filterByKeyword[keyword], filter.text];
          break;
        }
        default: {
          this.filterByKeyword[keyword].push(filter.text);
          break;
        }
      }
      this.keywordByFilter[filter.text] = keyword;
    }
    ,
    remove: function (filter) {
      if (!(filter.text in this.keywordByFilter))
        return ;
      var keyword = this.keywordByFilter[filter.text];
      var list = this.filterByKeyword[keyword];
      if (typeof list == "string")
        delete this.filterByKeyword[keyword];
       else {
        var index = list.indexOf(filter.text);
        if (index >= 0) {
          list.splice(index, 1);
          if (list.length == 1)
            this.filterByKeyword[keyword] = list[0];
        }
      }
      delete this.keywordByFilter[filter.text];
    }
    ,
    findKeyword: function (filter) {
      var defaultResult = (filter.contentType & RegExpFilter.typeMap.DONOTTRACK ? "donottrack" : "");
      var text = filter.text;
      if (Filter.regexpRegExp.test(text))
        return defaultResult;
      if (Filter.optionsRegExp.test(text))
        text = RegExp.leftContext;
      if (text.substr(0, 2) == "@@")
        text = text.substr(2);
      var candidates = text.toLowerCase().match(/[^a-z0-9%*][a-z0-9%]{3,}(?=[^a-z0-9%*])/g);
      if (!candidates)
        return defaultResult;
      var hash = this.filterByKeyword;
      var result = defaultResult;
      var resultCount = 16777215;
      var resultLength = 0;
      for (var i = 0, l = candidates.length;
      i < l; i++) {
        var candidate = candidates[i].substr(1);
        var count;
        switch (typeof hash[candidate]) {
          case "undefined": {
            count = 0;
            break;
          }
          case "string": {
            count = 1;
            break;
          }
          default: {
            count = hash[candidate].length;
            break;
          }
        }
        if (count < resultCount || (count == resultCount && candidate.length > resultLength)) {
          result = candidate;
          resultCount = count;
          resultLength = candidate.length;
        }
      }
      return result;
    }
    ,
    hasFilter: function (filter) {
      return (filter.text in this.keywordByFilter);
    }
    ,
    getKeywordForFilter: function (filter) {
      if (filter.text in this.keywordByFilter)
        return this.keywordByFilter[filter.text];
       else
        return null;
    }
    ,
    _checkEntryMatch: function (keyword, location, contentType, docDomain, thirdParty) {
      var list = this.filterByKeyword[keyword];
      if (typeof list == "string") {
        var filter = Filter.knownFilters[list];
        if (!filter) {
          delete this.filterByKeyword[keyword];
          return null;
        }
        return (filter.matches(location, contentType, docDomain, thirdParty) ? filter : null);
      }
       else {
        for (var i = 0;
        i < list.length; i++) {
          var filter = Filter.knownFilters[list[i]];
          if (!filter) {
            if (list.length == 1) {
              delete this.filterByKeyword[keyword];
              return null;
            }
             else {
              list.splice(i--, 1);
              continue;
            }
          }
          if (filter.matches(location, contentType, docDomain, thirdParty))
            return filter;
        }
        return null;
      }
    }
    ,
    matchesAny: function (location, contentType, docDomain, thirdParty) {
      var candidates = location.toLowerCase().match(/[a-z0-9%]{3,}/g);
      if (candidates === null)
        candidates = [];
      if (contentType == "DONOTTRACK")
        candidates.unshift("donottrack");
       else
        candidates.push("");
      for (var i = 0, l = candidates.length;
      i < l; i++) {
        var substr = candidates[i];
        if (substr in this.filterByKeyword) {
          var result = this._checkEntryMatch(substr, location, contentType, docDomain, thirdParty);
          if (result)
            return result;
        }
      }
      return null;
    }
    ,
    toCache: function (cache) {
      cache.filterByKeyword = this.filterByKeyword;
    }
    ,
    fromCache: function (cache) {
      this.filterByKeyword = cache.filterByKeyword;
      this.filterByKeyword.__proto__ = null;
      delete this.keywordByFilter;
      this.__defineGetter__("keywordByFilter", function () {
        var result = {
          __proto__: null
        };
        for (var k in this.filterByKeyword) {
          var list = this.filterByKeyword[k];
          if (typeof list == "string")
            result[list] = k;
           else
            for (var i = 0, l = list.length;
            i < l; i++)
              result[list[i]] = k;
        }
        return this.keywordByFilter = result;
      }
      );
      this.__defineSetter__("keywordByFilter", function (value) {
        delete this.keywordByFilter;
        return this.keywordByFilter = value;
      }
      );
    }
    
  };
  function CombinedMatcher() {
    this.blacklist = new Matcher();
    this.whitelist = new Matcher();
    this.keys = {
      __proto__: null
    };
    this.resultCache = {
      __proto__: null
    };
  }
  CombinedMatcher.maxCacheEntries = 1000;
  CombinedMatcher.prototype = {
    blacklist: null,
    whitelist: null,
    keys: null,
    resultCache: null,
    cacheEntries: 0,
    clear: function () {
      this.blacklist.clear();
      this.whitelist.clear();
      this.keys = {
        __proto__: null
      };
      this.resultCache = {
        __proto__: null
      };
      this.cacheEntries = 0;
    }
    ,
    add: function (filter) {
      if (filter instanceof WhitelistFilter) {
        if (filter.siteKeys) {
          for (var i = 0;
          i < filter.siteKeys.length; i++)
            this.keys[filter.siteKeys[i]] = filter.text;
        }
         else
          this.whitelist.add(filter);
      }
       else
        this.blacklist.add(filter);
      if (this.cacheEntries > 0) {
        this.resultCache = {
          __proto__: null
        };
        this.cacheEntries = 0;
      }
    }
    ,
    remove: function (filter) {
      if (filter instanceof WhitelistFilter) {
        if (filter.siteKeys) {
          for (var i = 0;
          i < filter.siteKeys.length; i++)
            delete this.keys[filter.siteKeys[i]];
        }
         else
          this.whitelist.remove(filter);
      }
       else
        this.blacklist.remove(filter);
      if (this.cacheEntries > 0) {
        this.resultCache = {
          __proto__: null
        };
        this.cacheEntries = 0;
      }
    }
    ,
    findKeyword: function (filter) {
      if (filter instanceof WhitelistFilter)
        return this.whitelist.findKeyword(filter);
       else
        return this.blacklist.findKeyword(filter);
    }
    ,
    hasFilter: function (filter) {
      if (filter instanceof WhitelistFilter)
        return this.whitelist.hasFilter(filter);
       else
        return this.blacklist.hasFilter(filter);
    }
    ,
    getKeywordForFilter: function (filter) {
      if (filter instanceof WhitelistFilter)
        return this.whitelist.getKeywordForFilter(filter);
       else
        return this.blacklist.getKeywordForFilter(filter);
    }
    ,
    isSlowFilter: function (filter) {
      var matcher = (filter instanceof WhitelistFilter ? this.whitelist : this.blacklist);
      if (matcher.hasFilter(filter))
        return !matcher.getKeywordForFilter(filter);
       else
        return !matcher.findKeyword(filter);
    }
    ,
    matchesAnyInternal: function (location, contentType, docDomain, thirdParty) {
      var candidates = location.toLowerCase().match(/[a-z0-9%]{3,}/g);
      if (candidates === null)
        candidates = [];
      if (contentType == "DONOTTRACK")
        candidates.unshift("donottrack");
       else
        candidates.push("");
      var blacklistHit = null;
      for (var i = 0, l = candidates.length;
      i < l; i++) {
        var substr = candidates[i];
        if (substr in this.whitelist.filterByKeyword) {
          var result = this.whitelist._checkEntryMatch(substr, location, contentType, docDomain, thirdParty);
          if (result)
            return result;
        }
        if (substr in this.blacklist.filterByKeyword && blacklistHit === null)
          blacklistHit = this.blacklist._checkEntryMatch(substr, location, contentType, docDomain, thirdParty);
      }
      return blacklistHit;
    }
    ,
    matchesAny: function (location, contentType, docDomain, thirdParty) {
      var key = location + " " + contentType + " " + docDomain + " " + thirdParty;
      if (key in this.resultCache)
        return this.resultCache[key];
      var result = this.matchesAnyInternal(location, contentType, docDomain, thirdParty);
      if (this.cacheEntries >= CombinedMatcher.maxCacheEntries) {
        this.resultCache = {
          __proto__: null
        };
        this.cacheEntries = 0;
      }
      this.resultCache[key] = result;
      this.cacheEntries++;
      return result;
    }
    ,
    matchesByKey: function (location, key, docDomain) {
      key = key.toUpperCase();
      if (key in this.keys) {
        var filter = Filter.knownFilters[this.keys[key]];
        if (filter && filter.matches(location, "DOCUMENT", docDomain, false))
          return filter;
         else
          return null;
      }
       else
        return null;
    }
    ,
    toCache: function (cache) {
      cache.matcher = {
        whitelist: {
          
        },
        blacklist: {
          
        },
        keys: this.keys
      };
      this.whitelist.toCache(cache.matcher.whitelist);
      this.blacklist.toCache(cache.matcher.blacklist);
    }
    ,
    fromCache: function (cache) {
      this.whitelist.fromCache(cache.matcher.whitelist);
      this.blacklist.fromCache(cache.matcher.blacklist);
      this.keys = cache.matcher.keys;
    }
    
  };
  var defaultMatcher = new CombinedMatcher();
  if (typeof _patchFunc0 != "undefined")
    eval("(" + _patchFunc0.toString() + ")()");
  window.Matcher = Matcher;
  window.CombinedMatcher = CombinedMatcher;
  window.defaultMatcher = defaultMatcher;
}
)(window.MatcherPatch);
/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the "License"). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

var isExperimental;

var TagToType = {
  "SCRIPT": "SCRIPT",
  "IMG": "IMAGE",
  "LINK": "STYLESHEET",
  "OBJECT": "OBJECT",
  "EMBED": "OBJECT",
  "IFRAME": "SUBDOCUMENT"
};

var hostDomain = null;

var SELECTOR_GROUP_SIZE = 20;

var savedBeforeloadEvents = new Array();

var elemhideElt = null;

// Sets the currently used CSS rules for elemhide filters
function setElemhideCSSRules(selectors)
{
  if (elemhideElt && elemhideElt.parentNode)
    elemhideElt.parentNode.removeChild(elemhideElt);

  if (!selectors)
    return;

  elemhideElt = document.createElement("link");
  elemhideElt.setAttribute("rel", "stylesheet");
  elemhideElt.setAttribute("type", "text/css");
  elemhideElt.setAttribute("href", "data:text/css,");
  document.documentElement.appendChild(elemhideElt);

  var elt = elemhideElt;  // Use a local variable to avoid racing conditions
  function setRules()
  {
    if (!elt.sheet)
    {
      // Stylesheet didn't initialize yet, wait a little longer
      window.setTimeout(setRules, 0);
      return;
    }

    // WebKit apparently chokes when the selector list in a CSS rule is huge.
    // So we split the elemhide selectors into groups.
    for (var i = 0, j = 0; i < selectors.length; i += SELECTOR_GROUP_SIZE, j++)
    {
      var selector = selectors.slice(i, i + SELECTOR_GROUP_SIZE).join(", ");
      elt.sheet.insertRule(selector + " { display: none !important; }", j);
    }
  }
  setRules();
}

// Hides a single element
function nukeSingleElement(elt) {
  if(elt.innerHTML)
    elt.innerHTML = "";
  if(elt.innerText)
    elt.innerText = "";
  elt.style.display = "none";
  elt.style.visibility = "hidden";
  // If this is a LINK tag, it's probably a stylesheet, so disable it. Actually removing
  // it seems to intermittently break page rendering.
  if(elt.localName && elt.localName.toUpperCase() == "LINK")
    elt.setAttribute("disabled", "");
}

// This function Copyright (c) 2008 Jeni Tennison, from jquery.uri.js
// and licensed under the MIT license. See jquery-*.min.js for details.
function removeDotSegments(u) {
  var r = '', m = [];
  if (/\./.test(u)) {
    while (u !== undefined && u !== '') {
      if (u === '.' || u === '..') {
        u = '';
      } else if (/^\.\.\//.test(u)) { // starts with ../
        u = u.substring(3);
      } else if (/^\.\//.test(u)) { // starts with ./
        u = u.substring(2);
      } else if (/^\/\.(\/|$)/.test(u)) { // starts with /./ or consists of /.
        u = '/' + u.substring(3);
      } else if (/^\/\.\.(\/|$)/.test(u)) { // starts with /../ or consists of /..
        u = '/' + u.substring(4);
        r = r.replace(/\/?[^\/]+$/, '');
      } else {
        m = u.match(/^(\/?[^\/]*)(\/.*)?$/);
        u = m[2];
        r = r + m[1];
      }
    }
    return r;
  } else {
    return u;
  }
}

// Does some degree of URL normalization
function normalizeURL(url)
{
  var components = url.match(/(.+:\/\/.+?)\/(.*)/);
  if(!components)
    return url;
  var newPath = removeDotSegments(components[2]);
  if(newPath.length == 0)
    return components[1];
  if(newPath[0] != '/')
    newPath = '/' + newPath;
  return components[1] + newPath;
}

// Converts relative to absolute URL
// e.g.: foo.swf on http://example.com/whatever/bar.html
//  -> http://example.com/whatever/foo.swf 
function relativeToAbsoluteUrl(url) {
  // If URL is already absolute, don't mess with it
  if(!url || url.match(/^http/i))
    return url;
  // Leading / means absolute path
  if(url[0] == '/') {
    return document.location.protocol + "//" + document.location.host + url;
  }
  // Remove filename and add relative URL to it
  var base = document.baseURI.match(/.+\//);
  if(!base)
    return document.baseURI + "/" + url;
  return base[0] + url;
}

// Extracts a domain name from a URL
function extractDomainFromURL(url)
{
  if(!url)
    return "";

  var x = url.substr(url.indexOf("://") + 3);
  x = x.substr(0, x.indexOf("/"));
  x = x.substr(x.indexOf("@") + 1);
  if (x.indexOf("[") == 0 && x.indexOf("]") > 0)
  {
    x = x.substring(1,x.indexOf("]"));
  }
  else
  {
    colPos = x.indexOf(":");
    if (colPos >= 0)
      x = x.substr(0, colPos);
  }
  return x;
}

/**
 * Checks whether a request is third party for the current document, uses
 * our effective document domain as received by the background process.
 */
function isThirdParty(requestHost)
{
  if (!hostDomain)
    return true;

  // Remove trailing dots
  requestHost = requestHost.replace(/\.+$/, "");

  if (requestHost.length > hostDomain.length)
    return (requestHost.substr(requestHost.length - hostDomain.length - 1) != "." + hostDomain);
  else
    return (requestHost != hostDomain);
}

// This beforeload handler is used before we hear back from the background process about
// whether we're enabled etc. It saves the events so we can replay them to the normal
// beforeload handler once we know whether we're enabled - to catch ads that might have
// snuck by.
function saveBeforeloadEvent(e) {
  savedBeforeloadEvents.push(e);
}

/**
 * Tests whether a request needs to be blocked.
 */
function shouldBlock(/**String*/ url, /**String*/ type)
{
  var url = relativeToAbsoluteUrl(url);
  var requestHost = extractDomainFromURL(url);
  var thirdParty = isThirdParty(requestHost);
  var match = defaultMatcher.matchesAny(url, type, window.location.hostname, thirdParty);
  return (match && match instanceof BlockingFilter);
}

/**
 * Responds to beforeload events by preventing load and nuking the element if
 * it's an ad.
 */
function beforeloadHandler(/**Event*/ e)
{
  if (shouldBlock(e.url, TagToType[e.target.localName.toUpperCase()]))
  {
    e.preventDefault();
    if (e.target)
      nukeSingleElement(e.target);
  }
}

function sendRequests()
{
  // Make sure this is really an HTML page, as Chrome runs these scripts on just about everything
  if (!(document.documentElement instanceof HTMLElement))
    return;

  // Blocking from content script is unnecessary in experimental builds, it is
  // done though webRequest API.
  if (isExperimental != true)
  {
    chrome.extension.sendRequest({reqtype: "get-settings", matcher: true, host: window.location.hostname}, function(response)
    {
      document.removeEventListener("beforeload", saveBeforeloadEvent, true);

      if (response.enabled)
      {
        hostDomain = response.hostDomain;
        defaultMatcher.fromCache(JSON.parse(response.matcherData));

        document.addEventListener("beforeload", beforeloadHandler, true);

        // Replay the events that were saved while we were waiting to learn whether we are enabled
        for(var i = 0; i < savedBeforeloadEvents.length; i++)
          beforeloadHandler(savedBeforeloadEvents[i]);
      }
      delete savedBeforeloadEvents;
    });
  }

  chrome.extension.sendRequest({reqtype: "get-settings", selectors: true, host: window.location.hostname}, function(response)
  {
    setElemhideCSSRules(response.selectors);
  });
}

if (isExperimental != true)
  document.addEventListener("beforeload", saveBeforeloadEvent, true);

// In Chrome 18 the document might not be initialized yet
if (document.documentElement)
  sendRequests();
else
  window.setTimeout(sendRequests, 0);
