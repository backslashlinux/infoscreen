const si = require('systeminformation');
const fs = require('fs');
const getModelName = require('apple-model-names');
const remote = require('@electron/remote');
const path = require('path');

try {
    const contents = JSON.parse(fs.readFileSync("/etc/backslashlinux/version.conf", "utf-8"));
    document.getElementById('distname').innerHTML = contents.distname ? contents.distname : '';
    document.getElementById('version').innerHTML = contents.version ? contents.version : 'Unknown';
} catch (e) { }

si.system().then(hardwareInformation => {
    if (hardwareInformation.manufacturer === 'Apple Inc.') {
        document.getElementById('model').innerHTML = getModelName(hardwareInformation.model);
    } else {
        document.getElementById('model').innerHTML = `${hardwareInformation.manufacturer} ${hardwareInformation.model}`;
    }
    document.getElementById('serial').innerHTML = hardwareInformation.serial ? hardwareInformation.serial : 'N/A';
    if (hardwareInformation.virtual) {
        document.getElementById('vm').style.display = 'inline-block';
    }
})

si.cpuCurrentSpeed().then(cpuSpeedInformation => {
    si.cpu().then(cpuInformation => {
        document.getElementById('processor').innerHTML = `${cpuSpeedInformation.avg} GHz ${cpuInformation.cores} Core ${cpuInformation.manufacturer.replace('®', '')} ${cpuInformation.brand.replace('Core™ ', '')}`;
    })
})

si.mem().then(memoryInformation => {
    si.memLayout().then(memoryLayoutInformation => {
        document.getElementById('memory').innerHTML = `${Math.ceil(memoryInformation.total / 1073741824)} GB ${memoryLayoutInformation[0].clockSpeed} MHz ${memoryLayoutInformation[0].type}`;
    })
})

si.graphics().then(graphicsInformation => {
    document.getElementById('graphics').innerHTML = `${graphicsInformation.controllers[0].vram} MB ${graphicsInformation.controllers[0].model}`;
});

var dataPoints = [];
var xValue = 0;

var chart = new CanvasJS.Chart("cpuLoadContainer", {
    height: 119,
    interactivityEnabled: false,
    backgroundColor: "transparent",
    axisX: {
        labelFontColor: "transparent",
        lineColor: "white",
        tickColor: "transparent",
    },
    axisX2: {
        lineColor: "transparent",
    },
    axisY: {
        labelFontColor: "white",
        labelFontSize: 12,
        suffix: "%",
        minimum: 0,
        maximum: 100,
    },
    data: [{
        type: "splineArea",
        color: "white",
        markerSize: 0,
        dataPoints: dataPoints
    }]
});

updateData();

function addData(cpuLoad) {
    xValue += 5;
    if (dataPoints.length > 150) {
        dataPoints.shift()
    }
    dataPoints.push({ x: xValue, y: parseInt(cpuLoad) });
    document.getElementById('cpuLoadValue').innerHTML = `Current CPU Load: ${cpuLoad}%`;

    chart.render();
    setTimeout(updateData, 500);
}

function updateData() {
    si.currentLoad().then(cpuLoad => {
        addData(Math.round(cpuLoad.currentLoad.toFixed(2)))
    })
}

function showProcessesWindow() {
    const BrowserWindow = remote.BrowserWindow;
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        title: 'All Processes',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        },
        icon: path.join(__dirname, "../icon.png")
    });

    win.removeMenu();

    win.loadFile('app/processes.html')
}
