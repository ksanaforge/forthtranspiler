var assert=require("assert");
var transpilejs=require("../src/transpile.js");
var runtimecode=require("fs").readFileSync("./src/runtime.js","utf8");
var transpile=function(forth) {
	var code=
		"(function(){"+
		runtimecode+"\n"+transpilejs(forth,runtimecode,"test").codegen.join("\n")+"\nreturn runtime"
		+"})()";
	console.log('forthCode:',forth[0],'\njsCode:\n',code);
	console.log('opCodes:',opCodes)
	try {
		var res=eval(code);
		console.log('result:',JSON.stringify(res.stack)); }
	catch(e) { console.log(e) }
	return res;
}
describe("core words",function(){
//	/*
	it("01 numbers"
		,function(){ assert.deepEqual([3,5]
			,transpile(["3 5"
			]).stack   ); });
	it("02 + for numbers"
		,function(){ assert.equal	 (8
			,transpile(["3 5 +"
			]).stack[0]); });
	it("03 - for numbers"
		,function(){ assert.equal	 (2
			,transpile(["5 3 -"
			]).stack[0]); });
	it("04 string"
		,function(){ assert.equal	 ("3"
			,transpile(["'3'"
			]).stack[0]); });
	it("05 + for strings"
		,function(){ assert.equal	 ("35"
			,transpile(["'3' 5 +"
			]).stack[0]); });
	it("06 dup top of stack"
		,function(){ assert.deepEqual([3,3]
			,transpile(["3 dup"
			]).stack   ); });
//	*/
	it("07 value"
		,function(){ assert.equal	 ([5]
			,transpile(["5 value five five"
			]).stack[0]   ); });

//	it("06 code drop stack.pop() end-code"
//		,function(){ assert.equal	 ("35"
//			,transpile(["'3' 5 +"	]).stack[0]); });
});