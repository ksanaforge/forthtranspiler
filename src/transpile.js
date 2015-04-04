var tracing=0;
var transpilejs=function(forthCodes,runtime,inputfn,outputfn) {
// forthCodes: forth source codes
//  runtime: 
//  inputfn: input file name
// outputfn: output file name
	var lines=forthCodes, tokens=[], opCodes=[], defined={}, iCol={};
	var iLin=0, iCol=0, iTok=0, iOpCode=0;
	var line='', token, opCode;
	if(typeof(lines)=='string') lines=forthCodes.split(/\r?\n/);

	//////////////////////////////////////////////////////////////////////////
	// core words
	//////////////////////////////////////////////////////////////////////////
	var dup=function dup() { /// dup	( n -- n n )
		codegen.push("stack.push(stack[stack.length-1]);");
	}
	var multiply=function multiply() { /// *	( a b -- a*b )
		codegen.push("stack.push(stack.pop()*stack.pop());");
	}
	var plus=function plus() { /// + ( a b -- a+b )
		codegen.push("var tos=stack.pop();stack.push(stack.pop()+tos);");
	}
	var dot=function dot() { /// .	( n -- )
		codegen.push("console.log(stack.pop());");
	}
	var minus=function minus() { /// -	( a b -- a-b )
		codegen.push("var tos=stack.pop();stack.push(stack.pop()-tos);");
	}

	//////////////////////////////////////////////////////////////////////////
	/// constructing words for opCodes
	//////////////////////////////////////////////////////////////////////////
	var doLit=function(n) {	/// doLit ( -- n )
		n=JSON.stringify(n);
		var adv=1, nextOpc=opCodes[iOpCode+1];
		if(nextOpc){
			if 		   (nextOpc==dup		)
				codegen.push("stack.push("+n+");"), codegen.push("stack.push("+n+");");
			else	if (nextOpc==plus		)
				codegen.push("stack[stack.length-1]+="+n+";");
			else	if (nextOpc==minus	)
				codegen.push("stack[stack.length-1]-="+n+";");
			else	if (nextOpc==multiply	)
				codegen.push("stack[stack.length-1]*="+n+";");
			else
				codegen.push("stack.push("+n+");"), adv=0; /// no extra advance
		} else
				codegen.push("stack.push("+n+");"), adv=0; /// no extra advance
		return adv;
	}
	var setValue=function(name) { /// setVal('v') ( n -- )
		codegen.push("var "+name+"=stack.pop();")
		return 1;
	}
	var getValue=function(name) { /// v ( -- n )
		codegen.push("stack.push("+name+");");
		return 1;
	}
	var newName, xt; // globle variables
	var setColon=function(name){ /// : <name> ( -- )
		codegen.push('var '+name+'=function(){');
	}
	var endColon=function(){ /// ; ( -- )
		codegen.push('}');
	}
	var runColon=function(name){ /// <name>
		codegen.push(name+"();");
	}
	//////////////////////////////////////////////////////////////////////////
	/// defining words
	//////////////////////////////////////////////////////////////////////////
	var cmd='';
	var value=function(){ /// value <newName> ( n -- )
		newName=nextToken();
		if(newName) {
			cmd+=' '+newName;
			eval('xt=function(){setValue("'+newName+'")}');
			if(tracing) showOpInfo('setValue("'+newName+'")');
			opCodes.push( xt ); // we define newName to setValue
			addMapping('value '+newName), jsline++;
			eval('xt=function(){getValue("'+newName+'")}');
			defined[newName]=xt; // then use newName to getValue
		//	console.log('defined['+newName+']:'+xt)
		} else
			throw 'need newName for "value" at line '+iLin+' column '+iCol;
	}
	var colon=function(){ /// : ( <name> -- )
		newName=nextToken();
		if(newName) {
			cmd+=' '+newName;
			eval('xt=function(){setColon("'+newName+'")}');
			if(tracing) showOpInfo('setColon("'+newName+'")');
			opCodes.push( xt ); // setColon to begin colon defintion
			addMapping(': '+newName), jsline++;
		} else
			throw 'need newName for ":" at line '+iLin+' column '+iCol;
	}
	var semic=function(){ /// ; ( -- )
		var xt;
		var txt='xt=function(){endColon()}';
		eval(txt)
		if(tracing) showOpInfo('endColon()')
		opCodes.push( xt ); // endColon to end colon defintion
		addMapping(token), jsline++;
		eval('newXt=function(){runColon("'+newName+'")}');
		defined[newName]=newXt; // then use newName to runColon
	}
	//////////////////////////////////////////////////////////////////////////
	/// name list
	//////////////////////////////////////////////////////////////////////////
	var words = { "dup"		: {xt:dup		,defining:0} /// dup	( n -- n n )
				, "*"		: {xt:multiply	,defining:0} /// *	 	( a b -- a*b )
				, "+"		: {xt:plus		,defining:0} /// +	 	( a b -- a+b )
				, "."	 	: {xt:dot		,defining:0} /// .	 	( n -- )
				, "-"		: {xt:minus		,defining:0} /// -	 	( a b -- a-b )
				, "value"	: {xt:value		,defining:1} /// value	( n <name> -- )
				, ":"		: {xt:colon		,defining:1} /// :		( <name> -- )
				, ";"		: {xt:semic		,defining:1} /// ;		( -- )
				}
	
	//////////////////////////////////////////////////////////////////////////
	/// tools
	//////////////////////////////////////////////////////////////////////////
	var nextToken=function(){
		token=undefined;
		if(iTok<tokens.length){
			var i=iTok, j=iCol[i];
			token=tokens[iTok++];
			if(tracing) console.log('\tcol '+(j<10?'0':'')+j+' token '+i+': '+JSON.stringify(token));
		}
		return token;
	}
	var checkNextToken=function(){
		var token=undefined;
		if(iTok<tokens.length)
			token=tokens[iTok];
		return token;
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
	var showOpInfo=function(msg){
		console.log('\t\t\t\topCode '+opCodes.length+': '+msg);
	}

	//////////////////////////////////////////////////////////////////////////
	/// transpiling loop to generat opCodes first
	//////////////////////////////////////////////////////////////////////////
	var forth2js=function(lines){
		opCodes=[];
		defined={};
		if(tracing) console.log('\ntranspiling:');
		for (var i=0;i<lines.length;i++) {
			forthnline=i+1; 
			line=lines[i];
			if(tracing) console.log('\tline '+i+': '+JSON.stringify(line));
			iCol=[];
			iTok=0;
			line.replace(/\S+/g,function(token,j){ iCol[iTok++]=j; }); // iCol for each token
			iTok=0,tokens=line.split(/\s+/);
			cmd='';
			while(checkNextToken()!==undefined){
				forthncol=iCol[iTok]+1;
				cmd=token=nextToken();
				var xt=defined[token];
				if (xt) {
					if(tracing) showOpInfo(xt.toString().match(/\{(\S+)\}/)[1]);
					opCodes.push(xt);
					addMapping(token), jsline++;
				} else {
					var w=words[token];
					if (w) {
						xt=w.xt;
						if(w.defining)
							xt(); // execute defining word directly
						else {
							if(tracing) showOpInfo(xt.toString().match(/function\s+(\S+)\s+/)[1]);
							opCodes.push(xt);
							addMapping(token), jsline++;	//assuming only generate one js source line
						}
					} else {
						var n=(parseFloat(token));
						if (isNaN(n)) {
							var M=token.match(/^'(\S+)'$/);
							if (M) {
								var str=M[1];
								if(tracing) showOpInfo(JSON.stringify(str));
								opCodes.push(str);
								addMapping(token), jsline++;
							} else {
								throw "unknown word:"+token;
							}
						} else {
							if(tracing) showOpInfo(n)
							opCodes.push(n);
							addMapping(token), jsline++;
						}
					} // end if (w)
				} // end if (def)
			} // end while (checkNextToken()!==undefined)
		}
		return opCodes;
	}
	var jsline=runtime.length;     //generated javascript code line count, for source map
	var codegen=[];                //generated javsacript code
	var forthnline=0,forthncol=0;  //line and col of forth source code

	var opCodes=forth2js(lines);
	var i=0;

	//////////////////////////////////////////////////////////////////////////
	/// transpiling loop to generat jsCodes next
	//////////////////////////////////////////////////////////////////////////
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
	if(tracing) console.log('\nforthCode:',JSON.stringify(forth[0]));
	var trans=transpilejs(forth,runtimecode,"test");
	var code =	"(function(){"				+"\n"
			 +	runtimecode					+"\n"
			 +	trans.jsCodes.join("\n")	+"\n"
			 +	"return runtime;"			+"\n"
			 +	"})()";
	var indent='\t';
	var jsCode=trans.jsCodes.map(function(line,i){
		if(line.match(/^\s*\}/)){
			indent=indent.substr(0,indent.length-1);
		}
		var adjust='\t'+i+indent+line;
		if(line.match(/\{\s*$/)){
			indent+='\t'
		}
		return adjust;
	}).join('\n');
	if(tracing) console.log('jsCode:\n'+jsCode)
	try {
		var res=eval(code);
		if(tracing) console.log('\nresult stack: '+JSON.stringify(res.stack)+'\n');
	}
	catch(e) { console.log(e) }
	return res;
}
var trace=function(flag){
	tracing=flag;
}
module.exports={transpile:transpile,trace:trace};