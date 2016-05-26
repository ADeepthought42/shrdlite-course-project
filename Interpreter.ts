///<reference path="World.ts"/>
///<reference path="Parser.ts"/>
///<reference path="lib/collections.ts"/>

/**
* Interpreter module
*
* The goal of the Interpreter module is to interpret a sentence
* written by the user in the context of the current world state. In
* particular, it must figure out which objects in the world,
* i.e. which elements in the `objects` field of WorldState, correspond
* to the ones referred to in the sentence.
*
* Moreover, it has to derive what the intended goal state is and
* return it as a logical formula described in terms of literals, where
* each literal represents a relation among objects that should
* hold. For example, assuming a world state where "a" is a ball and
* "b" is a table, the command "put the ball on the table" can be
* interpreted as the literal ontop(a,b). More complex goals can be
* written using conjunctions and disjunctions of these literals.
*
* In general, the module can take a list of possible parses and return
* a list of possible interpretations, but the code to handle this has
* already been written for you. The only part you need to implement is
* the core interpretation function, namely `interpretCommand`, which produces a
* single interpretation for a single command.
*/
module Interpreter {

  //////////////////////////////////////////////////////////////////////
  // exported functions, classes and interfaces/types

/**
Top-level function for the Interpreter. It calls `interpretCommand` for each
possible parse of the command. No need to change this one.
* @param parses List of parses produced by the Parser.
* @param currentState The current state of the world.
* @returns Augments ParseResult with a list of interpretations. Each
  interpretation is represented by a list of Literals.
*/
    export function interpret(parses : Parser.ParseResult[],
        currentState : WorldState) : InterpretationResult[] {
            var errors : Error[] = [];
            var interpretations : InterpretationResult[] = [];
            parses.forEach((parseresult) => {
                try {
                    var result : InterpretationResult = <InterpretationResult>parseresult;
                    result.interpretation = interpretCommand(result.parse, currentState);
                    interpretations.push(result);
                } catch(err) {
                    errors.push(err);
                }
            });
            if (interpretations.length) {
                return interpretations;
            } else {
              // only throw the first error found
                throw errors[0];
            }
    }

    export interface InterpretationResult extends Parser.ParseResult {
        interpretation : DNFFormula;
    }

    export type DNFFormula = Conjunction[];
    type Conjunction = Literal[];

  /**
  * A Literal represents a relation that is intended to
  * hold among some objects.
  */
    export interface Literal {
  /** Whether this literal asserts the relation should hold
   * (true polarity) or not (false polarity). For example, we
   * can specify that "a" should *not* be on top of "b" by the
   * literal {polarity: false, relation: "ontop", args:
   * ["a","b"]}.
   */
    polarity : boolean;
  /** The name of the relation in question. */
    relation : string;
  /** The arguments to the relation. Usually these will be either objects
   * or special strings such as "floor" or "floor-N" (where N is a column) */
    args : string[];
  }

    export function stringify(result : InterpretationResult) : string {
        return result.interpretation.map((literals) => {
            return literals.map((lit) => stringifyLiteral(lit)).join(" & ");
            // return literals.map(stringifyLiteral).join(" & ");
        }).join(" | ");
    }

    export function stringifyLiteral(lit : Literal) : string {
        return (lit.polarity ? "" : "-") + lit.relation + "(" + lit.args.join(",") + ")";
    }

  //////////////////////////////////////////////////////////////////////
  // private functions
  /**
   * The core interpretation function. The code here is just a
   * template; you should rewrite this function entirely. In this
   * template, the code produces a dummy interpretation which is not
   * connected to `cmd`, but your version of the function should
   * analyse cmd in order to figure out what interpretation to
   * return.
   * @param cmd The actual command. Note that it is *not* a string, but rather
    an object of type `Command` (as it has been parsed by the parser).
   * @param state The current state of the world. Useful to look up objects in the world.
   * @returns A list of list of Literal, representing a formula in disjunctive
   normal form (disjunction of conjunctions). See the dummy interpetation returned in the
   code for an example, which means ontop(a,floor) AND holding(b).
   */

    function interpretCommand(cmd : Parser.Command, state : WorldState) : DNFFormula {
        let interpretation : DNFFormula = [];
        let srcObjs : string[] = [];
        let dstObjs : string[] = [];
        let loc = cmd.location;

        console.log(cmd.entity);

        // Command handler
        if (cmd.command === "take") {
            srcObjs = findObjects(cmd.entity, state, true);
            for(let src of srcObjs)
              interpretation.push([{polarity: true,
                  relation: "holding", args: [src]}]);

        } else if (cmd.command === "put") {
            dstObjs = findObjects(cmd.location.entity, state, false);
            interpretation = [[{polarity: true, relation: loc.relation,
            args: [state.holding, dstObjs[0]]}]];

        } else if (cmd.command === "move") {
            srcObjs = findObjects(cmd.entity, state, true);
            dstObjs = findObjects(cmd.location.entity, state, false);

            // Need a Dictionary to differate the destination from sources
            let hash : collections.Dictionary<string,string[]> =
                new collections.Dictionary<string,string[]>();

            // Instantiate the Dictionary
            for(let src of srcObjs)
              hash.setValue(src,dstObjs);

            // Complex datatype?
            let isSrcComplex = cmd.entity.object.location != null;
            let isDstComplex = cmd.location.entity.object.location != null;
            if (!isSrcComplex && !isDstComplex)
                hash.forEach(src => {
                    let dstObs = hash.getValue(src);

                    // Remove all cases where dst are equal to src
                    hash.setValue(src, dstObs = dstObs.filter(x => x !== src));

                    let src_obj : ObjectDefinition = state.objects[src];
                    let filter : boolean  = false;

                    for (let dst of dstObs)
                        for (let stack of state.stacks) {
                            let [ystack,xstack] = [stack.indexOf(src), stack.indexOf(dst)];
                            let dst_obj : ObjectDefinition = state.objects[dst];

                            //Objects are “inside” boxes, but “ontop” of other objects.
                            if (dst !== "floor")
                              if(filterDst(loc.relation,src_obj,dst_obj))
                                   hash.setValue(src, dstObs = dstObs.filter(x => x !== dst));

                            filter = filterFun(loc.relation,ystack, xstack, dst === 'floor');

                      }

                      // Filter out all elements that does match the source
                      if (filter || !dstObs.length)
                        hash.remove(src);
                });

            if(hash.isEmpty())
                throw "Hashtable in interpretCommand is empty";

            // Add literal to list of interpretations
            hash.forEach(src => {
                hash.getValue(src).forEach(dst => {
                    interpretation.push([{polarity: true, relation: loc.relation,
                        args: [src, dst]}]);
                });
            });

        }
        return interpretation;
    }

