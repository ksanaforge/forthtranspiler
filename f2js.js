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


var argv=process.argv;
if (argv.length<3) {
	console.log("missing input filename")
	return;
}
var inputfn=argv[2];
var input=fs.readFileSync(inputfn,"utf8").replace(/\r\n/g,"\n").split("\n");
var runtime=fs.readFileSync("runtime.js","utf8").replace(/\r\n/g,"\n").split("\n");
var outputfn=argv[2].substr(0,argv[2].length-1)+"js";

var sourcemap=new SourceMapGenerator({file:outputfn});

var codegen=[];
var forthnline=0,forthncol=0;  //line and col of forth source code
var jsline=runtime.length;

var dolit=function(n,nextinst) {
	var adv=1;
	if (nextinst==dup) {
		codegen.push("stack.push("+n+");");
		codegen.push("stack.push("+n+");");
	} else if (nextinst==plus) {
		codegen.push("stack[0]+="+n+";");
	} else if (nextinst==multiply) {
		codegen.push("stack[0]*="+n+";");
	} else {
		codegen.push("stack.push("+n+");");
		adv=0;
	}
	return adv;
}
var dup=function() {
	codegen.push("stack.push(stack[0]) ");
}
var multiply=function() {
	codegen.push("stack.push(stack.pop()*stack.pop())");
}
var plus=function() {
	codegen.push("stack.push(stack.pop()+stack.pop())");
}
var dot=function() {
	codegen.push("console.log(stack.pop())");
}
var words={
	"dup" : dup,
	"*"   : multiply,
	"+"   : plus,
	"."   : dot,
}

var addMapping=function(name) {
	console.log(name,codegen.length+1,forthnline,forthncol)
	sourcemap.addMapping({
	  generated: {
	    line: jsline,
	    column: 1
	  },
	  source: inputfn,
	  original: {
	    line: forthnline+1,
	    column: forthncol
	  },
	  name: name
	});
}

var token2code=function(sources){
	var i=0;
	var codes=[];
	for (i=0;i<sources.length;i++) {
		forthnline=i;
		source=sources[i];
		source.replace(/[^ ]+/g,function(m,idx){
			forthncol=idx;
			var w=words[m];
			if (w) {
				codes.push(w);
				addMapping(m);
				jsline++;      //assuming only generate one js source line
			} else {
				var n=(parseFloat(m));
				if (isNaN(n)) {
					throw "unknown word "+m;	
				} else {
					codes.push(n);
					jsline++;
				}			
			}
		});
	}
	return codes;
}


var transpile=function(sources) {
	var codes=token2code(sources);
	var i=0;
	while(i<codes.length){
		var adv=0;
		if (typeof codes[i]=="function") {
			codes[i]();
		} else{
			adv=dolit(codes[i],codes[i+1]);
		}
		if (adv) i+=adv;
		i++;
	}
}

transpile(input);
sourcemap.file=outputfn;
var output=runtime.join("\n")+"\n"+codegen.join("\n")+"\n//# sourceMappingURL="+outputfn+".map";

console.log("output to "+outputfn);
fs.writeFile(outputfn,output,"utf8");
fs.writeFile(outputfn+".map",sourcemap.toString() ,"utf8");
