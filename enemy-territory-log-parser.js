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

/**
 * Watches a log file (defined in options.file).
 * Emits events whenever new lines are read
 *
 * Events: "name", arguments
 *  "bytes", bytesRead // read x new bytes.
 *  "message", messageObject // read a new message
 *
 * @param options
 * @returns {LogWatcher}
 * @constructor
 */
function LogWatcher(options) {
  if (!(this instanceof LogWatcher)) {
    return new LogWatcher(options);
  }
  if (!options) {
    throw "options is not defined";
  }

  this.options = options;

  if (!this.options.file) {
    throw "options.file is not defined";
  }

  console.log("täs");
  this.watchFile();
}
util.inherits(LogWatcher, EventEmitter);

/**
 * Watch a file defined in the options.file parameter.
 * Emits events on file change.
 */
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

/**
 * Parses new bytes, find any possible chat messages and
 * emits an event when one is found.
 * @param newBytes
 */
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

/**
 * Stops watching a file. This must be called in order
 * for the application to stop.
 */
LogWatcher.prototype.unwatchFile = function () {
  if (this.fd === undefined) {
    return;
  }

  fs.unwatchFile(this.options.file);
  fs.close(this.fd);
  this.fd = undefined;
};

/**
 * Creates a chat message object.
 * @param matched
 * @param chatType
 * @returns {{name: *, message: *, chatType: *}}
 * @private
 */
function _createChatMessageObject(matched, chatType) {
  return {
    name: matched[1],
    message: matched[2],
    chatType: chatType
  };
}

exports.LogWatcher = LogWatcher;