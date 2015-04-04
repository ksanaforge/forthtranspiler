var assert		=require("assert");
var Transpile	=require("../src/transpile.js");
var transpile	=Transpile.transpile;

Transpile.trace(true);
describe(						"A.  test literals"
	,function(){				///////////////////

	it(								"A1.  test integers ok"
	,function(){assert.deepEqual(	//////////////////////
		transpile([					"0 1 23 -4 56789"
		]).stack,					[0,1,23,-4,56789]
	)})

	it(								"A2.  test floats ok"
	,function(){assert.deepEqual(	//////////////////////
		transpile([					"0.1 -2.3 -4.5e6"
		]).stack,					[0.1,-2.3,-4.5e6]
	)})

	it(								"A3.  test strings ok"
	,function(){assert.deepEqual(	//////////////////////
		transpile([					"'0.1' 'abc' 'deFghi'"
		]).stack,					['0.1','abc','deFghi']
	)})

});

describe(						"B.  test core words"
	,function(){				/////////////////////

	it(								"B1.  test + numbers ok"
	,function(){assert.deepEqual(	/////////////////////
		transpile([					"3 5 +"
		]).stack,					[8]
	)})

	it(								"B2.  test - numbers ok"
	,function(){ assert.deepEqual(	/////////////////////
		transpile([					"5 3 -"
		]).stack,					[2]
	)})

	it(								"B3.  test + strings ok"
	,function(){ assert.deepEqual(	/////////////////////
		transpile([					"'3' 5 +"
		]).stack,					["35"]
	)})

	it(								"B4.  test dup * ok"
	,function(){ assert.deepEqual(	///////////////
		transpile([					"3.5 dup *"
		]).stack,					[12.25]
	)})

});

describe(						"C.  test defining words"
	,function(){				/////////////////////

	it(								"C1.  test value ok"
	,function(){ assert.deepEqual(	/////////////////
		transpile([					"5 value a 3 a +"
		]).stack,					[8]
	)})

	it(								"C2.  test : ; ok"
	,function(){ assert.deepEqual(	/////////////////
		transpile([					": x 5 + ; 3 x"
		]).stack,					[8]
	)})
});