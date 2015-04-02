var assert=require("assert");
var transpile=require("../src/transpile");
var runtimecode=require("fs").readFileSync("./src/runtime.js","utf8");

var pack=function(forth) {
	var code=
		"(function(){"+
		runtimecode+"\n"+transpile(forth,runtimecode,"test").codegen.join("\n")+"\nreturn runtime"
		+"})()";

	try {
		var res=eval(code);
	} catch(e) {
		console.log(e)
	}
	return res;
}
describe("core words",function(){

	it("dolit",function(){
		var runtime=pack("3");
		assert.equal(runtime.stack[0],3);
	});



});