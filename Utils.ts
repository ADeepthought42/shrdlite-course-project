/**
 * The floor can support at most N objects (beside each other).
 * All objects must be supported by something.
 * The arm can only hold one object at the time.
 * The arm can only pick up free objects.
 * Objects are “inside” boxes, but “ontop” of other objects.
 * Balls must be in boxes or on the floor, otherwise they roll away.
 * Balls cannot support anything.
 * Small objects cannot support large objects.
 * Boxes cannot contain pyramids, planks or boxes of the same size.
 * Small boxes cannot be supported by small bricks or pyramids.
 * Large boxes cannot be supported by large pyramids.
 */

export enum Shape {
    box = 1,
    brick = 1 << 1,
    pyramid = 1 << 2,
    ball = 1 << 3,
    floor = 1 << 4,

    small = 1 << 5,
    big = 1 << 6
}

export enum Support {
    floor = Shape.box | Shape.brick | Shape.pyramid | Shape.ball | Shape.small | Shape.big,
    ball = 0,
    pyramid = 0,
    brick = Shape.box | Shape.pyramid | Shape.brick
}
// this is implemented as checking, e.g. result = Shape["floor"] & CanSupport["ball"]
export enum CanSupport {
    floor = 0,
    ball = Shape.floor | Shape.box,
    pyramid = Shape.floor | Shape.brick | Shape.brick,
    brick = Shape.floor | Shape.brick
}
