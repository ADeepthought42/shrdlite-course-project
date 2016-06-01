///<reference path="World.ts"/>
///<reference path="Interpreter.ts"/>
///<reference path="Graph.ts"/>
///<reference path="lib/collections.ts"/>

/**
* Planner module
*
* The goal of the Planner module is to take the interpetation(s)
* produced by the Interpreter module and to plan a sequence of actions
* for the robot to put the world into a state compatible with the
* user's command, i.e. to achieve what the user wanted.
*
* The planner should use your A* search implementation to find a plan.
*/
module Planner {

    //////////////////////////////////////////////////////////////////////
    // exported functions, classes and interfaces/types

    /**
     * Top-level driver for the Planner. Calls `planInterpretation` for each given interpretation generated by the Interpreter.
     * @param interpretations List of possible interpretations.
     * @param currentState The current state of the world.
     * @returns Augments Interpreter.InterpretationResult with a plan represented by a list of strings.
     */
    export function plan(interpretations : Interpreter.InterpretationResult[],
      currentState : WorldState) : PlannerResult[] {
        var errors : Error[] = [];
        var plans : PlannerResult[] = [];
        interpretations.forEach((interpretation) => {
            try {
                var result : PlannerResult = <PlannerResult>interpretation;
                result.plan = planInterpretation(result.interpretation, currentState);
                if (result.plan.length == 0) {
                    result.plan.push("That is already true!");
                }
                plans.push(result);
            } catch(err) {
                errors.push(err);
            }
        });
        if (plans.length) {
            return plans;
        } else {
            // only throw the first error found
            throw errors[0];
        }
    }

    export interface PlannerResult extends Interpreter.InterpretationResult {
        plan : string[];
    }

    export function stringify(result : PlannerResult) : string {
        return result.plan.join(", ");
    }

    //////////////////////////////////////////////////////////////////////
    // private functions

     /**
      * The core planner function. The code here is just a template;
      * you should rewrite this function entirely. In this template,
      * the code produces a dummy plan which is not connected to the
      * argument `interpretation`, but your version of the function
      * should be such that the resulting plan depends on
      * `interpretation`.
      *
      *
      * @param interpretation The logical interpretation of the user's desired goal. The plan needs to be such that by executing it, the world is put into a state that satisfies this goal.
      * @param state The current world state.
      * @returns Basically, a plan is a
      * stack of strings, which are either system utterances that
      * explain what the robot is doing (e.g. "Moving left") or actual
      * actions for the robot to perform, encoded as "l", "r", "p", or
      * "d". The code shows how to build a plan. Each step of the plan can
      * be added using the `push` method.
      */

    /*
        State is the Node class used in a*.
        Holds information about the world.
    */
    class State {
        constructor(st : State | WorldState){
            this.stacks = st.stacks.map(x => x.slice());
            this.holding = st.holding;
            this.arm = st.arm;
        };

        stacks: Stack[];

        holding: string;

        arm: number;

        compareTo(other: State) : number {
            return 0;
        }
        toString() : string {
            return collections.makeString(this);
        }
    }

    /*
        PlanGraph is the Graph type used to build a graph that we can use in A*.
        Implements the interface Graph from the file with the same name,
        the functions outgoingEdges & compareNodes is defined and configured to
        the class State.
    */
    class PlanGraph implements Graph<State>{
        //TODO
        objects: { [s:string]: ObjectDefinition; };
        constructor(state : WorldState){this.objects = state.objects;};


        outgoingEdges(state : State) : Edge<State>[] {
            let edges : Edge<State>[] = [];

            if(state.arm > 0) {
                let s = new State(state);
                s.arm--;
                edges.push({from: state, to: s, cost: 1});
            }
            if(state.arm < state.stacks.length-1) {
                let s = new State(state);
                s.arm++;
                edges.push({from: state, to: s, cost: 1});
            }
            if (!state.holding && state.stacks[state.arm] != null) {
                let s = new State(state);
                s.holding = s.stacks[s.arm].pop();
                if (typeof s.stacks[s.arm] === "undefined")
                    s.stacks[s.arm] = [];
                edges.push({from: state, to: s, cost: 1});
            } else if(state.holding) {
                let s = new State(state);
                if (!s.stacks[s.arm])
                    s.stacks[s.arm] = [];
                let fun = Interpreter.filterDst;
                let dstStack = s.stacks[s.arm];
                let src = this.objects[state.holding];
                let dst = this.objects[dstStack[dstStack.length-1]];
                if (dstStack[dstStack.length-1] !== "floor" &&
                    typeof dst !== "undefined" &&  typeof src !== "undefined")
                {
                    if(!fun("ontop",src,dst) && !fun("inside",src,dst)) {
                        s.stacks[s.arm].push(s.holding);
                        s.holding = null;
                        edges.push({from: state, to: s, cost: 1});
                    }
                } else {
                    s.stacks[s.arm].push(s.holding);
                    s.holding = null;
                    edges.push({from: state,
                    to: s,
                    cost: 1});
                }
            }
            return edges;
        }

        compareNodes(a : State, b : State) : number {
            return a.compareTo(b);
        }
    }

