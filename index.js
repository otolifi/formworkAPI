const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const forms = require('./Forms.js');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', (req, res) => {
    res.status(201);
    res.json({'nome':"Otoniel", 'email':"otolifi@gmail.com"});
});

var query = {
    "geometry" : {
        "nodes" : {
            "node1" : {
                "position": [0, 0, 0],
                "height": 2,
                "thickness": 1
            },
            "node2" : {
                "position": [2, 0, 0],
                "height": 2,
                "thickness": 1
            },
            "node3" : {
                "position": [2, 2, 0],
                "height": 2,
                "thickness": 1
            }
        },
        "segments" : {
            "segment1" : {
                "start": "node1",
                "end": "node2",
                "height": 2,
                "thickness": 1
            },
            "segment2" : {
                "start": "node2",
                "end": "node3",
                "height": 2,
                "thickness": 1
            }
        }
    }
}

// Implements the function Object.filter
Object.filter = (obj, predicate) => 
    Object.keys(obj)
          .filter( key => predicate(obj[key]) )
          .reduce( (res, key) => Object.assign(res, { [key]: obj[key] }), {} );

app.post('/formwork', (req, res) => {
    let geometry = req.body.geometry;
    let wall = new forms.Wall();
    Object.keys(geometry["nodes"]).forEach(node => {
        //console.log(geometry["nodes"][node]);
        let height = geometry["nodes"][node]["height"];
        let name = node;
        let position = geometry["nodes"][node]["position"];
        wall.addWallNode(position[0], position[1], position[2], height, name);
    });
    Object.keys(geometry["segments"]).forEach(segment => {
        let height = geometry["segments"][segment]["height"];
        let name = segment;
        let start = geometry["segments"][segment]["start"];
        let end = geometry["segments"][segment]["end"];
        let thickness = geometry["segments"][segment]["thickness"];
        let startNode = wall.nodes[Object.keys(Object.filter(wall.nodes, node => node.name == start))];
        let endNode = wall.nodes[Object.keys(Object.filter(wall.nodes, node => node.name == end))];
        //console.log(startNode);
        //console.log(endNode);
        wall.addWallSegment(startNode, endNode, height, thickness, name);

    });
    wall.exportGeometry();
    //console.log(wall.nodes);
    //console.log(wall.segments);
    let formwork = new forms.Formwork(wall);
    formwork.makeCorners(corners=wall.nodes, 1);
    console.log(wall.nodes);
    res.send('OK');
});

// Server
const server = app.listen(3008, () => {
    const host = server.address().address;
    const port = server.address().port;
    console.log("Server listening at http://%s:%s", host, port);
});