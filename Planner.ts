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

      //TODO Integration with A* search algorithm and the world
         //TODO Define Graph & Node in our world
             //TODO Define Node
                 // We call it Node for the simplicity
            class State implements WorldState {
              constructor(st : State){
                this.stacks = st.stacks.map(x => x.slice());
                this.holding = st.holding;
                this.arm = st.arm;
                this.objects = st.objects;
                this.examples = st.examples;
              };
              stacks: Stack[];
              /** Which object the robot is currently holding. */
              holding: string;
              /** The column position of the robot arm. */
              arm: number;
              /** A mapping from strings to `ObjectDefinition`s. The strings are meant to
              be identifiers for the objects (see ExampleWorlds.ts for an example). */
              objects: { [s:string]: ObjectDefinition; };
              /** List of predefined example sentences/utterances that the user can choose
              from in the UI. */
              examples: string[];

            }

             //TODO class that implements interface Graph<Node>
             class PlanGraph implements Graph<State>{
                 //TODO
                 constructor(){};

                 //TODO outgoingEdges(node : Node) : Edge<Node>[];
                 outgoingEdges(state : State) : Edge<State>[] {
                     let edges : Edge<State>[] = [];

                     if(state.arm > 0) {
                         let e = new Edge<State>();
                         e.from = state;
                         let s = new State(state);
                         s.arm--;
                         e.to = s;
                         e.cost = 1;
                         edges.push(e);
                     }
                     if(state.arm < state.stacks.length) {
                         let e = new Edge<State>();
                         e.from = state;
                         let s = new State(state);
                         s.arm++;
                         e.to = s;
                         e.cost = 1;
                         edges.push(e);
                     }
                     if (!state.holding && state.stacks[state.arm].length > 0) {
                         let e = new Edge<State>();
                         e.from = state;
                         let s = new State(state);
                         s.holding = s.stacks[s.arm].pop();
                         e.to = s;
                         e.cost = 1;
                         edges.push(e);
                     } else if(state.holding) {
                         let e = new Edge<State>();
                         e.from = state;
                         let s = new State(state);
                         s.stacks[s.arm].push(s.holding);
                         s.holding = "";
                         e.to = s;
                         e.cost = 1;
                         edges.push(e);
                     }

                     return edges;
                 }

                 //TODO compareNodes : collections.ICompareFunction<Node>;
                 compareNodes : collections.ICompareFunction<State> =
                     (a : State, b : State) : number => {
                         return 0;
                     };
             }


         //TODO Goal function (n:Node) => boolean
             //TODO @Param ?
                 // interpretation : Interpreter.DNFFormula,
                 // state : WorldState
         function goal(conjunctions : Interpreter.DNFFormula)
             : (n : State) => boolean
         {
             return (state : State) => {
                 let con = conjunctions[0];
                 let b :boolean = true;
                 for(let lit of con)
                     b = b && checkLit(lit,state);
                 return b;
             };
         }

         function checkLit(lit : Interpreter.Literal,
             state : State): boolean
         {
             let rel = lit.relation;
             let a : Pos = findPos(lit.args[0],state);
             let b : Pos = findPos(lit.args[1],state);

             return (rel === "holding" && state.holding === lit.args[0]) ||
                 (rel === "inside" && a.x === b.x && (a.y - 1) === b.y) ||
                 (rel === "above" && a.x === b.x && a.y > b.y) ||
                 (rel === "under" && a.x === b.x && a.y < b.y) ||
                 (rel === "leftof" && a.x < b.x) ||
                 (rel === "rightof" && a.x > b.x) ||
                 (rel === "beside" && Math.abs(a.x-b.x) === 1);
         }

         interface Pos {
             x : number;
             y : number;
         }

         function findPos(obj : string, st : State) : Pos {
             for(let i : number = 0; i < st.stacks.length ; i++){
                 for(let j : number = 0; j < st.stacks[i].length ; j++) {
                     if (st.stacks[i][j] === obj) {
                         return {x : i, y: j};
                     }
                 }
             }
             return {x : -2, y: -2};
         }

         //TODO Heuristic function (n:Node) => number
             //TODO @Param ?
                 // interpretation : Interpreter.DNFFormula,
                 // state : WorldState
         function heuristic() : (n:State) => number {
             return (n : State) => {
                 return 0;
             };
         }

         //TODO timeout set
             //TODO @Param ?
         function timeout() : number {
             return 10;
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
             else
                 throw "";
         }

         return plan;
     }

     function planInterpretation(
         interpretation : Interpreter.DNFFormula,
         state : WorldState) : string[]
     {
       var cloneObj = new State(<State>state);
       let t = new PlanGraph();
       let k = aStarSearch<State>(
           // TODO Assign parameters to those that needs it
           t,
           new State(cloneObj),
           goal(interpretation),
           heuristic(),
           timeout()
       );

       let f = goal(interpretation);
       console.log(k);
       return interpret(k);
     }
 }
