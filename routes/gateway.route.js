const gatewayController = require("../controller/gateway.controller");

export default (app) => {
    app.post('/api/generate', gatewayController.generateResponse);
    app.post('/api/chat', gatewayController.chatResponse)
};
