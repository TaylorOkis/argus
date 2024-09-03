const si = require('systeminformation');
const http = require('http');
const disk = require('check-disk-space').default;

async function getOSInfo() {
    try {
        return (await (si.osInfo())).platform;
    } catch (error) {
        console.error('Error fetching os information: ', error);
    }
}

async function getMemoryData() {
    try {
        const mem = await si.mem();
        let totalMemory = mem.total / (1024 * 1024);
        let freeMemory = mem.free / (1024 * 1024);
        let usedMemory = totalMemory - freeMemory;

        return {
            totalMemory: totalMemory,
            freeMemory: freeMemory,
            usedMemory: usedMemory
        }
    } catch (error) {
        console.error('Error fetching memory usage: ', error);
    }
}

async function getDiskData() {
    try {
        const diskInfo = await disk('/');
        let totalStorage = diskInfo.size / (1024 * 1024);
        let freeStorage = diskInfo.free / (1024 * 1024);
        let usedStorage = totalStorage - freeStorage;

        return {
            totalStorage: totalStorage,
            freeStorage: freeStorage,
            usedStorage: usedStorage
        }
    } catch (error) {
        console.error('Error fetching disk usage: ', error);
    }
}

async function getCpuData() {
    try {
        const rawLoad = await si.currentLoad();

        // Extract the CPU load percentages for each core
        const coreLoads = rawLoad.cpus.map(core => core.load);

        // Calculate the average load percentage across all cores
        const averageLoad = coreLoads.reduce((acc, load) => acc + load, 0) / coreLoads.length;

        return {
            cpuUtilization: averageLoad
        }
    }
    catch (error) {
        console.error('Error fetching cpu usage: ', error);
    }
}


async function checkSystemUtilization() {
    let memoryData = await getMemoryData();
    let diskData = await getDiskData();
    let cpuData = await getCpuData();

    return {
        totalMemory: parseFloat(memoryData.totalMemory.toFixed(2)),
        freeMemory: parseFloat(memoryData.freeMemory.toFixed(2)),
        usedMemory: parseFloat(memoryData.usedMemory.toFixed(2)),
        totalStorage: parseFloat(diskData.totalStorage.toFixed(2)),
        usedStorage: parseFloat(diskData.usedStorage.toFixed(2)),
        freeStorage: parseFloat(diskData.freeStorage.toFixed(2)),
        cpuData: parseFloat(cpuData.cpuUtilization.toFixed(2))
    }
}

const server = http.createServer(async (req, res) => {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');


    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        });
        res.end();
        return;
    }

    if (req.url === '/system-usage') {
        let systemUtil = await checkSystemUtilization();

        res.writeHead(200, { 'Content-Type': 'application/json' });

        res.end(JSON.stringify(systemUtil));
    }

    if (req.url === '/os-info') {
        let os = await getOSInfo();

        res.writeHead(200, { 'Content-Type': 'application/json' });

        res.end(JSON.stringify(os));
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
