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
            class State {
              constructor(st : State | WorldState){
                this.stacks = st.stacks.map(x => x.slice());
                this.holding = st.holding;
                this.arm = st.arm;
              };
              stacks: Stack[];
              /** Which object the robot is currently holding. */
              holding: string;
              /** The column position of the robot arm. */
              arm: number;

              compareTo(other: State) : number {
                  return 0;
              }
              toString() : string {
                return collections.makeString(this);
              }
            }

             //TODO class that implements interface Graph<Node>
             class PlanGraph implements Graph<State>{
                 //TODO
                 constructor(){};

                 //TODO outgoingEdges(node : Node) : Edge<Node>[];
                 outgoingEdges(state : State) : Edge<State>[] {
                     let edges : Edge<State>[] = [];
                     console.log(state.arm);
                     if (typeof state.stacks == "undefined")
                      throw "asdasdasdasd"
                     if(state.arm > 0) {
                         let s = new State(state);
                         s.arm--;
                         edges.push({from: state,
                                     to: s,
                                     cost: 1});
                     }
                     if(state.arm < state.stacks.length) {
                         let s = new State(state);
                         s.arm++;
                         edges.push({from: state,
                                     to: s,
                                     cost: 1});
                     }
                     if (!state.holding && state.stacks[state.arm] != null) {
                         let s = new State(state);
                        // console.log(s.stacks[s.arm].length);
                         s.holding = s.stacks[s.arm].pop();
                         edges.push({from: state,
                                     to: s,
                                     cost: 1});
                     } else if(state.holding) {
                         let s = new State(state);
                         if (!s.stacks[s.arm])
                          s.stacks[s.arm] = [];
                         s.stacks[s.arm].push(s.holding);
                         s.holding = null;
                         edges.push({from: state,
                                     to: s,
                                     cost: 1});
                     }
                     return edges;
                 }

                 compareNodes(a : State, b : State) : number {
                         return a.compareTo(b);
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
             for(let i : number = 0; i < st.stacks.length ; i++)
                 for(let j : number = 0; j < st.stacks[i].length ; j++)
                     if (st.stacks[i][j] === obj)
                         return {x : i, y: j};

             return {x : -2, y: -2};
         }

         //TODO Heuristic function (n:Node) => number
             //TODO @Param ?
                 // interpretation : Interpreter.DNFFormula,
                 // state : WorldState
         function heuristic(lits:Interpreter.Literal[]) : (n:State) => number {
             return (n : State) => {

                 var h : number = 0;

                 var sObj : Pos = null;
                 var dObj : Pos = null;


                 var lit : Interpreter.Literal = lits[0];

                 sObj = findPos(lit.args[0], n);
                 dObj = findPos(lit.args[0], n);

                 if(lit.relation === "holding" || lit.relation === "above"){
                    h = calculateH(sObj, n);

                 } else if(lit.relation === "rightof" ||
                           lit.relation === "leftof" ||
                           lit.relation === "beside"){

                     h = calculateH(sObj, n);
                 } else if(lit.relation === "inside" ||
                           lit.relation === "ontop" ||
                           lit.relation === "under"){
                     h = calculateH(sObj, n);

                     h += calculateH(dObj, n);
                 }

                 return h;
             };
         }

         function calculateH(objPos : Pos, state : State) : number{

             var penalty : number = 5;
             var h : number = 0;
             var diff : number = 0;
             //var dist : number = 0;
             // Distance from arm to source object
             
             //dist = Math.abs(state.arm - objPos.x);
             //h = dist;

             // How many objects are above the object in the stack?
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
       return interpret(
              aStarSearch<State>(
              // Graph
               new PlanGraph(),
               // State from WorldState
               new State(state),
               // Goal function
               (state : State) => {
                 return interpretation[0].every( lit => checkLit(lit, state) );
               },
               // Heuristsic function
               heuristic(interpretation[0]),
               // Timeout in seconds
               1
           ));
     }
 }
