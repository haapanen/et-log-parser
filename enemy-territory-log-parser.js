/**
 * Created by Jussi on 26.11.2014.
 */

var fs = require("fs");
var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var util = require("util");

var sayPattern = /^say: (.+): (.+)$/;
var teamSayPattern = /^sayteam: (.+): (.+)$/;
var fireteamSayPattern = /^saybuddy: (.+): (.+)$/;

function LogWatcher(options) {
  if (!(this instanceof LogWatcher)) {
    return new LogWatcher(options);
  }
  this.options = options;

  if (!this.options.file) {
    throw "options.file is not defined";
  }

  this.watchFile();
}
util.inherits(LogWatcher, EventEmitter);

LogWatcher.prototype.watchFile = function () {
  var previousSize = fs.statSync(this.options.file).size;
  var self = this;

  if (self.fd !== undefined) {
    throw "error: already watching a file.";
  }

  fs.open(self.options.file, 'r', function (err, fd) {
    self.fd = fd;
    if (err) {
      self.emit("error", err);
      return;
    }

    fs.watchFile(self.options.file, {
      interval: self.options.interval ? self.options.interval : 100
    }, function () {
      var stat = fs.statSync(self.options.file);
      var currentSize = stat.size;
      var newBytes = currentSize - previousSize;

      if (newBytes <= 0) {
        return;
      }

      var buf = new Buffer(newBytes);
      fs.read(fd, buf, 0, newBytes, previousSize, function (err, bytesRead, buffer) {
        if (err) {
          self.emit("error", err);
          return;
        }

        self.emit("bytes", buffer.toString());

        if (self.options.parseChat !== undefined &&
          self.options.parseChat === true) {
          self.parseChat(buffer.toString());
        }
      });

      previousSize = currentSize;
    });
  });
};

LogWatcher.prototype.parseChat = function (newBytes) {
  var lines = newBytes.split("\n");
  var self = this;

  _.each(lines, function (line) {
    var matched = line.match(sayPattern);

    if (matched) {
      self.emit("message", _createChatMessageObject(matched, "all"));
      return;
    }
    if (self.options.teamChat) {
      matched = line.match(teamSayPattern);
      if (matched) {
        self.emit("message", _createChatMessageObject(matched, "team"))
        return;
      }
    }
    if (self.options.fireteamChat) {
      matched = line.match(fireteamSayPattern);
      if (matched) {
        self.emit("message", _createChatMessageObject(matched, "fireteam"))
        return;
      }
    }
  });
};

LogWatcher.prototype.unwatchFile = function () {
  if (this.fd === undefined) {
    return;
  }

  fs.unwatchFile(this.options.file);
  fs.close(this.fd);
  this.fd = undefined;
};

function _createChatMessageObject(matched, chatType) {
  return {
    name: matched[1],
    message: matched[2],
    chatType: chatType
  };
}

exports.LogWatcher = LogWatcher;
//
//function notifyOnChanges(file, callback) {
//  var previousSize = fs.statSync(file).size;
//
//  fs.open(file, 'r', function (err, fd) {
//    if (err) {
//      callback(null, err);
//      return;
//    }
//
//    fs.watchFile(file, {
//      interval: 100
//    }, function () {
//      var stat = fs.statSync(file);
//      var currentSize = stat.size;
//      var newBytes = currentSize - previousSize;
//
//      if (newBytes <= 0) {
//        return;
//      }
//
//      var buf = new Buffer(newBytes);
//      fs.read(fd, buf, 0, newBytes, previousSize, function (err, bytesRead, buffer) {
//        if (err) {
//          callback(null, err);
//          return;
//        }
//
//        callback(buffer.toString());
//      });
//
//      previousSize = currentSize;
//    });
//  });
//}
//
//exports.notifyOnChanges = notifyOnChanges;
//

//
//function notifyOnNewChatMessage(options, callback) {
//
//  var teamChat = false;
//  var fireteamChat = false;
//
//  if (options.teamchat !== undefined && options.teamchat === true) {
//    teamChat = true;
//  }
//  if (options.fireteamChat !== undefined && options.fireteamChat === true) {
//    fireteamChat = true;
//  }
//
//  notifyOnChanges(options.file, function (newBytes) {
//    var lines = newBytes.split("\n");
//
//    _.each(lines, function (line) {
//      var matched = line.match(sayPattern);
//
//      if (matched) {
//        callback(_createChatMessageObject(matched, "all"));
//      } else if (teamChat) {
//        matched = line.match(teamSayPattern);
//        if (matched) {
//          callback(_createChatMessageObject(matched, "team"));
//        }
//      } else if (fireteamChat) {
//        matched = line.match(fireteamChat);
//        if (matched) {
//          callback(_createChatMessageObject(matched, "fireteam"));
//        }
//      }
//    });
//  });
//}
//
//exports.notifyOnNewChatMessage = notifyOnNewChatMessage;