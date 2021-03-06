enum Dir {
    North = 0,
    South,
    West,
    East,
}
class Room {
    x: number;
    y: number;
    walls: boolean[];
    isVisited: boolean;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.walls = [true, true, true, true];
        this.isVisited = false;
    }
    toStr() {
        return `${this.x},${this.y}(${this.isVisited})`;
    }

    markVisited() {
        this.isVisited = true;
    }
    clearVisited() {
        this.isVisited = false;
    }

    hasWallAt(dir: Dir): boolean {
        return this.walls[allDirections.indexOf(dir)];
    }
    removeWallAt(dir: Dir): void {
        this.walls[allDirections.indexOf(dir)] = false;
    }
}
function offSetForDir(d: Dir): number[] {
    switch (d) {
        case Dir.North:
            return [0, -1];
        case Dir.East:
            return [1, 0];
        case Dir.South:
            return [0, 1];
        case Dir.West:
            return [-1, 0];
        default:
            return null;
    }
}
function makeARoom(x: number, y: number) {
    return new Room(x, y);
}
function unvisitedRooms() {
    return allRooms().filter(r => !r.isVisited);
}

function areThereStillUnvisitedRooms() {
    let count = unvisitedRooms().length;
    return count > 0;
}
function pickFromArray<T>(arr: T[]): T {
    if (arr.length < 1) {
        return null;
    } else {
        return arr[Math.randomRange(0, arr.length - 1)];
    }
}
function neighboursOf(r: Room): Room[] {
    let ns: Room[] = []
    if (r.x > 0) {
        ns.push(roomAt(r.x - 1, r.y));
    }
    if (r.x < gridWidth - 1) {
        ns.push(roomAt(r.x + 1, r.y));
    }
    if (r.y > 0) {
        ns.push(roomAt(r.x, r.y - 1));
    }
    if (r.y < gridWidth - 1) {
        ns.push(roomAt(r.x, r.y + 1));
    }
    return ns;
}

function unvisitedNeighboursOf(r: Room): Room[] {
    return neighboursOf(r).filter(n => !n.isVisited);
}

function getDirBetweenRooms(r1: Room, r2: Room): Dir {
    if (r2.x > r1.x) {
        return Dir.East;
    } else if (r2.x < r1.x) {
        return Dir.West;
    } else if (r2.y > r1.y) {
        return Dir.South;
    } else if (r2.y < r1.y) {
        return Dir.North;
    } else {
        return null;
    }
}
function removeWallBetween(r1: Room, r2: Room) {
    let dir: Dir = getDirBetweenRooms(r1, r2);
    r1.removeWallAt(dir);
    r2.removeWallAt(oppositeDirection(dir));
}

function listStack(stack: Room[]) {
    return `STACK len:${stack.length} content:` + stack.map(r => r.toStr()).join('  ');
}

function listRooms(rs: Room[]) {
    return `len:${rs.length} content:` + rs.map(r => r.toStr()).join('  ');
}

//following https://en.wikipedia.org/wiki/Maze_generation_algorithm#Recursive_backtracker
function recursiveBacktracking() {
    let stack: Room[] = [];
    let cr: Room = randomRoom();
    cr.markVisited();
    let iterations: number = 0;
    let broken = false;


    while (areThereStillUnvisitedRooms() && !broken) {
        let ns: Room[] = unvisitedNeighboursOf(cr);
        let normalNs: Room[] = neighboursOf(cr);

        broken = (stack.length === 0) && (ns.length === 0);
        if (ns.length > 0) {
            let n: Room = pickFromArray(ns);
            stack.push(cr);
            removeWallBetween(cr, n);
            cr = n;
            cr.markVisited();
        } else if (stack.length > 0) {
            cr = stack.pop();
        } else {
            basic.showIcon(IconNames.Confused);
        }
        led.toggle(0, 0);
    }
    if (broken) {
        serial.writeLine("generation ran too long - error");
    }
}

function allRooms(): Room[] {
    let rs: Room[] = [];
    forEachLocation((x, y) => rs.push(roomAt(x, y)));
    return rs;
}

function randomRoom() {
    let l = randomLocation();
    return roomAt(l.x, l.y);
}

function randomLocation(): { x: number, y: number } {
    return {
        x: Math.randomRange(0, gridWidth - 1),
        y: Math.randomRange(0, gridWidth - 1)
    };
}

function oppositeDirection(d: Dir): Dir {
    let input: Dir[] = allDirections;
    let out: Dir[] = [Dir.South, Dir.West, Dir.North, Dir.East];
    let ix = input.indexOf(d);
    return out[ix];
}


