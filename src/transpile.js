var transpilejs=function(forthCodes,runtime,inputfn,outputfn) {

	var doLit=function(n,nextinst) {	/// doLit ( -- n )
		n=JSON.stringify(n);
		var adv=1;
				if (nextinst==dup		) {
			codegen.push("stack.push("+n+");");
			codegen.push("stack.push("+n+");");
		} else	if (nextinst==plus		) {
			codegen.push("stack[stack.length-1]+="+n+";");
		} else	if (nextinst==multiply	) {
			codegen.push("stack[stack.length-1]*="+n+";");
		} else {
			codegen.push("stack.push("+n+");");
			adv=0; /// no extra advance
		}
		return adv;
	}

	var dup=function() {				/// dup	( n -- n n )
		codegen.push("stack.push(stack[stack.length-1]);"); // stack[stack.length-1] ??????
	}
	var multiply=function() {			/// *	( a b -- a*b )
		codegen.push("stack.push(stack.pop()*stack.pop());");
	}
	var plus=function() {				/// + ( a b -- a+b )
		codegen.push("var tos=stack.pop();stack.push(stack.pop()-tos);");
	}
	var dot=function() {				/// .	( n -- )
		codegen.push("console.log(stack.pop());");
	}

	/// new words added ///
	var minus=function() {				/// -	( a b -- a-b )
		codegen.push("var tos=stack.pop();stack.push(stack.pop()-tos);");
	}

	var setVal=function(next) {
		var name=next;
		codegen.push("var "+name+"=stack.pop();")
		return 1;
	}

	var getval=function(next) {
		var name=next;
		codegen.push("stack.push("+name+");");
		return 1;
	}


	
///	var value=function(name) {				/// value ( n <name> -- )
///		codegen.push("var "+name+"=stack.pop();");
///		values[name]=1;
///	}
	/// new words ended ///

	var words = { "dup"		: dup		/// dup	( n -- n n )
				, "*"		: multiply	/// *	( a b -- a*b )
				, "+"		: plus		/// +	( a b -- a+b )
				, "."	 	: dot		/// .	( n -- )
	/// new words added ///
				, "-"		: minus		/// -	( a b -- a-b )
	///			, "value"	: value		/// value ( n <name> -- )
	/// new words ended ///
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

	var forth2js=function(forthCodes){
		var i=0;
		var opCodes=[];
		var values={};
		for (i=0;i<forthCodes.length;i++) {
			forthnline=i+1; 
			source=forthCodes[i];
			var hidden={};
			source.replace(/\S+/g,function(m,idx){
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
			});
		}
		return opCodes;
	}


	var jsline=runtime.length;     //generated javascript code line count, for source map
	var codegen=[];                //generated javsacript code
	var forthnline=0,forthncol=0;  //line and col of forth source code

	var opCodes=forth2js(forthCodes);
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

module.exports=transpilejs;