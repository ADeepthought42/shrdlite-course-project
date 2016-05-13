# A\* Search
## [Graph.ts](https://github.com/ADeepthought42/shrdlite-course-project/blob/master/Graph.ts)
`Graph.ts` contains a generic implementation of the A\* search algorithm. All possible paths 
from any node in a graph are queued with priority according to `f(n)=g(n)+h(n)`. The cost 
for reaching a node, `g(n)`, is stored in and updated when a path with lower cost is found. 
Each time a path to any next node is found, the previous node is linked as source to that node.
If the next node is already found the source will be updated if the new path is cheaper. 
When the next node is the goal, the algorithm backtracks the path through linked sources and 
returns the path with its cost. 
