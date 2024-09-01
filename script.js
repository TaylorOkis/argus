google.charts.load('current', { packages: ['corechart'] });
google.charts.setOnLoadCallback(drawCharts);

//Variables
let cpuData, memoryData, diskData;
let cpuChart, memoryChart, diskChart;
let systemData;

let maxValue = 62;
let cpuArray = [
    ['Time', 'Utilization'],
    [0, 0]
]
let cpuOptions, diskOptions, memoryOptions;


async function drawCharts() {
    systemData = await checkSystemUtilization();

    drawMemoryPieChart();
    drawDiskPieChart();
    drawCpuAreaChart();

    setInterval(updateCharts, 1000);
}

async function checkSystemUtilization() {
    try {
        let response = await fetch('http://localhost:3000/system-usage');
        let data = await response.json();

        return data;
    } catch (error) {
        console.error('Error fetching system usage data: ', error);
    }
}

async function updateCharts() {
    systemData = await checkSystemUtilization();
    updateMemoryPieChart();
    updateDiskPieChart();
    updateCpuAreaChart();
}

// Memory Utilizaiton Visualization

function drawMemoryPieChart() {

    memoryData = google.visualization.arrayToDataTable([
        ['Memory', 'Usage'],
        ['Used', systemData['usedMemory']],
        ['Free', systemData['freeMemory']]
    ]);

    var totalMemory = systemData['totalMemory'];

    memoryOptions = {
        title: "Memory Usage (Total: " + totalMemory + " MB)",
        pieSliceText: "both"
    }

    // Draw
    memoryChart = new
        google.visualization.PieChart(document.getElementById('memoryChart'));
    memoryChart.draw(memoryData, memoryOptions);

}

function updateMemoryPieChart() {
    memoryData.setValue(0, 1, systemData['usedMemory']);
    memoryData.setValue(1, 1, systemData['freeMemory']);

    memoryChart.draw(memoryData, memoryOptions);
}



// Disk Utilization Visualization

function drawDiskPieChart() {

    diskData = google.visualization.arrayToDataTable([
        ['Storage', 'Usage'],
        ['Used', systemData['usedStorage']],
        ['Free', systemData['freeStorage']]
    ]);

    var totalStorage = systemData['totalStorage'];

    diskOptions = {
        title: "Disk Usage (Total: " + totalStorage + " MB)",
        pieSliceText: "both"
    }

    // Draw
    diskChart = new
        google.visualization.PieChart(document.getElementById('diskChart'));
    diskChart.draw(diskData, diskOptions);

}

function updateDiskPieChart() {
    diskData.setValue(0, 1, systemData['usedStorage']);
    diskData.setValue(1, 1, systemData['freeStorage']);

    diskChart.draw(diskData, diskOptions);
}



// CPU Utilization Virtualization

function drawCpuAreaChart() {
    cpuData = google.visualization.arrayToDataTable(cpuArray);

    // Set chart options
    cpuOptions = {
        title: 'Cpu Usage',
        hAxis: { title: 'Time', viewWindow: { min: 0, max: maxValue - 2 } },
        vAxis: { title: 'Utilization', viewWindow: { min: 0, max: 100 } },
        curveType: 'function',
        legend: { postition: 'bottom' }
    };

    // Instantiate and draw the chart
    cpuChart = new google.visualization.AreaChart(document.getElementById('cpuChart'));
    cpuChart.draw(cpuData, cpuOptions);
}

function updateCpuAreaChart() {
    // Append the number to the data Array
    const lastXValue = cpuArray[cpuArray.length - 1][0];   // Get the index of the last data set
    cpuArray.push([lastXValue + 1, systemData['cpuData']]);

    // Keep only the latest 60 values
    if (cpuArray.length > maxValue) {
        cpuArray.splice(1, 1);
        for (let i = 1; i < cpuArray.length; i++) {
            value = cpuArray[i][0];
            cpuArray[i][0] = value - 1;
        }
    }

    // Re-draw the chart with the updated data
    cpuData = google.visualization.arrayToDataTable(cpuArray);
    cpuChart.draw(cpuData, cpuOptions);
}



