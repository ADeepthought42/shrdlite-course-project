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

/** A wrapper class providing extra fields for A*Search. */
class Wrapper<Node>{
    parent: Node=null;
    value : Node;
    gRank : number;
    fRank : number;
    hRank : number;
}

/**
 * Extension for Set providing transparant use of needed Set methods
 *  and storing information about wrapped nodes.
 */
class Visited<Node>{
    private set : collections.Set<Node>;
    protected table: {[key:string]: Wrapper<Node>};

    constructor() {
        this.set = new collections.Set<Node>();
        this.table = {};
    }

    setValue(WrappedNode : Wrapper<Node>) : boolean {
        this.table['$'+WrappedNode.value.toString()] = WrappedNode;
        return this.set.add(WrappedNode.value);
    }

    update(parent:Node, value:Node, gDiff:number) {
        this.table['$'+value.toString()].gRank -= gDiff;
        this.table['$'+value.toString()].parent = parent;
        this.table['$'+value.toString()].fRank -= gDiff;
    }

    contains(node : Node) : boolean {
        return this.set.contains(node);
    }

    getFRank(node : Node) : number {
        var wrapper : Wrapper<Node> = this.table['$'+node.toString()];
        return wrapper.fRank;
    }

    getGRank(node : Node) : number {
        var wrapper : Wrapper<Node> = this.table['$'+node.toString()];
        return wrapper.gRank;
    }

    getHRank(node : Node) : number {
        var wrapper : Wrapper<Node> = this.table['$'+node.toString()];
        return wrapper.hRank;
    }

    getParent(node : Node) : Node {
        var wrapper : Wrapper<Node> = this.table['$'+node.toString()];
        return wrapper.parent;
    }
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
    var result : SearchResult<Node> = {
        path: [],
        cost: -1
    };
    var visited : Visited<Node> = new Visited<Node>();
    var f = (n : Node) : number => visited.getFRank(n);
    var open : collections.PriorityQueue<Node> =
        new collections.PriorityQueue<Node>((a,b) => (f(a) < f(b)) ? 1
                                            : ((f(a) == f(b)) ? 0 : -1));
    // Set up starting node for searching
    var hRank : number = heuristics(start);
    visited.setValue({
        parent:null,
        value:start,
        gRank:0,
        hRank:hRank,
        fRank:0+hRank
    });
    open.enqueue(start);

    // search for a goal until no more open nodes exist or time is up
    while(!open.isEmpty() && Date.now() < endTime) {
        var current : Node = open.dequeue();

        if (goal(current)) {
            // Reached goal, update SearchResult and return
            result.cost = visited.getGRank(current);
            while(current){
                result.path.unshift(current);
                current = visited.getParent(current);
            }
            return result;
        }

        // Iterate over all edges from current node
        for (var edge of graph.outgoingEdges(current)) {
            // calculate the cost of traveling the edge to next node
            var cost : number = visited.getGRank(current) + edge.cost;
            if (!visited.contains(edge.to)) {
                // New node found, add it to visited with what we know
                var hRank : number = heuristics(edge.to);
                visited.setValue({parent:current,
                                 value:edge.to,
                                 gRank:cost,
                                 hRank:hRank,
                                 fRank:cost+hRank
                });
                open.enqueue(edge.to);
            } else if (cost < visited.getGRank(edge.to)) {
                // Cheaper path found, update previous values accordingly
                visited.update(current,edge.to,visited.getGRank(edge.to)-cost);
                open.enqueue(edge.to);
            }
        }
    }
    // No path exist or time is up, return empty path with cost = -1
    return result;
}
