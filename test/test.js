/**
 * Created by Jussi on 28.11.2014.
 */

var logParser = require("../enemy-territory-log-parser");
var expect = require("expect.js");

describe("Log parser", function () {
  describe("Constructor", function () {
    it("should throw when options is undefined", function () {
      expect(function () {
        logParser.LogWatcher()
      }).to.throwError();
    });

    it("should throw error when file is undefined", function () {
      expect(function () {
        logParser.LogWatcher({})
      }).to.throwError();
    });

    it("should throw error when defined file doesn't exist", function () {
      expect(function () {
        logParser.LogWatcher({file: "this_doesnt_exist.txt"});
      }).to.throwError();
    });

    it("shouldn't throw when file is defined and it exists", function () {
      expect(function () {
        logParser.LogWatcher({file: "test/this_exists.txt"});
      }).to.not.throwError();
    });
  });

  describe("Watch file", function () {
    it("should throw if already watching a file", function () {

      expect(function () {
        var parser = logParser.LogWatcher({file: "test/this_exists.txt"},
          function () {
            parser.watchFile(null);
          }());

      }).to.throwError();
    });
  });

  describe("Parse chat", function () {
    it("should throw if newBytes is undefined", function () {
      expect(function () {
        var parser = logParser.LogWatcher({file: "test/this_exists.txt"});
        parser.parseChat();
      }).to.throwError();
    });

    it("shouldn't throw if newBytes length is 0", function () {
      expect(function () {
        var parser = logParser.LogWatcher({file: "test/this_exists.txt"});
        parser.parseChat("");
      }).to.not.throwError();
    });
  });

  describe("Unwatch file", function () {
    it("shouldn't throw if unwatched twice", function () {
      expect(function () {
        var parser = logParser.LogWatcher({file: "test/this_exists.txt"});
        parser.unwatchFile();
        parser.unwatchFile();
      }).to.not.throwError();
    });
  });
});
