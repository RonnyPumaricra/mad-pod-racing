/** TODO
  - pointsMap
    - Works after the first round
    - Stores position, distance and optimal angle
  - Self rotate
  - Boost during largest distance
  - Optimal angle when arriving to point
**/

/** WARNING
 * - CheckpointInfo.angle should not be relative to pod
 */
interface Coordinates {
  x: number;
  y: number;
}

declare function readline(): string;

/* Number types */
type hexadecimalAngle = number & { __hexadecimalAngleBrand: string };
type pixelDistance = number & { __pixelDistanceBrand: string };
type zeroIndex = number & { __zeroIndexBrand: string };

interface AdditionalTargetData {
  distance?: pixelDistance;
  angle?: hexadecimalAngle;
}

interface Target {
  checkpoint: Coordinates;
  info: AdditionalTargetData;
  index: zeroIndex;
}

interface GameState {
  target: Target;
  round: number;
  index: zeroIndex;
}

class TargetStoreSingleton {
  allTargets: Target[] = [];
  isClosed = false;

  /** Don't need to deestructure the coords */
  addTarget(newTargetCoords: Coordinates): void {
    if (this.isClosed) throw new Error("Don't add targets when closed");
    const newTarget: Target = {
      checkpoint: { ...newTargetCoords },
      info: {},
      index: this.allTargets.length as zeroIndex,
    };
    this.allTargets.push(newTarget);
  }

  close(): void {
    this.isClosed = true;
    this.assignTargetsDistance();
    console.error("CLOSING !important");
  }

  assignTargetsDistance(): void {
    const { allTargets } = this;
    allTargets.forEach((target) => {
      const { length } = allTargets;
      const prevTarget = allTargets[(target.index + length - 1) % length];

      target.info.distance = trigonometricalDistance(
        target.checkpoint,
        prevTarget.checkpoint
      );
    });
  }

  targetWithLargestDistance(): Target {
    return this.allTargets.reduce((a, b) => {
      if (a.info.distance === undefined || b.info.distance === undefined) {
        throw new Error("Missing distance value");
      }

      return Math.max(a.info.distance, b.info.distance) === a.info.distance
        ? a
        : b;
    });
  }
}

class GameControllerSingleton {
  prevState: GameState | undefined;
  state: GameState | undefined;
  // changedTarget: boolean;
  targetStoreReference: TargetStoreSingleton;
  largestDistanceTarget: Target | undefined;
  isThrustAvailable = true;

  constructor(targetStore: TargetStoreSingleton) {
    this.targetStoreReference = targetStore;
  }

  hasNewRoundStarted(newTargetCoords: Coordinates): boolean {
    const { allTargets } = this.targetStoreReference;
    return (
      allTargets.length > 1 &&
      compareCoords(allTargets[0].checkpoint, newTargetCoords)
    );
  }

  private addOrCloseStore(newTargetCoords: Coordinates): void {
    if (this.targetStoreReference.isClosed) {
      return;
    }
    if (this.hasNewRoundStarted(newTargetCoords)) {
      this.targetStoreReference.close();
      this.largestDistanceTarget = TargetStore.targetWithLargestDistance();
    } else {
      this.targetStoreReference.addTarget(newTargetCoords);
    }
  }

  /* And state update as well */
  checkTargetChange(newTargetCoords: Coordinates): void {
    // const deestructuredCoords: Coordinates = {...newtar}
    // this.changedTarget = false;
    if (
      this.prevState === undefined ||
      !compareCoords(this.prevState.target.checkpoint, newTargetCoords)
    ) {
      console.error("TARGET CHANGE DETECTED");
      // this.changedTarget = true;
      // this.addOrCloseStore(deepCopy(newTargetCoords));
      /* Initialize index & round correctly */
      let stateIndex: zeroIndex = -1 as zeroIndex;
      let stateRound = 1;
      if (this.state !== undefined) {
        stateIndex = this.state.index;
        stateRound = this.state.round;
      }
      stateIndex++;

      if (this.hasNewRoundStarted(newTargetCoords)) {
        stateRound++;
        stateIndex = 0 as zeroIndex;
      }
      this.addOrCloseStore(deepCopy(newTargetCoords));

      /* Actually update the state */
      const { allTargets } = this.targetStoreReference;
      const lastTarget = allTargets[allTargets.length - 1];
      console.error(stateRound);
      this.prevState = deepCopy(this.state);
      this.state = {
        target: deepCopy(lastTarget),
        round: stateRound,
        index: stateIndex,
      };
    }
  }

