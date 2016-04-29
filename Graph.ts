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
    var result : SearchResult<Node> = {
        path: [],
        cost: 0
    };
    // f(n) = g(n) + h(n)
    var f = (n : Node) : number => intermediates.getValue(n) + heuristics(n);
    // stores prospect nodes ordered by f(n)
    var prospects : collections.PriorityQueue<Node> =
        new collections.PriorityQueue<Node>((a,b) => (f(a) < f(b)) ? 1
                                            : ((f(a) == f(b)) ? 0 : -1));
    // stores intermediate costs for reaching a node in a graph
    var intermediates : collections.Dictionary<Node,number> =
        new collections.Dictionary<Node,number>();
    // stores pairs of nodes resulting in cheapest path
    var path : collections.Dictionary<Node,Node> =
        new collections.Dictionary<Node,Node>();

    // preliminaries for searching
    var current : Node = start;
    intermediates.setValue(current,0);
    prospects.enqueue(current);
    var endTime = Date.now() + (timeout * 1000);
    // search for a path until goal is reached or time is up
    while(!goal(current) && (Date.now() < endTime)) {
        // iterate through all edges from current node
        for (var edge of graph.outgoingEdges(current)) {
            // calculate the cost of traveling the edge to next node
            var cost : number = intermediates.getValue(current)
                                + edge.cost;
            // if end node not reached or cost is lower than previous travel
            if (!intermediates.containsKey(edge.to)
                || cost < intermediates.getValue(edge.to)) {
                // set new cost, add end to prospects and update cheapest pair
                intermediates.setValue(edge.to,cost);
                prospects.enqueue(edge.to);
                path.setValue(edge.to,current);
            }
        }
        current = prospects.dequeue();
    }
    // set cost of reaching goal and backtrack path from goal
    result.cost = intermediates.getValue(current);
    while(graph.compareNodes(path.getValue(current),start) != 0) {
        result.path.unshift(current);
        current = path.getValue(current);
    }
    result.path.unshift(current);
    return result;
}
