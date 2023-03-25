"use strict";
/** TODO
  - pointsMap
    - Works after the first round
    - Stores position, distance and optimal angle
  - Self rotate
  - Boost during largest distance
  - Optimal angle when arriving to point
**/
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var TargetStoreSingleton = /** @class */ (function () {
    function TargetStoreSingleton() {
        this.allTargets = [];
        this.isClosed = false;
    }
    /** Don't need to deestructure the coords */
    TargetStoreSingleton.prototype.addTarget = function (newTargetCoords) {
        if (this.isClosed)
            throw new Error("Don't add targets when closed");
        var newTarget = {
            checkpoint: __assign({}, newTargetCoords),
            info: {},
            index: this.allTargets.length,
        };
        this.allTargets.push(newTarget);
        console.error("Adding target...");
        console.error(newTarget);
    };
    TargetStoreSingleton.prototype.close = function () {
        this.isClosed = true;
        this.assignTargetsDistance();
        console.error("CLOSING !important");
    };
    TargetStoreSingleton.prototype.assignTargetsDistance = function () {
        var allTargets = this.allTargets;
        allTargets.forEach(function (target) {
            var length = allTargets.length;
            var prevTarget = allTargets[(target.index + length - 1) % length];
            target.info.distance = trigonometricalDistance(target.checkpoint, prevTarget.checkpoint);
        });
    };
    TargetStoreSingleton.prototype.targetWithLargestDistance = function () {
        return this.allTargets.reduce(function (a, b) {
            if (a.info.distance === undefined || b.info.distance === undefined) {
                throw new Error("Missing distance value");
            }
            return Math.max(a.info.distance, b.info.distance) === a.info.distance
                ? a
                : b;
        });
    };
    return TargetStoreSingleton;
}());
var GameControllerSingleton = /** @class */ (function () {
    function GameControllerSingleton(targetStore) {
        this.isThrustAvailable = true;
        this.targetStoreReference = targetStore;
    }
    GameControllerSingleton.prototype.hasNewRoundStarted = function (newTargetCoords) {
        var allTargets = this.targetStoreReference.allTargets;
        return (allTargets.length > 1 &&
            compareCoords(allTargets[0].checkpoint, newTargetCoords));
    };
    GameControllerSingleton.prototype.addOrCloseStore = function (newTargetCoords) {
        if (this.targetStoreReference.isClosed) {
            return;
        }
        if (this.hasNewRoundStarted(newTargetCoords)) {
            this.targetStoreReference.close();
            this.largestDistanceTarget = TargetStore.targetWithLargestDistance();
        }
        else {
            this.targetStoreReference.addTarget(newTargetCoords);
        }
    };
    GameControllerSingleton.prototype.setDynamicProps = function (newSelfCoords, newOpponentCoords, newTargetAngle) {
        if (this.state === undefined) {
            throw new Error("State should be already defined");
        }
        this.state.selfCoords = newSelfCoords;
        this.state.opponentCoords = newOpponentCoords;
        this.state.targetAngle = newTargetAngle;
    };
    /* And state update as well */
    /* And state update as well */
    GameControllerSingleton.prototype.checkTargetChange = function (newTargetCoords) {
        // const deestructuredCoords: Coordinates = {...newtar}
        // this.changedTarget = false;
        this.prevState = deepCopy(this.state);
        if (this.prevState === undefined ||
            !compareCoords(this.prevState.target.checkpoint, newTargetCoords)) {
            console.error("TARGET CHANGE DETECTED");
            // this.changedTarget = true;
            // this.addOrCloseStore(deepCopy(newTargetCoords));
            /* Initialize index & round correctly */
            var stateIndex = -1;
            var stateRound = 1;
            if (this.state !== undefined) {
                stateIndex = this.state.index;
                stateRound = this.state.round;
            }
            stateIndex++;
            if (this.hasNewRoundStarted(newTargetCoords)) {
                stateRound++;
                stateIndex = 0;
            }
            this.addOrCloseStore(deepCopy(newTargetCoords));
            /* Actually update the state */
            var allTargets = this.targetStoreReference.allTargets;
            var currentTarget = allTargets[stateIndex];
            console.error(stateRound);
            this.state = {
                target: deepCopy(currentTarget),
                round: stateRound,
                index: stateIndex,
            };
        }
    };
    GameControllerSingleton.prototype.nextTarget = function () {
        if (!this.targetStoreReference.isClosed) {
            throw new Error("Should be closed by now");
        }
        if (this.state === undefined) {
            throw new Error("Should have state by now");
        }
        var allTargets = this.targetStoreReference.allTargets;
        var length = allTargets.length;
        return allTargets[(this.state.index + 1) % length];
    };
    /* Finished */
    GameControllerSingleton.prototype.idealRotatedTarget = function () {
        if (this.state === undefined) {
            throw new Error("State should be already defined");
        }
        var _a = this.state, targetAngle = _a.targetAngle, selfCoords = _a.selfCoords;
        if (targetAngle === undefined) {
            throw new Error("state.targetAngle not defined");
        }
        if (selfCoords === undefined) {
            throw new Error("state.selfCoords not defined");
        }
        /* Fixing: clockwise is positive */
        targetAngle = (targetAngle * -1);
        /** -1 or 1 */
        // const rotatingAngleSign = -targetAngle / targetAngle;
        var denominator = 3;
        var dynamicRotatingAngle = targetAngle / denominator;
        var rotatingAngle;
        /* If targetAngle > 0, then rotating angle < 0 */
        if (targetAngle >= 0) {
            if (dynamicRotatingAngle < 0) {
                throw new Error("dynamicRotatingAngle has wrong sign");
            }
            rotatingAngle = closestToZero(dynamicRotatingAngle, 179 - targetAngle);
        }
        else {
            if (dynamicRotatingAngle > 0) {
                throw new Error("dynamicRotatingAngle has wrong sign");
            }
            rotatingAngle = closestToZero(dynamicRotatingAngle, -179 - targetAngle);
        }
        // console.error(`Current angle: ${targetAngle}`);
        // console.error(`Chosen angle: ${rotatingAngle}`);
        // console.error(`Target:`);
        // console.error(this.state.target.checkpoint);
        // console.error(`Self:`);
        // console.error(selfCoords);
        return rotateVectorPoint({
            from: deepCopy(selfCoords),
            to: deepCopy(this.state.target.checkpoint),
        }, (rotatingAngle * -1)
        // rotatingAngle as hexadecimalAngle
        );
    };
    return GameControllerSingleton;
}());
function closestToZero(first, second) {
    return Math.abs(first) < Math.abs(second) ? first : second;
}
function compareCoords(coord1, coord2) {
    return coord1.x === coord2.x && coord1.y === coord2.y;
}
function inRange(variable, range) {
    return variable < range && variable > -range;
}
/* Doesn't copy arrays properly */
function deepCopy(objectwise) {
    if (typeof objectwise === "object" && objectwise != null) {
        var copy = {}; // eslint-disable-line
        for (var key in objectwise)
            copy[key] = deepCopy(objectwise[key]);
        return copy;
    }
    return objectwise;
}
function trigonometricalDistance(coord1, coord2) {
    var xDifference = Math.abs(coord1.x - coord2.x);
    var yDifference = Math.abs(coord1.y - coord2.y);
    return Math.pow(xDifference * xDifference + yDifference * yDifference, 0.5);
}
function degsToRads(degAngle) {
    return ((degAngle * Math.PI) / 180);
}
function rotateVectorPoint(vector, angle) {
    // "vector.from" acts like the origin point
    var x = vector.to.x - vector.from.x;
    var y = vector.to.y - vector.from.y;
    var radsAngle = degsToRads(angle);
    // console.error("Vector coords:");
    // console.error({ x, y });
    return {
        x: Math.round(Math.cos(radsAngle) * x - Math.sin(radsAngle) * y) +
            vector.from.x,
        y: Math.round(Math.sin(radsAngle) * x + Math.cos(radsAngle) * y) +
            vector.from.y,
    };
}
var TargetStore = new TargetStoreSingleton();
var GameController = new GameControllerSingleton(TargetStore);
function gameLoop(selfCoords, currTargetCoords, currDist, currAngle, opponentCoords) {
    var thrust = 100;
    GameController.checkTargetChange(deepCopy(currTargetCoords));
    GameController.setDynamicProps(selfCoords, opponentCoords, currAngle);
    if (GameController.state === undefined) {
        throw new Error("Current state should be initialized by now");
    }
    /* Thrust manipulation: soon in its own method */
    if (currDist < 1100 && currDist >= 600) {
        // 600 -> 110 (min:40,max:100)
        thrust = Math.round((60 * currDist) / 500 - 32);
        // console.error(thrust);
    }
    else if (currDist < 800) {
        thrust = 40;
    }
    if (currAngle > 90 || currAngle < -90) {
        // thrust = thrust * 0;
        var absAngle = Math.abs(currAngle);
        // thrust = Math.round(thrust * (- (1 / 8100) * (absAngle - 90) * (absAngle - 270)))
        thrust = Math.round(thrust * (-(1 / 8100) * absAngle * (absAngle - 180)));
        // console.error(thrust)
    }
    else {
        // thrust = thrust * 1;
    }
    var idealTargetCoords = GameController.idealRotatedTarget();
    // console.error("Ideal coords");
    // console.error(idealTargetCoords);
    // console.error(GameController.state);
    console.error("First round");
    if (GameController.state.round === 1) {
        // console.error("First round");
        return "".concat(idealTargetCoords.x, " ").concat(idealTargetCoords.y, " ").concat(thrust);
    }
    /* Later rounds */
    var largestDistanceTarget = GameController.largestDistanceTarget;
    if (largestDistanceTarget === undefined) {
        throw new Error("Largest target by distance should be defined by now");
    }
    console.error("GameController.isThrustAvailable");
    console.error(GameController.isThrustAvailable);
    console.error("largestDistanceTarget");
    console.error(largestDistanceTarget);
    console.error("GameController.state.index");
    console.error(GameController.state.index);
    console.error("inRange()");
    console.error(inRange(currAngle, 10));
    console.error("TargetStore.allTargets");
    console.error(TargetStore.allTargets);
    if (GameController.isThrustAvailable &&
        // && TheStore.pointIndex === 3
        largestDistanceTarget.info.distance !== undefined &&
        GameController.state.index === largestDistanceTarget.index &&
        inRange(currAngle, 10)) {
        thrust = "BOOST";
        GameController.isThrustAvailable = false;
    }
    /* Look at next objective */
    // if (currDist < 800) {
    //   const nextObjective = GameController.nextTarget();
    //   return `${nextObjective.checkpoint.x} ${nextObjective.checkpoint.y} ${thrust}`;
    // }
    return "".concat(idealTargetCoords.x, " ").concat(idealTargetCoords.y, " ").concat(thrust);
}
// game loop
while (true) {
    var inputs = readline().split(" ");
    var x = parseInt(inputs[0]);
    var y = parseInt(inputs[1]);
    var nextCheckpointX = parseInt(inputs[2]); // x position of the next check point
    var nextCheckpointY = parseInt(inputs[3]); // y position of the next check point
    var nextCheckpointDist = parseInt(inputs[4]); // distance to the next checkpoint
    var nextCheckpointAngle = parseInt(inputs[5]); // angle between your pod orientation and the direction of the next checkpoint
    var inputs = readline().split(" ");
    var opponentX = parseInt(inputs[0]);
    var opponentY = parseInt(inputs[1]);
    var logValue = gameLoop({ x: x, y: y }, {
        x: nextCheckpointX,
        y: nextCheckpointY,
    }, nextCheckpointDist, nextCheckpointAngle, {
        x: opponentX,
        y: opponentY,
    });
    console.log(logValue);
}
