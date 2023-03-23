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

/**
 * @typedef {Object} Coordinate
 * @property {number} x
 * @property {number} y
 * 
 * @typedef {Object} CheckpointInfo
 * @property {Coordinate} checkpoint
 * @property {number | undefined} distance
 * @property {number | undefined} angle
 * @property {number} index
 */

/**
 * Se usa pointIndex para evitar usar un .indexOf personalizado
 */
class Store {
  constructor() {
    /** @type {CheckpointInfo[]} */
    this.pointsMap = []
    /** @type {boolean} */
    this.isClosed = false
    /** @type {number} */
    this.round = 1
    /** @type {number} zero-based index */
    this.pointIndex = 0

    /* Once updated */
    /** @type {boolean} */
    this.isThrustAvailable = true
    
    /* Constantly updated */
    /** @type {Coordinate | undefined} */
    this.lastObjective = undefined
    
    /* Updated on close */
    /** @type {number | undefined} */
    this.longestObjectivePos = undefined

    /** @type {number | undefined} */
    this.longestDistance = undefined
  }

  /**
   * @param {Coordinate} point
   */
  addPoint(point, currDist, currAngle) {
    /** @type {CheckpointInfo} */
    const newPointInfo = {
      checkpoint: {...point},
      distance: currDist,
      currAngle: currAngle,
      /* Si es vacío, añadir en 0 */
      // index: this.pointsMap.length === 0 ? 0 : this.pointsMap.length,
      index: this.pointsMap.length,
    }
    this.pointsMap.push(newPointInfo)
  }

  /**
   * @param {Coordinate} currObjective
   * @returns {boolean} didObjectiveChange
   */
  handleCheckpointChange(currObjective, currDist, currAngle) {
    let didObjectiveChange = false
    /* Initialization loop */
    if (this.lastObjective === undefined) {
      this.lastObjective = {...currObjective}
      this.addPoint(currObjective, currDist, currAngle)
      return didObjectiveChange
    }
    /* The objective changed */
    if (!compareCoordinates(currObjective, this.lastObjective)) {
      this.lastObjective = {...currObjective}
      
      /* Add point logic */
      // if (didObjectiveChange && !this.isClosed) {
      if (!this.isClosed) {
        const repeatedPoint = this.pointsMap.filter(el => compareCoordinates(el.checkpoint, currObjective))
        if (repeatedPoint.length === 0) {
          this.addPoint(currObjective, currDist, currAngle)
        }
        else {
          this.closeStore()
        }
      }

      /* Round completed */
      if (compareCoordinates(currObjective, this.pointsMap[0].checkpoint)) {
        this.round++
        this.pointIndex = 0
        // console.error("Round", this.round)
        console.error(currObjective)
        console.error(this.pointsMap)
      }
      else {
        this.pointIndex++
      }
    }

    

    return didObjectiveChange
  }

  closeStore = () => {
    this.isClosed = true
    console.error("Closing...")
    const reducedBySize = this.pointsMap.reduce((a,b) => Math.max(a.distance, b.distance) === a.distance ? a : b)

    // this.longestObjectivePos = 12
    this.longestObjectivePos = reducedBySize.index
    /* Don't verify longestObjectivePos */
    this.longestDistance = this.pointsMap[this.longestObjectivePos].distance
  }

  nextObjective() {
    const {length} = this.pointsMap
    return this.pointsMap[(this.pointIndex + 1) % length]
  }
}


function compareArrs(arr1, arr2) {
  if (arr1.length != arr2.length) return false
  let condition = arr1.every((el, i) => el === arr2[i])
  return condition
}

function compareCoordinates(coord1, coord2) {
  return coord1.x === coord2.x && coord1.y === coord2.y
}

/**
 * 
 * @param {number} hexadecimal 
 * @returns {{inRange: (limit: number)=>boolean}}
 */
function angle(hexadecimal) {
  return {
    inRange(limit) {
      return hexadecimal < limit && hexadecimal > -limit
    }
  }
}

const TheStore = new Store()

/**
 * 
 * @param {Coordinate} self
 * @param {Coordinate} currObjective
 * @param {number} currDist
 * @param {number} currAngle
 * @param {Coordinate} opponent
 */
function gameLoop(self, currObjective, currDist, currAngle, opponent) {
  let thrust = 100;
  const didObjectiveChange = TheStore.handleCheckpointChange(currObjective, currDist, currAngle)
  
  if (currDist < 1100 && currDist >= 600) {
    // 600 -> 110 (min:40,max:100)
    thrust = Math.round(60 * currDist / 500 - 32)
    console.error(thrust)
  } else if (currDist < 800) {
    thrust = 40
  }

  if (currAngle > 90 || currAngle < -90) {
    // thrust = thrust * 0;
    const absAngle = Math.abs(currAngle)
    // thrust = Math.round(thrust * (- (1 / 8100) * (absAngle - 90) * (absAngle - 270)))
    thrust = Math.round(thrust * (- (1 / 8100) * (absAngle) * (absAngle - 180)))
    // console.error(thrust)
  } else {
    // thrust = thrust * 1;
  }

  if (TheStore.round === 1) {
    console.error("First round")
    return `${currObjective.x} ${currObjective.y} ${thrust}`
  }
  // console.error(TheStore.longestObjectivePos)
  // console.error(TheStore.pointIndex)
  /* Later rounds */
  if (
    TheStore.isThrustAvailable
    // && TheStore.pointIndex === 3
    && TheStore.longestObjectivePos !== undefined
    && TheStore.pointIndex === TheStore.longestObjectivePos
    && angle(currAngle).inRange(10)
  ) {
    thrust = "BOOST"
    TheStore.isThrustAvailable = false
  }

  /* Look at next objective */
  if (currDist < 800) {
    const nextObjective = TheStore.nextObjective()
    return `${nextObjective.checkpoint.x} ${nextObjective.checkpoint.y} ${thrust}`
  }

  return `${currObjective.x} ${currObjective.y} ${thrust}`
}

// game loop
while (true) {
    var inputs = readline().split(' ');
    const x = parseInt(inputs[0]);
    const y = parseInt(inputs[1]);
    const nextCheckpointX = parseInt(inputs[2]); // x position of the next check point
    const nextCheckpointY = parseInt(inputs[3]); // y position of the next check point
    const nextCheckpointDist = parseInt(inputs[4]); // distance to the next checkpoint
    const nextCheckpointAngle = parseInt(inputs[5]); // angle between your pod orientation and the direction of the next checkpoint
    var inputs = readline().split(' ');
    const opponentX = parseInt(inputs[0]);
    const opponentY = parseInt(inputs[1]);

    const logValue = gameLoop(
      {x,y},
      {
        x: nextCheckpointX,
        y: nextCheckpointY,
      },
      nextCheckpointDist,
      nextCheckpointAngle,
      {
        x: opponentX,
        y: opponentY,
      }
    )

    console.log(logValue)
}