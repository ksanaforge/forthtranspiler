var assert		=require("assert");
var transpile	=require("../src/transpile.js");

describe(						"A.  test core words"
	,function(){				/////////////////////

	it(								"A1.  test numbers"
	,function(){assert.deepEqual(	///////////////////
		transpile([					"3 5"
		]).stack,					[3,5]
	)})

	it(								"A2.  test + numbers"
	,function(){assert.deepEqual(	/////////////////////
		transpile([					"3 5 +"
		]).stack,					[8]
	)})

	it(								"A3.  test - numbers"
	,function(){ assert.deepEqual(	/////////////////////
		transpile([					"5 3 -"
		]).stack,					[2]
	)})

	it(								"A4.  test string"
	,function(){ assert.deepEqual(	//////////////////
		transpile([					"'3'"
		]).stack,					["3"]
	)})

	it(								"A5.  test + strings"
	,function(){ assert.deepEqual(	/////////////////////
		transpile([					"'3' 5 +"
		]).stack,					["35"]
	)})

	it(								"A6.  test dup"
	,function(){ assert.deepEqual(	///////////////
		transpile([					"3 dup"
		]).stack,					[3,3]
	)})

	it(								"A7.  test value"
	,function(){ assert.deepEqual(	/////////////////
		transpile([					"5 value a 3 a +"
		]).stack,					[8]
	)})

	it(								"A8.  test : ;"
	,function(){ assert.deepEqual(	/////////////////
		transpile([					": x 5 + ; 3 x"
		]).stack,					[8]
	)})
});