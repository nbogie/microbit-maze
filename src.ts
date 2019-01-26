enum Direction {
    North = 1,
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
    wallIx(dir: string): number {
        let posns = ['n', 'e', 's', 'w'];
        return posns.indexOf(dir);
    }
    hasWallAt(dir: string): boolean {
        return this.walls[this.wallIx(dir)];
    }
    removeWallAt(dir: string): void {
        this.walls[this.wallIx(dir)] = false;
    }
}
function offSetForDir(d: string): number[] {
    switch (d) {
        case 'n':
            return [0, -1];
        case 'e':
            return [1, 0];
        case 's':
            return [0, 1];
        case 'w':
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

function getDirBetweenRooms(r1: Room, r2: Room) {
    if (r2.x > r1.x) {
        return 'e';
    } else if (r2.x < r1.x) {
        return 'w';
    } else if (r2.y > r1.y) {
        return 's';
    } else if (r2.y < r1.y) {
        return 'n';
    } else {
        return null;
    }
}
function removeWallBetween(r1: Room, r2: Room) {
    let dir: string = getDirBetweenRooms(r1, r2);
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

function randomLocation(): { x: number, y: number } {
    return {
        x: Math.randomRange(0, gridWidth - 1),
        y: Math.randomRange(0, gridWidth - 1)
    };
}

function oppositeDirection(d: string): string {
    let input: string[] = ['n', 'e', 's', 'w'];
    let out: string[] = ['s', 'w', 'n', 'e'];
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
function removeOneWall() {
    let loc = randomLocation();
    let randomRoom: Room = roomAt(loc.x, loc.y);
    let dir: string = randomDirection();
    randomRoom.removeWallAt(dir);

    let offset = offSetForDir(dir);

    let nx = loc.x + offset[0];
    let ny = loc.y + offset[1];
    if (inGrid(nx, ny)) {

        let neighbour = roomAt(nx, ny);
        if (neighbour) {
            neighbour.removeWallAt(oppositeDirection(dir))
        } else {
            basic.showString(`n${nx} ${ny}`, 30);

        }
    }

}

function makeLevel() {
    for (let x = 0; x < gridWidth; x++) {
        rooms[x] = [];
    }

    forEachLocation((x: number, y: number) => (rooms[x][y] = makeARoom(x, y)));

    recursiveBacktracking();
    gItemLocations = { exit: randomLocation(), ghost: randomLocation(), sword: randomLocation() };

}
function randomDirection() {
    return ["n", "e", "s", "w"][Math.floor(3 * Math.random())]
}
function forEachLocation(callback: (x: number, y: number) => void) {
    let n = gridWidth;
    for (let x = 0; x < n; x++) {
        for (let y = 0; y < n; y++) {
            callback(x, y);
        }
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

function drawWall(r: Room, dir: string) {
    let wallBrightness = 100;
    if (r.hasWallAt(dir)) {
        if (dir === 'w' || dir === 'e') {
            for (let y = 0; y < 5; y++) {
                led.plotBrightness(dir === 'w' ? 0 : 4, y, wallBrightness);
            }
        } else {
            for (let x = 0; x < 5; x++) {
                led.plotBrightness(x, dir === 'n' ? 0 : 4, wallBrightness);
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
    ['n', 'e', 's', 'w'].forEach(d => drawWall(r, d));
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
    return (x === 0 && currentRoom().hasWallAt('w')) ||
        (x === screenWidth - 1 && currentRoom().hasWallAt('e')) ||
        (y === 0 && currentRoom().hasWallAt('n')) ||
        (y === screenWidth - 1 && currentRoom().hasWallAt('s'));
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
        return 'e';
    } else if (xOff < 0) {
        return 'w';
    } else if (yOff > 0) {
        return 's';
    } else if (yOff < 0) {
        return 'n';
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


function redraw() {
    basic.clearScreen();
    drawCurrentRoom();
    drawPixelInRoom();
}

let rooms: Room[][] = [];
let gridWidth = 7;
let screenWidth = 5;
let gItemLocations: { exit: { x: number, y: number }, ghost: { x: number, y: number }, sword: { x: number, y: number } };

makeLevel();
let location = randomLocation();
let pixelLocation = { x: 2, y: 2 };
redraw();
function locToStr(loc: { x: number, y: number }) {
    return `${loc.x},${loc.y}`;
}

function equalLocations(loc1: { x: number, y: number }, loc2: { x: number, y: number }): boolean {
    return loc1.x === loc2.x && loc1.y === loc2.y;
}

basic.forever(function () {

    if (pins.digitalReadPin(DigitalPin.P16)) {
        basic.showString(`${pixelLocation.x},${pixelLocation.y}`, 40);
    }
    if (pins.digitalReadPin(DigitalPin.P14)) {
        basic.showString(['n', 'e', 's', 'w'].filter(d => currentRoom().hasWallAt(d)).join(','), 50);
    }
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

});
