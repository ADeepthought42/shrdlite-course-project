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
* @returns A search result, which contains the path from `start` to a node satisfying `goal` and the cost of this path.
*/
function aStarSearch<Node> (
    graph : Graph<Node>,
    start : Node,
    goal : (n:Node) => boolean,
    heuristics : (n:Node) => number,
    timeout : number
) : SearchResult<Node> {
    var endTime = Date.now() + (timeout * 1000);
    // A dummy search result: it just picks the first possible neighbour
    var result : SearchResult<Node> = {
        path: [start],
        cost: 0
    };

    if(heuristics(start)==0){
         //do something to
    }
    if(goal(start)){
        // already at goal
        return result;
    }

    // would not work, need to think about this..
    var prio : collections.PriorityQueue<Edge> = collections.PriorityQueue<Edge> (
            (a,b) => (graph.compareNodes(a,b) > graph.compareNodes(b,a)) ? -1 :
                ((graph.compareNodes(a,b) == graph.compareNodes(b,a)) ? 0 : 1)
//            (a,b) => (heuristics(a.to) < heuristics(b.to)) ? -1 : ((heuristics(a.to) == heuristics(b.to)) ? 0 : 1)
        );

    current : Node = start;
    while(!goal(current) && (Date.now() < endTime)){
        for (edge of graph.outgoingEdges(current)) {
            if (edge.to != current){

            }
        }
    }
    while (result.path.length < 3) {
        var edge : Edge<Node> = graph.outgoingEdges(start) [0];
        if (! edge) break;
        start = edge.to;
        result.path.push(start);
        result.cost += edge.cost;
    }
    return result;
}