    /*
        CheckLit is a function that checks whether the literal is legit in the
        given state or not
    */
    function checkLit(lit : Interpreter.Literal,
     state : State): boolean
    {
        let rel = lit.relation;
        let src : Interpreter.Pos = Interpreter.findPos(lit.args[0],state.stacks);
        let dst : Interpreter.Pos = Interpreter.findPos(lit.args[1],state.stacks);
        let onFloor :boolean;

        if (typeof state.stacks[state.arm] !== "undefined")
            onFloor = (lit.args[1] === "floor" &&
            state.stacks[state.arm][0] === lit.args[0]);
        else
            onFloor = false;

        return onFloor ||
        (rel === "holding" && state.holding === lit.args[0]) || !state.holding && (
        (rel === "inside" && src.x === dst.x && (src.y - 1) === dst.y) ||
        (rel === "ontop" && src.x === dst.x && (src.y - 1) === dst.y) ||
        (rel === "above" && src.x === dst.x && src.y > dst.y) ||
        (rel === "under" && src.x === dst.x && src.y < dst.y) ||
        (rel === "leftof" && src.x < dst.x && src.x > -1) ||
        (rel === "rightof" && src.x > dst.x && dst.x > -1 && src.x < state.stacks.length) ||
        (rel === "beside" && Math.abs(src.x-dst.x) === 1));
    }

    //TODO Heuristic function (n:Node) => number
    //TODO @Param ?
    // interpretation : Interpreter.DNFFormula,
    // state : WorldState
    function heuristic(lits:Interpreter.Literal[]) : (n:State) => number {
        return (n : State) => {

            var h : number = 0;

            var sObj : Interpreter.Pos = null;
            var dObj : Interpreter.Pos = null;

            var lit : Interpreter.Literal = lits[0];

            sObj = Interpreter.findPos(lit.args[0], n.stacks);
            dObj = Interpreter.findPos(lit.args[0], n.stacks);

            if(lit.relation === "holding" || lit.relation === "above"){
                if(n.holding !== lit.args[0])
                    h = calculateH(sObj, n);

            } else if(lit.relation === "rightof" ||
                lit.relation === "leftof" ||
                lit.relation === "beside") {

                if(n.holding !== lit.args[0])
                    h = calculateH(sObj, n);

            } else if(lit.relation === "inside" ||
                lit.relation === "ontop" ||
                lit.relation === "under") {

                if(n.holding !== lit.args[0])
                    h = calculateH(sObj, n);

                h += calculateH(dObj, n);
            }
            // console.log("HEURISTIC " + h);
            return h;
        };
    }

    function calculateH(objPos : Interpreter.Pos, state : State) : number{

        var penalty : number = 5;
        var h : number = 0;
        var diff : number = 0;
        //var dist : number = 0;
        // Distance from arm to source object

        //dist = Math.abs(state.arm - objPos.x);
        //h = dist;

        // How many objects are above the object in the stack?

        if(state.stacks[objPos.x] != null)
            diff = (state.stacks[objPos.x].length - 1) - objPos.y;

        // If there are objects above the object, add penalty
        // for each object.
        if(diff > 0)
            h += diff * penalty;

        return h;
    }

    // A* result must be converted to string []
    //TODO SearchResult<Node> to string []
    function interpret(result : SearchResult<State>) : string [] {

        // Only need path?
        let path : State[]  = result.path;

        // The plan that we will return
        let plan : string[] = [];

        for (var i = 0; i < path.length - 1; i++) {
            var cs : State = path[i];
            var ns : State = path[i+1];

            if(ns.arm < cs.arm)
                plan.push("l");
            else if(ns.arm > cs.arm)
                plan.push("r");
            else if(ns.holding && !cs.holding)
                plan.push("p");
            else if(!ns.holding && cs.holding)
                plan.push("d");
        }
        return plan;
    }

    function planInterpretation(
        interpretation : Interpreter.DNFFormula,
        state : WorldState) : string[]
    {
        let algorithmResult =
            aStarSearch<State>(
                // Graph
                new PlanGraph(state),
                // State from WorldState
                new State(state),
                // Goal function
                (st : State) => {
                return interpretation[0].every( lit => checkLit(lit, st) );
                },
                // Heuristsic function
                heuristic(interpretation[0]),
                // Timeout in seconds
                10
            );

        return interpret(algorithmResult);
    }

    /* Manhattan distance */
    function manhattan(lit : Interpreter.Literal, state : State) : number {

        // If we are at goal return 0
        if (checkLit(lit, state))
            return 0;

        // Result we want to return
        let result :number = 0;

        // penalty used for heights
        var penalty : number = 5;

        // Get the objects id's
        let [src,dst] = lit.args;

        /*
            If object exist and is not floor then we find the position of object
            otherwise we get a good position on the floor.
        */
        let funPos = (obj : string) => (obj && obj !== "floor") ? Interpreter.findPos(obj, state.stacks) : findBestFloorPos();

        // Find position for src
        let srcPos = funPos(src);

        let dstPos = funPos(dst);

        let diffX = Math.abs(srcPos.x - dstPos.x);

        //let diffY =

        return result;

        /* ------------- private functions ------------- */

        function findBestFloorPos() : Interpreter.Pos {
            let [_,pos] = state.stacks.reduce(
                function(returnState, stack, x) {
                    let [previousValue,bestPos] = returnState;
                    let heightCost = penalty * stack.length;
                    let distanceFromArm = Math.abs(state.arm - x);
                    let currentCost = distanceFromArm + heightCost;
                    return (currentCost < previousValue) ? [currentCost, x] : returnState;
            }, [Number.MAX_VALUE,Number.MIN_VALUE]);
            return {x : pos, y : 0};
        }
    }

}
