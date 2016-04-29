///<reference path="lib/collections.ts"/>
///<reference path="lib/node.d.ts"/>

/** Graph module
*
*  Types for generic A\* implementation.
*
*  *NB.* The only part of this module
*  that you should change is the `aStarSearch` function. Everything
*  else should be used as-is.
*/

/** An edge in a graph. */
class Edge<Node> {
    from : Node;
    to   : Node;
    cost : number;
}

/** A directed graph. */
interface Graph<Node> {
    /** Computes the edges that leave from a node. */
    outgoingEdges(node : Node) : Edge<Node>[];
    /** A function that compares nodes. */
    compareNodes : collections.ICompareFunction<Node>;
}

/** Type that reports the result of a search. */
class SearchResult<Node> {
    /** The path (sequence of Nodes) found by the search algorithm. */
    path : Node[];
    /** The total cost of the path. */
    cost : number;
}



/**
* A\* search implementation, parameterised by a `Node` type. The code
* here is just a template; you should rewrite this function
* entirely. In this template, the code produces a dummy search result
* which just picks the first possible neighbour.
*
* Note that you should not change the API (type) of this function,
* only its body.
* @param graph The graph on which to perform A\* search.
* @param start The initial node.
* @param goal A function that returns true when given a goal node. Used to determine if the algorithm has reached the goal.
* @param heuristics The heuristic function. Used to estimate the cost of reaching the goal from a given Node.
* @param timeout Maximum time (in seconds) to spend performing A\* search.
* @returns A search result, which contains the path from `start` to a node 
* satisfying `goal` and the cost of this path.
*/
function aStarSearch<Node> (
    graph : Graph<Node>,
    start : Node,
    goal : (n:Node) => boolean,
    heuristics : (n:Node) => number,
    timeout : number
) : SearchResult<Node> {
        // A dummy search result: it just picks the first possible neighbour
    var result : SearchResult<Node> = {
        path: [start],
        cost: 0
    };

    var rs : collections.LinkedDictionary<Node,SearchResult<Node>> = 
        new collections.LinkedDictionary<Node,SearchResult<Node>>();
    var openNodes : collections.PriorityQueue<Node> = 
        new collections.PriorityQueue<Node>(compare);
    var closedNodes : collections.LinkedList<Node> = 
        new collections.LinkedList<Node>();

    
    var compare = (a : Node, b : Node) : number =>
    {
        //a is lesser than b by some ordering criterion
        if(rs.getValue(a).cost > rs.getValue(b).cost) {
            return -1;
        }
        //a is greater than b by the ordering criterion
        if(rs.getValue(a).cost < rs.getValue(b).cost) {
            return 1;
        } 
          // a must be equal to b
        return 0;
    }

    var startCost : number = heuristics(start);
    var currentNode : Node = start;
    result.cost = startCost;
    rs.setValue(currentNode,result);
    openNodes.add(currentNode);
    

    while (!openNodes.isEmpty()) {

        currentNode = openNodes.dequeue();
        closedNodes.add(currentNode);
        result = rs.getValue(currentNode);

        if(goal(currentNode))
            return result;

        var edges = graph.outgoingEdges(currentNode);

        for(var i : number ; i < edges.length ; i++){
            
            var neighbour = edges[i];
            var res : SearchResult<Node> = result;
            var cost = res.cost + neighbour.cost;

            var neighbourRes = rs.getValue(neighbour.to);
            var neighbourCost = neighbourRes.cost;
            if(openNodes.contains(neighbour.to)) {
                if(cost < neighbourCost){
                    //Ta bort neighbour från openNodes. Hur??
                }
                
            }
            if(closedNodes.contains(neighbour.to)) {
                if(cost < neighbourCost){
                    closedNodes.remove(neighbour.to);
                }
            }
            else {
                res.cost = cost + heuristics(neighbour.to);
                res.path.push(neighbour.to);
                rs.setValue(neighbour.to, res);
                openNodes.add(neighbour.to);
            }
        }
    }

    return result;
}