  nextTarget(): Target {
    if (!this.targetStoreReference.isClosed) {
      throw new Error("Should be closed by now");
    }
    if (this.state === undefined) {
      throw new Error("Should have state by now");
    }
    const { allTargets } = this.targetStoreReference;
    const { length } = allTargets;

    return allTargets[(this.state.index + 1) % length];
  }
}

function compareCoords(coord1: Coordinates, coord2: Coordinates): boolean {
  return coord1.x === coord2.x && coord1.y === coord2.y;
}

function inRange<T extends number>(variable: T, range: T): boolean {
  return variable < range && variable > -range;
}

/* Doesn't copy arrays properly */
function deepCopy<Type>(objectwise: Type): Type {
  if (typeof objectwise === "object" && objectwise != null) {
    const copy: Type = {} as Type; // eslint-disable-line
    for (const key in objectwise) copy[key] = deepCopy(objectwise[key]);
    return copy;
  }
  return objectwise;
}

function trigonometricalDistance(
  coord1: Coordinates,
  coord2: Coordinates
): pixelDistance {
  const xDifference = Math.abs(coord1.x - coord2.x);
  const yDifference = Math.abs(coord1.y - coord2.y);
  return Math.pow(
    xDifference * xDifference + yDifference * yDifference,
    0.5
  ) as pixelDistance;
}

const TargetStore = new TargetStoreSingleton();
const GameController = new GameControllerSingleton(TargetStore);

function gameLoop(
  selfCoords: Coordinates,
  currTargetCoords: Coordinates,
  currDist: pixelDistance,
  currAngle: hexadecimalAngle,
  opponentCoords: Coordinates
): string {
  let thrust: number | "BOOST" = 100;

  GameController.checkTargetChange(deepCopy(currTargetCoords));

  if (GameController.state === undefined) {
    throw new Error("Current state should be initialized by now");
  }

  if (currDist < 1100 && currDist >= 600) {
    // 600 -> 110 (min:40,max:100)
    thrust = Math.round((60 * currDist) / 500 - 32);
    // console.error(thrust);
  } else if (currDist < 800) {
    thrust = 40;
  }

  if (currAngle > 90 || currAngle < -90) {
    // thrust = thrust * 0;
    const absAngle = Math.abs(currAngle);
    // thrust = Math.round(thrust * (- (1 / 8100) * (absAngle - 90) * (absAngle - 270)))
    thrust = Math.round(thrust * (-(1 / 8100) * absAngle * (absAngle - 180)));
    // console.error(thrust)
  } else {
    // thrust = thrust * 1;
  }

  console.error(GameController.state);
  console.error("First round");

  if (GameController.state.round === 1) {
    // console.error("First round");
    return `${currTargetCoords.x} ${currTargetCoords.y} ${thrust}`;
  }

  /* Later rounds */
  const { largestDistanceTarget } = GameController;
  if (largestDistanceTarget === undefined) {
    throw new Error("Largest target by distance should be defined by now");
  }
  if (
    GameController.isThrustAvailable &&
    // && TheStore.pointIndex === 3
    largestDistanceTarget.info.distance !== undefined &&
    GameController.state.index === largestDistanceTarget.index &&
    inRange(currAngle, 10 as hexadecimalAngle)
  ) {
    thrust = "BOOST";
    GameController.isThrustAvailable = false;
  }

  /* Look at next objective */
  if (currDist < 800) {
    const nextObjective = GameController.nextTarget();
    return `${nextObjective.checkpoint.x} ${nextObjective.checkpoint.y} ${thrust}`;
  }

  return `${currTargetCoords.x} ${currTargetCoords.y} ${thrust}`;
}

// game loop
while (true) {
  var inputs: string[] = readline().split(" ");
  const x: number = parseInt(inputs[0]);
  const y: number = parseInt(inputs[1]);
  const nextCheckpointX: number = parseInt(inputs[2]); // x position of the next check point
  const nextCheckpointY: number = parseInt(inputs[3]); // y position of the next check point
  const nextCheckpointDist: number = parseInt(inputs[4]); // distance to the next checkpoint
  const nextCheckpointAngle: number = parseInt(inputs[5]); // angle between your pod orientation and the direction of the next checkpoint
  var inputs: string[] = readline().split(" ");
  const opponentX: number = parseInt(inputs[0]);
  const opponentY: number = parseInt(inputs[1]);

  const logValue = gameLoop(
    { x, y },
    {
      x: nextCheckpointX,
      y: nextCheckpointY,
    },
    nextCheckpointDist as pixelDistance,
    nextCheckpointAngle as hexadecimalAngle,
    {
      x: opponentX,
      y: opponentY,
    }
  );

  console.log(logValue);
}
