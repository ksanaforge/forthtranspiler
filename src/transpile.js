var transpilejs=function(forthCodes,runtime,inputfn,outputfn) {
// forthCodes: forth source codes
// runtime: 
// inputfn: input file name
// outputfn: output file name
	var lines=forthCodes, tokens=[], opCodes=[], defined={}, idx={};
	var iLin=0, iCol=0, iTok=0, iOpCode=0;
	var line='', token, opCode;
	if(typeof(lines)=='string') lines=forthCodes.split(/\r?\n/);
	var nextLine=function(){
		line=undefined;
		if(iLin<lines.length)
			line=lines[iLin++], iCol=0, tokens=line.split(/\s+/), iTok=0;
		return line;
	}
	var nextToken=function(){
		token=undefined;
		if(iTok<tokens.length)
			token=tokens[iTok++];
		return token;
	}
	var checkNextToken=function(){
		var token=undefined;
		if(iTok<tokens.length)
			token=tokens[iTok];
		return token;
	}
	var nextOpCode=function(){
		opCode=undefined;
		if(iOpCode<opCodes.length)
			opCode=opCodes[iOpCode++];
		return opCode;
	}
	var checkNextOpCode=function(){
		var opCode=undefined;
		if(iOpCode<opCodes.length)
			opCode=opCodes[iOpCode]; // 
		return opCode;
	}
	////////////////////////////////////////////////////////////////////////////
	// all the functions that can be pushed into opCodes
	var doLit=function(n) {	/// doLit ( -- n ) compileOnly
		n=JSON.stringify(n);
		var adv=1, checkNextOpc=checkNextOpCode();
		if(checkNextOpc){
			if 		   (checkNextOpc==dup		)
				codegen.push("stack.push("+n+");"), codegen.push("stack.push("+n+");");
			else	if (checkNextOpc==plus		)
				codegen.push("stack[stack.length-1]+="+n+";");
			else	if (checkNextOpc==minus	)
				codegen.push("stack[stack.length-1]-="+n+";");
			else	if (checkNextOpc==multiply	)
				codegen.push("stack[stack.length-1]*="+n+";");
			else
				codegen.push("stack.push("+n+");"), adv=0; /// no extra advance
		} else
				codegen.push("stack.push("+n+");"), adv=0; /// no extra advance
		return adv;
	}
	var dup=function() {				/// dup	( n -- n n )
		codegen.push("stack.push(stack[stack.length-1]);");
	}
	var multiply=function() {			/// *	( a b -- a*b )
		codegen.push("stack.push(stack.pop()*stack.pop());");
	}
	var plus=function() {				/// + ( a b -- a+b )
		codegen.push("var tos=stack.pop();stack.push(stack.pop()+tos);");
	}
	var dot=function() {				/// .	( n -- )
		codegen.push("console.log(stack.pop());");
	}
	var minus=function() {				/// -	( a b -- a-b )
		codegen.push("var tos=stack.pop();stack.push(stack.pop()-tos);");
	}
	var doVal=function(name) {			/// doVal ( n <name> -- ) compileOnly
		codegen.push("var "+name+"=stack.pop();")
		return 1;
	}
	var getVal=function(name) {			/// 
		codegen.push("stack.push("+name+");");
		return 1;
	}
	var value=function(){ // value ( n <name> -- )
		var name=nextToken();
		if(name) { var x;
			eval('x=function(){getVal("'+name+'")}')
			defined[name]=x;
		//	console.log('defined['+name+']:'+defined[name])
			eval('x=function(){doVal("' +name+'")}')
			opCodes.push( x );
			addMapping(token), jsline++;
		} else
			throw 'need a name after value at line '+iLin+' column '+iCol;
	}
	var words = { "dup"		: {xt:dup		,defining:0} /// dup	 ( n -- n n )
				, "*"		: {xt:multiply	,defining:0} /// *	 ( a b -- a*b )
				, "+"		: {xt:plus		,defining:0} /// +	 ( a b -- a+b )
				, "."	 	: {xt:dot		,defining:0} /// .	 ( n -- )
				, "-"		: {xt:minus		,defining:0} /// -	 ( a b -- a-b )
				, "value"	: {xt:value		,defining:1} /// value ( n <name> -- )
				}
	
	var SourceMapGenerator=require("source-map").SourceMapGenerator;
	var sourcemap=new SourceMapGenerator({file:outputfn||inputfn+"js"});

	var addMapping=function(name) {
		//console.log(name,codegen.length+1,forthnline,forthncol)
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
	var forth2js=function(lines){
		opCodes=[];
		defined={};
		for (var i=0;i<lines.length;i++) {
			forthnline=i+1; 
			line=lines[i];
		//	console.log('forthnline:'+forthnline,'i:'+i,'line:'+JSON.stringify(line))
			var idx={};
			line.replace(/\S+/g,function(m,j){
			//	console.log('idx['+JSON.stringify(m)+']:'+j)
				idx[m]=j; });
			iTok=0,tokens=line.split(/\s+/);
		//	console.log(tokens.length+' tokens')
			while(checkNextToken()!==undefined){
				token=nextToken();
				forthncol=idx[token];
			//	console.log('forthncol:'+forthncol,'iTok:'+(iTok-1),'token:'+JSON.stringify(token))
				var def=defined[token];
				if (def) {
				//	console.log('def:'+def)
					opCodes.push(def);
					addMapping(token), jsline++;
				} else {
					var w=words[token];
					if (w) {
					//	console.log('w:'+w)
						if(w.defining)
							w.xt();
						else {
							opCodes.push(w.xt);
							addMapping(token), jsline++;      //assuming only generate one js source line
						}
					} else {
						var n=(parseFloat(token));
						if (isNaN(n)) {
							var M=token.match(/^'(\S+)'$/);
							if (M) {
							//	console.log('string:'+JSON.stringify(M[1]))
								opCodes.push(M[1]);
								addMapping(token), jsline++;
							} else {
								throw "unknown word:"+token;
							}
						} else {
						//	console.log('float:'+n)
							opCodes.push(n);
							addMapping(token), jsline++;
						}
					} // endif (w)
				} // endif (def)
			}/*
			source.replace(/\S+/g,function(m,j){ idx[m]=j; }
				var rest=source.substr(idx);
				var M=rest.match(/(\S+)(\s+)?(\S+)?/)
			//	if(source==='5 value five five') console.log('001 >>> idx:',idx,'rest:',rest);
				if(hidden[idx]){
				//	console.log('get hidden',m,'at',idx);
					return;
				}
				forthncol=idx;
				if(m=='value'){
				//	console.log('002 >>> idx:',idx,'rest:',rest);
					//opCodes.push('var '+M[3]+'=stack.pop()');
					opCodes.push( setVal );
					opCodes.push(M[3]);
				//	addMapping(m);
					var j=idx+(M[1]+M[2]).length;
					values[M[3]]=j;
				//	console.log('set hidden',M[3],'at',j);
					hidden[j]=1;
					jsline++;
					return
				}
				var v=values[m];
				if (v) {
				//	console.log('003 >>> idx:',idx,'rest:',rest);
					opCodes.push( getval );
					opCodes.push( m );
					//opCodes.push('stack.push('+m+')')
				//	addMapping(m);
					jsline++;
				} else {
					var w=words[m];
					if (w) {
						opCodes.push(w);
						addMapping(m);
						jsline++;      //assuming only generate one js source line
					} else {
						var n=(parseFloat(m));
						if (isNaN(n)) {
							var M=m.match(/'(\S+)'/);
							if (M) {
								opCodes.push(M[1]);
								jsline++;
							} else {
								throw "unknown word "+m;
							}
						} else {
							opCodes.push(n);
							jsline++;
						}
					} // endif (w)
				} // endif (v)
			});*/
		}
		return opCodes;
	}
	var jsline=runtime.length;     //generated javascript code line count, for source map
	var codegen=[];                //generated javsacript code
	var forthnline=0,forthncol=0;  //line and col of forth source code

//	console.log('opCodes:',opCodes);
	var opCodes=forth2js(lines);
	var i=0; 
	while(i<opCodes.length){
		var adv=0;
		if (typeof opCodes[i]=="function") {
			adv=opCodes[i]( opCodes[i+1] ) || 0;
		} else {
			adv=doLit(opCodes[i],opCodes[i+1]);
		}
		if (adv) i+=adv;
		i++;
	}


	return {jsCodes:codegen,sourcemap:sourcemap,opCodes:opCodes};
}

var runtimecode	=require("fs").readFileSync("./src/runtime.js","utf8");
var transpile=function(forth) {
	console.log('forthCode:',JSON.stringify(forth[0]));
	var trans=transpilejs(forth,runtimecode,"test");
	var code =	"(function(){					\n"
			 +	"var stack=[];					\n"
			 +	"var runtime={stack:stack};		\n"
			 +	   trans.jsCodes.join("\n")  + "\n"
			 +	"return runtime;				\n"
			 +	"})()";
	console.log('jsCode:\n',code);
	try {
		var res=eval(code);
		console.log('stack:',JSON.stringify(res.stack));
	}
	catch(e) { console.log(e) }
	return res;
}
module.exports=transpile;