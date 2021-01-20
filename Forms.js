const panelDepth = 0.025;
const plywoodDepth = 0.01;
const panels = [24, 22, 20, 18, 16, 14, 12, 6, 2, 1.5, 1];
const files = {
    8: {
        "24": 'SP-24X8.glb',
        "22": 'SP-22X8.glb',
        "20": 'SP-20X8.glb',
        "18": 'SP-18X8.glb',
        "16": 'SP-16X8.glb',
        "14": 'SP-14X8.glb',
        "12": 'SP-12X8.glb',
        "6": 'SP-6X8.glb',
        "2": 'SP-2X8.glb',
        "1.5": 'SP-1.5X8.glb',
        "1": 'SP-1X8.glb',
        "IC6": 'SP-IC6X8.glb',
        "OC": 'SP-OCX8.glb',
        "FA": 'SP-FAX8.glb'
    },
    hardware: {
        "loop_tie": "LOOP_TIE.GLB"
    }
}

const stdFllers = {
    48: [24, 24],
    47: [24, 22, 1],
    46: [24, 22],
    45: [24, 20, 1],
    44: [24, 20],
    43: [24, 18, 1],
    42: [24, 18],
    41: [24, 16, 1],
    40: [24, 16],
    39: [24, 14, 1],
    38: [24, 14],
    37: [24, 12, 1],
    36: [24, 12],
    35: [22, 12, 1],
    34: [22, 12],
    33: [20, 12, 1],
    32: [20, 12],
    31: [18, 12, 1],
    30: [18, 12],
    29: [16, 12, 1],
    28: [16, 12],
    27: [14, 12, 1],
    26: [24, 2],
    25: [24, 1],
    24: [24],
    23: [22, 1],
    22: [22],
    21: [20, 1],
    20: [20],
    19: [18, 1],
    18: [18],
    17: [16, 1],
    16: [16],
    15: [14, 1],
    14: [14],
    13: [12, 1],
    12: [12],
    7: [6, 1],
    6: [6],
    2: [2],
    1.5: [1.5],
    1: [1]
}
const woodFllers = {
    0: [24, 27, [20]],
    1: [27, 29, [22]],
    2: [29, 36, [24]],
    3: [36, 38, [20, 12]],
    4: [38, 41, [22, 12]],
    5: [41, 48, [24, 12]]
}

const loopScheme = {
    8: [12, 24, 36, 60, 84]
}


function metric(inch) {
    let metric = inch * 0.0254;
    return metric;
}

function imperial(cm) {
    let imperial = cm / 0.0254;
    return imperial;
}

function distributeForm(wallLength, panels) {
    let seq = [];
    let mainPanels = (wallLength - wallLength % panels[0])/panels[0];

    for (let i = 0; i < mainPanels - 1; i++) {
        seq.push(panels[0]);
        wallLength -= panels[0];
    }
    if (wallLength > 0 && stdFllers[wallLength] != undefined) {
        stdFllers[wallLength].forEach((filler) => {
            seq.push(filler);
            wallLength -= filler;
        });
    }
    if (wallLength > 0) {
        let i = 0;
        for (let i = 0; i < Object.keys(woodFllers).length; i++) {
            if (wallLength > woodFllers[i][0] && wallLength < woodFllers[i][1]) {
                woodFllers[i][2].forEach((filler) => {
                    seq.push(filler);
                    wallLength -= filler;
                });
            }
        }
        seq.push(wallLength);
    }
    console.log(wallLength);
    return seq;
}


function getDirection(start, end) {
    let dy = end.position.y - start.position.y
    let dx = end.position.x - start.position.x
    let angle = Math.atan2(dy, dx);
    return angle;
}

class WallNode {
    constructor(x, y, z = 0, height, name) {
        this.position = {
            x : x,
            y : y,
            z : z
        }
        this.wall = {
            right: null,
            left: null,
            top: null,
            bottom: null
        }
        this.extension = {
            right: 0,
            left: 0,
            top: 0,
            bottom: 0
        }
        this.thickness = {
            right: 0,
            left: 0,
            top: 0,
            bottom: 0
        }
        this.points = {
            0: [],
            1: [],
            2: [],
            3: []
        }
        this.rectangle = [0, 0, 0, 0];
        this.height = height;
        this.name = name;
    }
    setPosition(position) {
        this.position = position;
    }
    setHeight(height) {
        this.height = height;
    }

