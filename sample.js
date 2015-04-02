/*forth runtime*/
var stack=[];

//runtime ends here
stack.push(1);
stack.push(2);
stack.push(3);
stack.push(3);
stack.push(stack.pop()*stack.pop());
stack.push(stack[stack.length-1]);
console.log(stack.pop());
stack[stack.length-1]+=5;
console.log(stack.pop());
//# sourceMappingURL=sample.js.map