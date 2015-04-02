/*
   Forth to javascript transpiler 
   with source map and a very primitive peephole optimization

   yapcheahshen@gmail.com 2015/1/17 FIG Meeting

   sourcemap:
   http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/
   https://hacks.mozilla.org/2013/05/compiling-to-javascript-and-debugging-with-source-maps/

*/

var fs=require("fs");
var SourceMapGenerator=require("source-map").SourceMapGenerator;
console.log('require("source-map")');

var argv=process.argv;
if (argv.length<3) {
	console.log("missing input filename");
	return;
}
var inputfn=argv[2];
var input=fs.readFileSync(inputfn,"utf8").replace(/\r\n/g,"\n").split("\n");

//forth runtime
var runtime=fs.readFileSync("./src/runtime.js","utf8").replace(/\r\n/g,"\n").split("\n");
var outputfn=argv[2].substr(0,argv[2].length-1)+"js";

var sourcemap=new SourceMapGenerator({file:outputfn});


transpile=require("./src/transpile");

var codegen=transpile(input,runtime,sourcemap,inputfn);
sourcemap.file=outputfn;
var output=runtime.join("\n")+"\n"+codegen.join("\n")+"\n//# sourceMappingURL="+outputfn+".map";

console.log("output to "+outputfn);
fs.writeFile(outputfn,output,"utf8");
fs.writeFile(outputfn+".map",sourcemap.toString() ,"utf8");
