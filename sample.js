/*forth runtime*/
var stack=[];
stack.push(8);
stack.push(8);
stack.push(stack.pop()*stack.pop())
stack.push(stack[0]) 
console.log(stack.pop())
stack[0]+=5;
console.log(stack.pop())
//# sourceMappingURL=sample.js.map