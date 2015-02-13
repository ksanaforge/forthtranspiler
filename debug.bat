rem before running debug f2js.js sample.f we need to run node-instector first
start http://127.0.0.1:8080/debug?port=5858
node --debug-brk %1 %2