function inGrid(x: number, y: number) {
    return (x >= 0 && x < gridWidth && y >= 0 && y < gridWidth);
}
function inPixelGrid(x: number, y: number) {
    return (x >= 0 && x < 5 && y >= 0 && y < 5);
}
function roomAt(x: number, y: number): Room {
    if (x >= 0 && x < gridWidth && y >= 0 && y <= gridWidth) {
        return rooms[x][y];
    } else {
        return null;
    }
}
function removeOneWallAtRandom() {
    let room: Room = randomRoom();
    let neighbour = pickFromArray(neighboursOf(room));
    removeWallBetween(room, neighbour);
}

function makeLevel() {
    for (let x = 0; x < gridWidth; x++) {
        rooms[x] = [];
    }
    forEachLocation((x, y) => (rooms[x][y] = makeARoom(x, y)));
    recursiveBacktracking();
    gItemLocations = { exit: randomLocation(), ghost: randomLocation(), sword: randomLocation() };

}
const allDirections = [Dir.North, Dir.East, Dir.South, Dir.West];
function randomDirection() {
    return pickFromArray(allDirections)
}
function forEachLocation(callback: (x: number, y: number) => void) {
    let n = gridWidth;
    for (let x = 0; x < n; x++) {
        for (let y = 0; y < n; y++) {
            callback(x, y);
        }
    }
}
function drawWall(r: Room, dir: Dir) {
    let wallBrightness = 100;
    if (r.hasWallAt(dir)) {
        if (dir === Dir.West || dir === Dir.East) {
            for (let y = 0; y < 5; y++) {
                led.plotBrightness(dir === Dir.West ? 0 : 4, y, wallBrightness);
            }
        } else {
            for (let x = 0; x < 5; x++) {
                led.plotBrightness(x, dir === Dir.North ? 0 : 4, wallBrightness);
            }
        }
    }
}

function drawCurrentRoom() {
    basic.clearScreen();
    let r = roomAt(location.x, location.y);
    drawRoom(r);
}

function getJoyHorizontalAmount() {
    return pins.analogReadPin(AnalogPin.P1);
}

function getJoyVerticalAmount() {
    return pins.analogReadPin(AnalogPin.P2);
}

function drawRoom(r: Room) {
    allDirections.forEach(d => drawWall(r, d));
}

function canLeaveRoomBy(xOff: number, yOff: number) {
    return !roomAt(location.x, location.y).hasWallAt(getDirForOffsets(xOff, yOff));
}
function changeLocationBy(xOff: number, yOff: number) {
    if (canLeaveRoomBy(xOff, yOff)) {

        let nextX = (location.x + xOff);
        let nextY = (location.y + yOff);
        if (inGrid(nextX, nextY)) {
            location = { x: nextX, y: nextY };
            return location;
        } else {
            return null;
        }
    } else {
        return null;
    }
}
function currentRoom(): Room {
    return roomAt(location.x, location.y);
}
function wallAtPixel(x: number, y: number): boolean {
    return (x === 0 && currentRoom().hasWallAt(Dir.West)) ||
        (x === screenWidth - 1 && currentRoom().hasWallAt(Dir.East)) ||
        (y === 0 && currentRoom().hasWallAt(Dir.North)) ||
        (y === screenWidth - 1 && currentRoom().hasWallAt(Dir.South));
}
function changePixelLocationBy(xOff: number, yOff: number) {
    let nextX = (pixelLocation.x + xOff);
    let nextY = (pixelLocation.y + yOff);
    if (inPixelGrid(nextX, nextY) && !wallAtPixel(nextX, nextY)) {
        pixelLocation = { x: nextX, y: nextY };
        return pixelLocation;
    } else {
        return null;
    }
} function goLeft() {
    return move(-1, 0);
}
function randomImageName() {
    return pickFromArray([IconNames.Ghost, IconNames.Heart, IconNames.Skull, IconNames.Diamond, IconNames.Sword, IconNames.House, IconNames.Rabbit, IconNames.Pitchfork, IconNames.Snake, IconNames.SmallHeart]);
}

function move(xOff: number, yOff: number) {
    let oldPixelLocation = pixelLocation;
    if (changePixelLocationBy(xOff, yOff)) {
        led.unplot(oldPixelLocation.x, oldPixelLocation.y);
        led.plot(pixelLocation.x, pixelLocation.y);
    } else {
        if (changeLocationBy(xOff, yOff)) {
            if (equalLocations(location, gItemLocations.exit)) {
                showDoor();
            } else if (equalLocations(location, gItemLocations.ghost)) {
                basic.showIcon(IconNames.Ghost);

            }
            switchPixelPosForRoomSwitch(xOff, yOff);
            drawCurrentRoom();
            drawPixelInRoom();
        } else {
            drawPixelInRoom();
        }
    }
}
function getDirForOffsets(xOff: number, yOff: number) {
    if (xOff > 0) {
        return Dir.East;
    } else if (xOff < 0) {
        return Dir.West;
    } else if (yOff > 0) {
        return Dir.South;
    } else if (yOff < 0) {
        return Dir.North;
    } else {
        return null;
    }
}

