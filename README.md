et-log-parser
=============
```javascript
var notifier = require("./enemy-territory-log-parser");

var watcher = notifier.LogWatcher({
  file: "/path/to/etconsole.log",
  parseChat: true
});

watcher.on("bytes", function (newBytes) {
  console.log(newBytes);
});

watcher.on("message", function (message) {
  console.log(message);
});
```