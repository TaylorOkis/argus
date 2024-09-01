
async function checkSystemUtilization() {
    try {
        let response = await fetch('http://localhost:3000/system-usage');
        let data = await response.json();

        console.log('System Data: ', data);
    } catch (error) {
        console.error('Error fetching system usage data: ', error);
    }
}

checkSystemUtilization();





