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
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.walls = [true, true, true, true];

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
let rooms: Room[][] = [];
let gridWidth = 7;

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
            return [-9, -9]; //todo
    }
}
function makeARoom(x: number, y: number) {
    return new Room(x, y);
}


function randomLocation() {
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
    for (let i = 0; i < 40; i++) {
        removeOneWall();
    }
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

function drawWall(r: Room, dir: string) {
    if (r.hasWallAt(dir)) {
        if (dir === 'w' || dir === 'e') {
            for (let y = 0; y < 5; y++) {
                led.plot(dir === 'w' ? 0 : 4, y);
            }
        } else {
            for (let x = 0; x < 5; x++) {
                led.plot(x, dir === 'n' ? 0 : 4);
            }

        }
    }
}
function drawCurrentRoom() {
    basic.clearScreen();
    let r = roomAt(location.x, location.y);
    drawRoom(r);
    led.toggle(1, 1);
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
function changePixelLocationBy(xOff: number, yOff: number) {
    let nextX = (pixelLocation.x + xOff);
    let nextY = (pixelLocation.y + yOff);
    if (inPixelGrid(nextX, nextY)) {
        pixelLocation = { x: nextX, y: nextY };
        return pixelLocation;
    } else {
        return null;
    }
} function goLeft() {
    return move(-1, 0);
}
function move(xOff: number, yOff: number) {
    let oldPixelLocation = pixelLocation;
    if (changePixelLocationBy(xOff, yOff)) {
        led.unplot(oldPixelLocation.x, oldPixelLocation.y);
        led.plot(pixelLocation.x, pixelLocation.y);
    } else {
        if (changeLocationBy(xOff, yOff)) {
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
    basic.pause(300);
}
makeLevel();
let location = { x: 2, y: 2 };
let pixelLocation = { x: 2, y: 2 };
basic.clearScreen();
drawCurrentRoom();

basic.forever(function () {

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

})
