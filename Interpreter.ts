///<reference path="World.ts"/>
///<reference path="Parser.ts"/>
///<reference path="SVGWorld.ts"/>
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

        // Command handler
        if (cmd.command === "take") {

            // Find source objects that match the entity
            srcObjs = findObjects(cmd.entity, state, true);

            for(let src of srcObjs)
              interpretation.push([{polarity: true,
                  relation: "holding", args: [src]}]);

        }
        else if (cmd.command === "where") {

            // Select function depending on if we are using online or offline
            let fun : (s:string) => any = (typeof state.parent !== "undefined") ?
                (x => {state.parent.printSystemOutput(x);}) : (x => {throw x;});

            // If the object is floor
            if (cmd.entity.object.form === 'floor')
                fun("The floor is under every object in this world");

            // Find every object with definition
            srcObjs = findObjects(cmd.entity, state, true);

            // Return string
            let returnString : string = "";

            // For every source object
            srcObjs.forEach(
                function(src,i,_) {

                    // Is source equal to holding?
                    if (src === state.holding)
                        returnString += "\n\nNr: " + (i+1) + " is hold in the sky!\n"
                    else {

                    // Find the position of the object
                    let pos : Pos = findPos(src,state.stacks);

                    // Function that gets definition from position
                    let findObjDef = (x:number,y:number) =>
                        (!state.stacks[pos.x+x]) ? null:
                        state.objects[state.stacks[pos.x+x][pos.y+y]];

                    // Find the definitions of the nearby objects
                    let left = findObjDef(-1,0);
                    let right = findObjDef(1,0);
                    let below = (pos.y <= 0) ? null : findObjDef(0,-1);
                    let upwards = (state.stacks[pos.x].length &&
                        pos.y >= state.stacks[pos.x].length-1) ? null : findObjDef(0,1);

                    // Function that forms a string from objectdefinition
                    let objectDefToStr = (obj : ObjectDefinition) => {
                        let [form,size,color] = [obj.form,obj.size,obj.color]
                        let str :string = "object that has ";
                        str += ((!form) ? "" : "the form " + form + ", ")+
                               ((!size) ? "" : "the size " + size + ", ")+
                               ((!color) ? "" : "the color " + color + ", ");

                        return (!form && !size && !color) ? "" : str;
                    }

                    // Formulate a string for leftside
                    let leftSide = "There is "+((!left) ? (
                        (pos.x <= 0) ? "a wall " : "nothing directly " )  : "an " +
                        objectDefToStr(left))+"to the left.\n";

                    // Formulate a string for rightside
                    let rightSide = "There is "+((!right) ? (
                        (pos.x >= state.stacks.length-1) ? "a wall " : "nothing directly " ) : "an " +
                        objectDefToStr(right))+"to the right.\n";

                    // Formulate a string for under the object
                    let under = (!below) ? "The floor is under it!\n" :
                        "Direct under there is an "+objectDefToStr(below)+"way down is lava.\n";

                    // Formulate a string for over the object
                    let over = (!upwards) ? "There is no object on it!\n" :
                        "Ontop there is an "+objectDefToStr(upwards)+"way up is the sky.\n";

                    // Formulate a string for the position of the object
                    let posString = "position "+ (pos.x+1) +" from the left wall and "+ (pos.y+1) +
                        " up from the floor.\n";

                    // Add strings to resultstring
                    returnString+= "\n\nNr: " + (i+1) +" of that object definition is at \n"+
                                    posString + rightSide + leftSide + under + over;
                    }
            });

            // Call for print function
            fun(returnString);
            throw "question";
        }
        else if (cmd.command === "put") {

            // Find destination objects that match the entity of location
            dstObjs = findObjects(cmd.location.entity, state, false);
            interpretation = [[{polarity: true, relation: loc.relation,
            args: [state.holding, dstObjs[0]]}]];

        } else if (cmd.command === "move") {
            // Find source & destination objects that match the entities
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

                    /* Varibles used
                        - Position in stack (x , y)
                        - Objectdefinition
                        - the variable filter which is partially responsible
                          for filtering out the source
                    */
                    let srcPos = findPos(src,state.stacks);
                    let src_obj : ObjectDefinition = state.objects[src];
                    let filter : boolean  = true;

                    for (let dst of dstObs){
                        let dstPos = findPos(dst,state.stacks);
                        let dst_obj : ObjectDefinition = state.objects[dst];

                        // If the destination ain't floor and filterDst holds remove dst
                        if (dst !== "floor" && filterDst(loc.relation,src_obj,dst_obj))
                            hash.setValue(src, dstObs = dstObs.filter(x => x !== dst));

                        // If all results from filterFun is true then we must remove the source
                        filter = filter && filterFun(loc.relation,srcPos, dstPos, dst === 'floor');

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
    ) : string[]
    {
        /* Set variables
            - We want the object with definitions, so need to check if entity
              object is complex.
            - if it is complex we take the nested object otherwise we just take
              the object as it is.
        */
        let obj : Parser.Object = entity.object;
        let isComplex = obj.location != null;
        let real = isComplex ? obj.object : obj;

        // Get Definition
        let [objForm, objColor, objSize] = [real.form, real.color, real.size];
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
        objects = objects.filter( src => {
            return loc_objects.some( dst => {
                return filterFun(loc_relation,findPos(src,state.stacks),
                  findPos(dst,state.stacks), dst === 'floor');
            });
        });

        // Have we anything to return?
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
        // Small objects cannot support large objects.
        let toSmall = src.size === "large" && dst.size === "small";

        // Boxes cannot contain pyramids, planks or boxes of the same size.
        let boxCon = dst.form === "box" &&
            (src.form === "pyramid" || src.form === "plank" || src.form === "box") &&
            src.size === dst.size;

        // Balls cannot support anything.
        let ballCon = dst.form === "ball";

        // Small boxes cannot be supported by small bricks or pyramids.
        let brickPyrCon = src.form === "box" &&
            (dst.form === "brick" || dst.form === "pyramid") &&
            dst.size === "small"

        // Large boxes cannot be supported by large pyramids.
        let largeBoxPyrCon = src.form === "box" && src.size === "large" &&
            dst.form === "pyramid" && dst.size === "large"

        // Balls must be in boxes or on the floor, otherwise they roll away.
        let ballBoxCon = src.form === "ball" && !(dst.form === "box" || dst.form === "floor")

        return relation === "inside" && (boxCon || toSmall) ||
            relation === "ontop" && (ballCon || toSmall || brickPyrCon || largeBoxPyrCon || ballBoxCon) ||
            relation === "above" && (ballCon || toSmall || brickPyrCon || largeBoxPyrCon)

    }

    // Logic function that is used for filtering
    function filterFun (
      relation : string,
      src : Pos,
      dst : Pos,
      floor : boolean) : boolean
    {
      return (
          relation === "inside"  && (src.x === dst.x && src.y - 1 === dst.y || floor && src.y === 0) ||
          relation === "ontop"   && (src.x === dst.x && src.y - 1 === dst.y || floor && src.y === 0) ||
          relation === "above"   && src.x === dst.x && src.y > dst.y ||
          relation === "under"   && src.x === dst.x && src.y < dst.y) ||
          relation === "beside"  && Math.abs(src.x-dst.x) === 1 ;
    }

    /*
        Interface used for the position of objects in the world
             \_/
                               Λ
                     f         |
         l           m         y
         e   g       k         |
         +---+---+---+---+---+ V
         0   1   2   3   4   5
         <-------- x ------->

    */
    export interface Pos {
        x : number;
        y : number;
    }

    /*
        Function that find the position of object in the world,
        if they do not exist it resturns -100 in both x and y.
    */
    export function findPos(obj : string, st : Stack[] ) : Pos {
        for(let i : number = 0; i < st.length ; i++)
            for(let j : number = 0; j < st[i].length ; j++)
                if (st[i][j] === obj)
                    return {x : i, y: j};

        return {x : -100, y: -100};
    }

}
