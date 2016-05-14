///<reference path="World.ts"/>
///<reference path="Parser.ts"/>

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

    function findProp(obj : Parser.Object) : Parser.Object {
      return obj.location != null ? obj.object : obj;
    }

    /*console.log("\n New\nStacks:");
    console.log(state.stacks);
    console.log("\nCommand:");
    console.log(cmd.command);*/
    switch(cmd.command) {
        case "take":
            srcObjs = findObjects(cmd.entity, state);

            if(!srcObjs.length)
              return null;

            for(var i = 0 ; i < srcObjs.length ; i++)
              interpretation.push([{polarity: true, relation: "holding", args: [srcObjs[i]]}]);
            break;
        case "put":
            dstObjs = findObjects(cmd.location.entity, state);

            if(!dstObjs.length)
              return null;

            interpretation = [[{polarity: true, relation: loc.relation,
            args: [state.holding, dstObjs[0]]}]];
            break;
        case "move":
            srcObjs = findObjects(cmd.entity, state);

            if(!srcObjs.length)
              return null;

            dstObjs = findObjects(cmd.location.entity, state);

            if(!dstObjs.length)
              return null;


          for(let src of srcObjs)
            for(let dst of dstObjs)
                if(src !== dst)
                  interpretation.push([{polarity: true, relation: loc.relation,
                   args: [src, dst]}]);
            break;
    }
    return interpretation;
  }
  // Goes through the list of objects and returns the ones matching the arguments.
  //If there is no match it returns an empty string.
  function findObjects(entity : Parser.Entity, state : WorldState) : string[] {
      let obj : Parser.Object = entity.object;
      let isComplex = obj.location != null;
      let asd = isComplex ? obj.object : obj;
      let objForm = asd.form;
      let objColor = asd.color;
      let objSize = asd.size;

      let objects : string[] = Array.prototype.concat.apply([], state.stacks);

      if(state.holding)
          objects.push(state.holding);

      // Filter out all the objects that do not match the given descriptons
      objects = objects.filter(function(y) {
          let x : ObjectDefinition = state.objects[y];
          return ((objForm === x.form || objForm === 'anyform' ) &&
          (objColor === x.color || objColor === null) &&
          (objSize === x.size || objSize === null))
      });

      if(objForm === "floor")
          objects.push("floor");

      if(isComplex) {
          console.log("Before");
          console.log(objects);
          let loc           = obj.location;
          let loc_entity    = loc.entity;
          let loc_relation  = loc.relation;
          let loc_objects   = findObjects(loc_entity,state);
          let loc_quantifier = loc_entity.quantifier;
          let stacks = state.stacks;
          console.log("after");
          console.log(objects);

          loc_objects.sort();

          console.log(loc_objects);
          console.log(loc_relation);
          console.log(loc_quantifier);
          console.log("any"+objects.toString());
          console.log(loc_objects[0]);


          let stacksOfProps = stacks.filter(function(x){
              for(let y of loc_objects) {
                  if (x.indexOf(y) > -1)
                      return true;
              }
                return false;
          });

          switch (loc_relation) {
              case "inside":
                  //filter out those objects that ain't in the
                  break;
              case "ontop":
                  //should only be one, return that one
                  break;
          }
          switch (loc_quantifier) {
              case "any":
                  console.log("any"+objects.toString());
                  break;
              case "the":
                  //should only be one, return that one
                  break;
              }
      }
    return objects;
  }
}


/*
    function isOk(ids : string) : string[] {
        let strs : string[] = [];
        if(hasLoc) {
          var loc = obj.location;
          var stacks = state.stacks;
          console.log(stacks);
          var rel = loc.relation;
          var props = findObjects(loc.entity,state);


          var stacksOfProps = stacks.filter(function(x){
              for(let y of props) {
                  if (x.indexOf(y) > -1)
                      return true;
              }
                return false;
          });

          console.log(rel);
          if (rel === "inside"){
              for(let y of stacksOfProps)
                  strs.push(y.pop());
          } else if (rel === "ontop") {
              for(let y of stacksOfProps) {
                  let k = y.pop();
                  console.log(k);
                  if (k === ids)
                      return true;
              }
                return false;
          } else if (rel === "besides"){

          }
        }
        return true;
    }
*/