    // Goes through the list of objects and returns the ones matching the arguments.
    //If there is no match it returns an empty string.
    function findObjects(
      entity : Parser.Entity,
      state : WorldState,
      isSrc : boolean
    ) : string[] {
        let obj : Parser.Object = entity.object;
        let isComplex = obj.location != null;
        let asd = isComplex ? obj.object : obj;
        // Get Definition
        let [objForm, objColor, objSize] = [asd.form, asd.color, asd.size];
        let objects : string[] = Array.prototype.concat.apply([], state.stacks);

        if(state.holding)
            objects.push(state.holding);

        // Filter out all the objects that do not match the given descriptons
        objects = objects.filter(function(y : string) {
            let x : ObjectDefinition = state.objects[y];
            return ((objForm === x.form || objForm === 'anyform' ) &&
                    (objColor === x.color || objColor === null) &&
                    (objSize === x.size || objSize === null))
        });

        // Only dst can push floor
        if(!isComplex && objForm === 'floor' && !isSrc)
            objects.push('floor');

        // We return objects if not complex and not empty
        if(!isComplex)
            if (!objects.length)
                throw "Objects empty";
            else
                return objects;

        // Now we know that it is complex then extract information
        let loc           = obj.location;
        let loc_entity    = loc.entity;
        let loc_relation  = loc.relation;
        let loc_objects   = findObjects(loc_entity,state,false);
        let loc_quantifier = loc_entity.quantifier;

        // Quantifier handler
        if(loc_quantifier === "any") {
          // any of these loc_objects?
        } else if(loc_quantifier === "the" && loc_objects.length !== 1) {
            throw "The Quantifier \"the\" can only refer to a specific object";
        } else if(loc_quantifier === "all" ) {
          // Can this even happen in a complex object?
        }

        // Filter out those objects that ain't in the stack of a object
        objects = objects.filter( y => {
            return loc_objects.some( x => {
                return state.stacks.some( stack => {
                    return filterFun(loc_relation,stack.indexOf(y),
                      stack.indexOf(x), x === 'floor');
                });
            });
        });

        if (!objects.length)
            throw "Fail in the findObjects function: Objects do not exist";

        return objects;
    }

    // if return false then the relation is okay!
    export function filterDst (
      relation : string,
      src : ObjectDefinition,
      dst : ObjectDefinition) : boolean
    {
        //Objects are “inside” boxes, but “ontop” of other objects.
        return (relation === "inside") &&
            // Remove all cases where the target object is not a box
            //(cant put source objects in destination objects that are not boxes)

            /*
            (X)Balls must be in boxes or on the floor, otherwise they roll away.
            (X)Small objects cannot support large objects.
            (X)Boxes cannot contain pyramids, planks or boxes of the same size.
            */
            // Remove all cases where the sizes of source pyramid, plank or box dont fit the destination
            (dst.form !== "box" || (src.form === "pyramid" || src.form === "plank" || src.form === "box") &&
                src.size === dst.size || (src.size === "large" && dst.size === "small"))


        // Objects are “inside” boxes, but “ontop” of other objects.
        || (relation === "ontop") &&
            /*
            (X) Balls cannot support anything.
            (X) Small objects cannot support large objects.
            (X) Small boxes cannot be supported by small bricks or pyramids.
            (X) Large boxes cannot be supported by large pyramids.
            (X) Balls must be in boxes or on the floor, otherwise they roll away.
            */

           // Remove all cases where destination object is a ball
              (dst.form === "ball" || (src.size === "large" && dst.size === "small") ||
               (src.form === "box" && (dst.form === "brick" || dst.form === "pyramid") && dst.size === "small") ||
               (src.form === "box" && src.size === "large" && dst.form === "pyramid" && dst.size === "large") ||
               (src.form === "ball" && dst.form!== "box" && dst.form !== "floor"));


//      || (relation === "above") &&

//      || (relation === "under") &&

//      || (relation === "besides") &&

//      || (relation === "leftOf") &&

//      || (relation === "rightOf") &&

    }

    // Logic function that is used for filtering
    function filterFun (
      relation : string,
      ystack : number,
      xstack :number,
      floor : boolean) : boolean
    {
      return (
          //
          (relation === "inside" && xstack > -1 && ystack > xstack) ||
          // relation in stack and object is ontop
          (relation === "ontop" && (
            xstack > -1 && xstack+1 === ystack || floor && ystack === 0)
          ) ||
          (relation === "above") ||
          (relation === "under") ||
          (relation === "beside") ||
          (relation === "leftOf") ||
          (relation === "rightOf")
        );
    }
}
