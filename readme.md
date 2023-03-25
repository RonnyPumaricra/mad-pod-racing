# Using the classes API

All methods that receive an object won't make a copy of them, so deestructure them using `deepCopy()`. `deepcopy()` doesn't copy arrays though.

Methods that return a boolean value don't modify the object.

## Class `TargetStore`

List the Targets, and save information for each one.

```ts
class TargetStore {
  allTargets: Target[] = [];
  private isClosed = false;
}
```

### Type `Target`

```ts
interface AdditionalTargetData {
  distance?: pixelDistance;
  angle?: hexadecimalAngle;
}

interface Target {
  checkpoint: Coordinate; // Updated on first round
  info: AditionalTargetData;
  index: zeroIndex;
}
```

- `checkpoint` and `index`: Constants defined only during the first round

- `info`: Additional info for each target

### Accesing to data

In order to preserve Target position in `allTargets`, it has an index property. Useful for some Array methods, like `.reduce()` or `.filter()`

- `allTargets` data is always readable. Add new targets through `TargetStore.addTarget()`.

- `allTargets` data is accesible by `TargetStore[index].info`

### Accessing conditionally

To get the target with the longest distance, use `.targetWithLargestDistance()`.

## Class `GameController`

Saves last loop state and listens events based on the state

```ts
interface GameState {
  target: Target;
  round: number;
  index: zeroIndex;
}

class GameController {
  prevState: GameState;
  state: GameState;
}
```

### Updating the state

`.checkTargetChange(targetCoords)` will:

1. Check if the previous `targetCoords` changed

   - If changed, update `state`
   - Updates `hasTargetChanged`

2. Set last iteration `state` as `prevState`

During the first loop there is no prevState, but will trigger a target change.

During the second loop, prevState will be updated for the first time.

```ts
// Once, on the start of the loop
GameController.setCurrentState();
```

### Accessing the state

The state object has:

- target

- round & index

### TargetStore reference

This reference is used so `GameController` handles all the logic for adding new targets.

### Event handling

When an event is triggered, the corresponding boolean property will set to `true`.

```ts
if (GameController.changedTarget) {
  // Event logic
}
```

### Ideal direction to aim for

The aiming point to return should be the desired target. In order to improve aiming, it will be rotated some distance:

```js
/* Rotate a point from the origin point */
x = cos(a) * target.x - sin(a) * target.y;
x = sin(a) * target.x + cos(a) * target.y;
```

The rotation angle will be exaggerated when `nextCheckpointAngle` is large, and minimized when it is small. It should not make the pod rotate in the other direction.

PD. Math.cos uses radians.

# Nominal types

This project uses branding as a workaround for nominal types.

```ts
type DistanceInKM = number & { __brand: "A" };

// Casting for assignment
const lenght: DistanceInKM = 15 as DistanceInKM;
```