    setWall(wall, side) {
        this.wall[side] = wall;
    }
    setExtension(value, side) {
        this.extension[side] = value;
    }
    setThickness(value, direction) {
        this.thickness[direction] = value;
    }
    isCorner() {
        let order = 0;
        Object.keys(this.wall).forEach(direction => {
            if (this.wall[direction] != null) {
                order += 1;
            }
        });
        if (order > 1) {
            return true;
        } else {
            return false;
        }
    }
}

class WallSegment {
    constructor(start, end, height, thickness, name) {
        this.node = {
            start: start,
            end: end
        }
        this.height = height;
        this.thickness = thickness;
        this.length = ((start.position.x - end.position.x) ** 2 + (start.position.y - end.position.y) ** 2) ** 0.5;
        this.direction = getDirection(start, end);
        this.points = {
            0: [],
            1: [],
            2: [],
            3: []
        }
        this.rectangle = [0, 0, 0, 0];
        this.name = name;
    }
    setThickness(thickness) {
        this.thickness = thickness;
    }
    setHeight(height) {
        this.height = height;
    }
    setStart(start) {
        this.start = start;
        this.direction = getDirection(start, end);
    }
    setEnd(end) {
        this.end = end;
        this.direction = getDirection(start, end);
    }
}

class Wall {
    constructor(wallNodes = [], wallSegments = [], name) {
        this.nodes = wallNodes;
        this.segments = wallSegments;
        this.name = name;
    }
    addWallNode(x, y, z = 0, height, name) {
        let hasNode = false;
        for (let node in this.nodes) {
            if (this.nodes[node].position.x === x &&
                this.nodes[node].position.y === y &&
                this.nodes[node].position.z === z) {
                    hasNode = true;
                }
        }
        if (!hasNode) {
            let newNode = new WallNode(x, y, z, height, name);
            this.nodes.push(newNode);
        } else {
            console.log('Node already exists');
        }
    }
    addWallSegment(start, end, height, thickness, name) {
        let wall = new WallSegment(start, end, height, thickness, name);
        this.segments.push(wall);
        if (getDirection(start, end) === 0) {
            start.wall.right = wall;
            end.wall.left = wall;
            start.thickness.right = thickness;
            end.thickness.left = thickness;
        } else if (getDirection(start, end) === Math.PI) {
            start.wall.left = wall;
            end.wall.right = wall;
            start.thickness.left = thickness;
            end.thickness.right = thickness;
        } else if (getDirection(start, end) === Math.PI/2) {
            start.wall.top = wall;
            end.wall.bottom = wall;
            start.thickness.top = thickness;
            end.thickness.bottom = thickness;
        } else if (getDirection(start, end) === -Math.PI/2) {
            start.wall.bottom = wall;
            end.wall.top = wall;
            start.thickness.bottom = thickness;
            end.thickness.top = thickness;
        }
    }
    splitSegment() {
        console.log('Split wall segment when another wall intersects it or a new node is created along it');
        console.log('Needs check intersection');
    }
    checkInstersection() {
        console.log('Iterates through the walls and checks if there are intersections');
    }
    exportGeometry() {
        this.nodes.forEach((node) => {
            let thicknessVert = Math.max(
                node.thickness.bottom,
                node.thickness.top
            )/*
                node.thickness.right,
                node.thickness.left*/
            let thicknessHoriz = Math.max(
                node.thickness.right,
                node.thickness.left
            )
            /**
             * node.thickness.bottom,
                node.thickness.top
             */
            node.points[0] = [
                node.position.x - thicknessVert/2,
                node.position.y - thicknessHoriz/2
            ];
            node.points[1] = [
                node.position.x + thicknessVert/2,
                node.position.y - thicknessHoriz/2
            ];
            node.points[2] = [
                node.position.x + thicknessVert/2,
                node.position.y + thicknessHoriz/2
            ];
            node.points[3] = [
                node.position.x - thicknessVert/2,
                node.position.y + thicknessHoriz/2
            ];
            node.rectangle = [
                Math.abs(node.points[1][0] - node.points[0][0]),
                Math.abs(node.points[2][1] - node.points[0][1]),
                1,
                [node.position.x, node.position.y]
            ]
        });
        this.segments.forEach((seg) => {
            let pt0, pt1, pt2, pt3;
            switch (seg.direction) {
                case 0:
                    // dimiuir da posicao relativa dos nós! - fazer amanha!
                    pt0 = seg.node.start.points['1'];
                    pt1 = seg.node.end.points['0'];
                    pt2 = seg.node.end.points['3'];
                    pt3 = seg.node.start.points['2'];
                    break;
                case Math.PI/2:
                    pt0 = seg.node.start.points['3'];
                    pt1 = seg.node.start.points['2'];
                    pt2 = seg.node.end.points['1'];
                    pt3 = seg.node.end.points['0'];
                    break;
                case Math.PI:
                    pt0 = seg.node.end.points['1'];
                    pt1 = seg.node.start.points['0'];
                    pt2 = seg.node.start.points['3'];
                    pt3 = seg.node.end.points['2'];
                    break;
                case -Math.PI/2:
                    pt0 = seg.node.end.points['3'];
                    pt1 = seg.node.end.points['2'];
                    pt2 = seg.node.start.points['1'];
                    pt3 = seg.node.start.points['0'];
                    break;
                default:
                    pt0 = 0;
                    pt1 = 0;
                    pt2 = 0;
                    pt3 = 0;
                    break;
            }
            seg.points['0'] = pt0;
            seg.points['1'] = pt1;
            seg.points['2'] = pt2;
            seg.points['3'] = pt3;
            seg.rectangle = [
                Math.abs(pt1[0] - pt0[0]),
                Math.abs(pt2[1] - pt0[1]),
                1,
                [(pt1[0] + pt0[0])/2, (pt2[1] + pt0[1])/2, 0]
            ]
        });
    }

}

