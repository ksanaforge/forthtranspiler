var transpile=function(sources,runtime,inputfn,outputfn) {

	var SourceMapGenerator=require("source-map").SourceMapGenerator;
	var sourcemap=new SourceMapGenerator({file:outputfn||inputfn+"js"});

	var dolit=function(n,nextinst) {
		var adv=1;
		if (nextinst==dup) {
			codegen.push("stack.push("+n+");");
			codegen.push("stack.push("+n+");");
		} else if (nextinst==plus) {
			codegen.push("stack[stack.length-1]+="+n+";");
		} else if (nextinst==multiply) {
			codegen.push("stack[stack.length-1]*="+n+";");
		} else {
			codegen.push("stack.push("+n+");");
			adv=0;
		}
		return adv;
	}
	var dup=function() {
		codegen.push("stack.push(stack[stack.length-1]);"); // stack[stack.length-1] ??????
	}
	var multiply=function() {
		codegen.push("stack.push(stack.pop()*stack.pop());");
	}
	var plus=function() {
		codegen.push("stack.push(stack.pop()+stack.pop());");
	}
	var dot=function() {
		codegen.push("console.log(stack.pop());");
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
		    line: forthnline,
		    column: forthncol
		  },
		  name: name
		});
	}

	var token2code=function(sources){
		var i=0;
		var codes=[];
		for (i=0;i<sources.length;i++) {
			forthnline=i+1; 
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


	var jsline=runtime.length;     //generated javascript code line count, for source map
	var codegen=[];                //generated javsacript code
	var forthnline=0,forthncol=0;  //line and col of forth source code

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


	return {codegen:codegen,sourcemap:sourcemap};
}

module.exports=transpile;