function bringInOffEdge(v: number) {
    if (v === 0) {
        return 1;
    } else if (v === 4) {
        return 3;
    } else {
        return v;
    }
}
function drawPixelInRoom() {
    led.plot(pixelLocation.x, pixelLocation.y);
}

function switchPixelPosForRoomSwitch(xOff: number, yOff: number) {
    let pl = pixelLocation;
    if (xOff > 0) {
        pixelLocation = { x: 0, y: bringInOffEdge(pl.y) };
    } else if (xOff < 0) {
        pixelLocation = { x: 4, y: bringInOffEdge(pl.y) };
    } else if (yOff > 0) {
        pixelLocation = { x: bringInOffEdge(pl.x), y: 0 };
    } else if (yOff < 0) {
        pixelLocation = { x: bringInOffEdge(pl.x), y: 4 };
    }
}

function goRight() {
    return move(1, 0);
}
function goUp() {
    return move(0, -1);

}
function goDown() {
    return move(0, 1);
}
input.onButtonPressed(Button.A, function () {
    goUp();
})
input.onButtonPressed(Button.B, function () {
    goDown();
})
input.onGesture(Gesture.TiltLeft, function () {
    goLeft();
})
input.onGesture(Gesture.TiltRight, function () {
    goRight();
})
input.onGesture(Gesture.LogoUp, function () {
    goUp();
})
input.onGesture(Gesture.LogoDown, function () {
    goDown();
})
input.onGesture(Gesture.Shake, function () {
    if (pixelLocation.x === 2 && pixelLocation.y === 2) {
        openRandomChest();
    }
})
function waitAnim() {
    basic.clearScreen();
    basic.pause(400);
    led.plot(0, 3);
    basic.pause(400);
    led.plot(2, 3);
    basic.pause(400);
    led.plot(4, 3);
    basic.pause(400);
}
function showDoor() {
    basic.showLeds(`
    . # # # .
    # . . . #
    # . . . #
    # . . . #
    # . . . #
    `)
}


function openRandomChest() {
    waitAnim();
    waitAnim();

    basic.showIcon(randomImageName());
    redraw();
}
function isJoystickLeft() {
    return getJoyHorizontalAmount() < 300;
}
function isJoystickRight() {
    return getJoyHorizontalAmount() > 712;
}
function isJoystickDown() {
    return getJoyVerticalAmount() < 300;
}
function isJoystickUp() {
    return getJoyVerticalAmount() > 712;
}
function pauseAfterMovement() {
    basic.pause(100);
}

function locToStr(loc: { x: number, y: number }) {
    return `${loc.x},${loc.y}`;
}

function equalLocations(loc1: { x: number, y: number }, loc2: { x: number, y: number }): boolean {
    return loc1.x === loc2.x && loc1.y === loc2.y;
}

function redraw() {
    basic.clearScreen();
    drawCurrentRoom();
    drawPixelInRoom();
}
basic.showIcon(IconNames.Heart)
let rooms: Room[][] = [];
let gridWidth = 7;
let screenWidth = 5;
let gItemLocations: { exit: { x: number, y: number }, ghost: { x: number, y: number }, sword: { x: number, y: number } };
makeLevel();
let location = randomLocation();
let pixelLocation = { x: 2, y: 2 };
redraw();
const tiltThreshold = 30;

basic.forever(function () {

    if (pins.digitalReadPin(DigitalPin.P16)) {
        basic.showString(`${pixelLocation.x},${pixelLocation.y}`, 40);
    }
    if (pins.digitalReadPin(DigitalPin.P14)) {
        basic.showString(allDirections.filter(d => currentRoom().hasWallAt(d)).join(','), 50);
    }
    applyTiltInput();
    //applyJoystickInput();

});
function applyXMovement(x: number) {
    if (x < -tiltThreshold) {
        goLeft();
        pauseAfterMovement();
    } else if (x > tiltThreshold) {
        goRight();
        pauseAfterMovement();
    }
} function applyYMovement(y: number) {
    if (y < -tiltThreshold) {
        goUp();
        pauseAfterMovement();
    } else if (y > tiltThreshold) {
        goDown();
        pauseAfterMovement();
    }
}
function applyTiltInput() {
    let rx = input.rotation(Rotation.Roll);
    let ry = input.rotation(Rotation.Pitch);
    if (Math.abs(rx) > Math.abs(ry)) {
        applyXMovement(rx);
        applyYMovement(ry);
    } else {
        applyYMovement(ry);
        applyYMovement(rx);
    }
}

function applyJoystickInput() {
    if (isJoystickLeft()) {
        goLeft();
        pauseAfterMovement();
    } else if (isJoystickRight()) {
        goRight();
        pauseAfterMovement();
    } else if (isJoystickUp()) {
        goUp();
        pauseAfterMovement();
    } else if (isJoystickDown()) {
        goDown();
        pauseAfterMovement();
    }

}
