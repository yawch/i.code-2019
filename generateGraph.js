const { CanvasRenderService } = require('chartjs-node-canvas');

module.exports = async (labels, data) => {
    const width = 400;
    const height = 400;
    const configuration = {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data,
                label: 'Your Progress',
                borderColor: '#3e95cd',
                fill: false
            }]
        }
    }
    const canvasRenderService = new CanvasRenderService(width, height, (ChartJS) => { });
    return await canvasRenderService.renderToDataURL(configuration);
}