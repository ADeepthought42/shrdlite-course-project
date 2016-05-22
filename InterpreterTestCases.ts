module Interpreter {

  export interface TestCase {
      world : string;
      utterance : string;
      interpretations : string[][]
  }

  export var allTestCases : TestCase[] = [];

  allTestCases.push(

      {world: "small",
       utterance: "take an object",
       interpretations: [["holding(e)", "holding(f)", "holding(g)", "holding(k)", "holding(l)", "holding(m)"]]
      },

      {world: "small",
       utterance: "take a blue object",
       interpretations: [["holding(g)", "holding(m)"]]
      },

      {world: "small",
       utterance: "take a box",
       interpretations: [["holding(k)", "holding(l)", "holding(m)"]]
      },

      {world: "small",
       utterance: "put a ball in a box",
       interpretations: [["inside(e,k)", "inside(e,l)", "inside(f,k)", "inside(f,l)", "inside(f,m)"]]
      },

      {world: "small",
       utterance: "put a ball on a table",
       interpretations: []
      },

      {world: "small",
       utterance: "put a ball above a table",
       interpretations: [["above(e,g)", "above(f,g)"]]
      },

      {world: "small",
       utterance: "put a big ball in a small box",
       interpretations: []
      },

      {world: "small",
       utterance: "put a ball left of a ball",
       interpretations: [["leftof(e,f)", "leftof(f,e)"]]
      },

      {world: "small",
       utterance: "take a white object beside a blue object",
       interpretations: [["holding(e)"]]
      },

      {world: "small",
       utterance: "put a white object beside a blue object",
       interpretations: [["beside(e,g) | beside(e,m)"]]
      },

      {world: "small",
       utterance: "put a ball in a box on the floor",
       interpretations: [["inside(e,k)", "inside(f,k)"], ["ontop(f,floor)"]]
      },

      {world: "small",
       utterance: "put a white ball in a box on the floor",
       interpretations: [["inside(e,k)"]]
      },

      {world: "small",
       utterance: "put a black ball in a box on the floor",
       interpretations: [["inside(f,k)"], ["ontop(f,floor)"]]
      },

/*
"put a plank in a box": you return
"inside(c,k) | inside(c,l) | inside(d,k) | inside(d,l) | inside(d,m)",
where you should return "inside(d,k) | inside(d,l)"
*/
      {world: "medium",
       utterance: "put a plank in a box",
       interpretations: [["inside(d,k)","inside(d,l)"]]
      },

/*
"put a large plank in a box": you return
"inside(c,k) | inside(c,l)",
and should not return anything
*/

      {world: "medium",
       utterance: "put a large plank in a box",
       interpretations: []
     },
/*
"put a pyramid in a box": you return
"inside(i,k) | inside(i,l) | inside(j,k) | inside(j,l) | inside(j,m)",
where it shuold be "inside(j,k) | inside(j,l)"
*/

      {world: "medium",
       utterance: "put a pyramid in a box",
       interpretations: [["inside(j,k)","inside(j,l)"]]
      },
/*
"put a box in a box": you return
"inside(k,l) | inside(l,k) | inside(m,k) | inside(m,l)",
and should return "inside(m,k) | inside(m,l)"
*/
      {world: "medium",
       utterance: "put a box in a box",
       interpretations: [["inside(m,k)","inside(m,l)"]]
      },
/*
"put a large box in a box": you return
"inside(k,l) | inside(l,k)",
and should not return anything
*/
      {world: "medium",
       utterance: "put a large box in a box",
       interpretations: []
      },
/*
"put a large box on a large brick": you return
"ontop(k,a) | ontop(l,a)",
but should not return anything
*/
      {world: "medium",
       utterance: "put a large box in a box",
       interpretations: []
      }
  );


  // /* Simple test cases for the ALL quantifier, uncomment if you want */
  // allTestCases.push(
  //     {world: "small",
  //      utterance: "put all balls on the floor",
  //      interpretations: [["ontop(e,floor) & ontop(f,floor)"]]
  //     },

  //     {world: "small",
  //      utterance: "put every ball to the right of all blue things",
  //      interpretations: [["rightof(e,g) & rightof(e,m) & rightof(f,g) & rightof(f,m)"]]
  //     },

  //     {world: "small",
  //      utterance: "put all balls left of a box on the floor",
  //      interpretations: [["leftof(e,k) & leftof(f,k)"], ["ontop(e,floor)"]]
  //     }
  // );


  // /* More dubious examples for the ALL quantifier */
  // /* (i.e., it's not clear that these interpretations are the best) */
  // allTestCases.push(
  //     {world: "small",
  //      utterance: "put a ball in every large box",
  //      interpretations: [["inside(e,k) & inside(f,k)", "inside(e,l) & inside(f,k)",
  //                         "inside(e,k) & inside(f,l)", "inside(e,l) & inside(f,l)"]]
  //     },

  //     {world: "small",
  //      utterance: "put every ball in a box",
  //      interpretations: [["inside(e,k) & inside(f,k)", "inside(e,l) & inside(f,k)",
  //                         "inside(e,k) & inside(f,l)", "inside(e,l) & inside(f,l)",
  //                         "inside(e,k) & inside(f,m)", "inside(e,l) & inside(f,m)"]]
  //     }
  // );

}