class Formwork {
    constructor(wall) {
        this.wall = wall
        this.nodes = wall.nodes
        this.segments = wall.segments
    }
    makeCorners(corners=this.nodes, length) {
        corners.forEach(node => {
            //console.log('no')
            //console.log(node)
            console.log(node.isCorner());
            if (node.isCorner()) {
                //console.log('fazendo canto')
                Object.keys(node.wall).forEach(direction => {
                    //console.log(direction)
                    //console.log(node.wall[direction])
                    if (node.wall[direction] != null) {
                        
                        node.setExtension(length, direction);
                    } else {
                        console.log('nao atualizou')
                    }
                })
            }
        })
    }
    makeWallForms(walls) {
        console.log('Forms the selected walls');
        walls.forEach(wall => {
            let cornerLeft = 0;
            let cornerRight = 0;
            switch (wall.direction) {
                case 0:
                    cornerLeft = wall.node.start.extension.right;
                    cornerRight = wall.node.end.extension.left;
                    break;
                case Math.PI/2:
                    cornerLeft = wall.node.start.extension.top;
                    cornerRight = wall.node.end.extension.bottom;
                    break;
                case Math.PI:
                    cornerLeft = wall.node.start.extension.left;
                    cornerRight = wall.node.end.extension.right;
                    break;
                case -Math.PI/2:
                    cornerLeft = wall.node.start.extension.bottom;
                    cornerRight = wall.node.end.extension.top;
                    break;
                default:
                    break;
            }
            let realLength = wall.length - cornerLeft - cornerRight;
            let long = realLength * 100 / 2.54;
            let seq = distributeForm(long, panels);
            console.log(seq);
        });
    }
    makeWallForm(wall) {
        let cornerLeft = 0;
        let cornerRight = 0;
        switch (wall.direction) {
            case 0:
                cornerLeft = wall.node.start.extension.right;
                cornerRight = wall.node.end.extension.left;
                break;
            case Math.PI/2:
                cornerLeft = wall.node.start.extension.top;
                cornerRight = wall.node.end.extension.bottom;
                break;
            case Math.PI:
                cornerLeft = wall.node.start.extension.left;
                cornerRight = wall.node.end.extension.right;
                break;
            case -Math.PI/2:
                cornerLeft = wall.node.start.extension.bottom;
                cornerRight = wall.node.end.extension.top;
                break;
            default:
                break;
        }
        let realLength = wall.length - cornerLeft - cornerRight;
        let long = realLength * 100 / 2.54;
        let seq = distributeForm(long, panels);
        return seq;
    }
}


module.exports = {Wall, Formwork, metric, panelDepth, files, loopScheme};