module.exports = (labels, data) => {
    let configstr = `
    {
        type: 'line',
        data: {
            labels: [${labels.map((label) => `'${label}'`)}],
            datasets: [{
                data:[${data}],
                label:'Progress',
            }]
        }
    }`;
    return `https://quickchart.io/chart?c=${configstr.replace(/\s/g, '')}`;
};
