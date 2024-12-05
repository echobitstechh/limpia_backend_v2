const { SPEC_OUTPUT_FILE_BEHAVIOR } = require('express-oas-generator');
const _ = require('lodash');

export const swaggerConfig = {
    predefinedSpec: function (spec) {
        _.set(spec, 'securityDefinitions.bearerAuth', {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
            description: "Please enter your token with 'Bearer ' prefix (e.g., 'Bearer your-token-here').",
        });
        _.set(spec, 'security', [{ bearerAuth: [] }]);
        _.set(spec, 'schemes', ['https', 'http']);
        return spec;
    },
    swaggerUiServePath: 'api-docs',
    specOutputPath: 'src/docs/swagger_output.json',
    ignoredNodeEnvironments: ['production', 'qa'],
    alwaysServeDocs: false,
    tags: ['auth','booking'],
    specOutputFileBehavior: SPEC_OUTPUT_FILE_BEHAVIOR.PRESERVE,
    swaggerDocumentOptions: {
        info: {
            title: 'Limpia Backend API',
            description: 'API documentation for Limpia Backend V2',
            version: '2.0.0',
            contact: {
                name: 'Echobitstech',
                email: 'support@echobitstech.com',
            },
        },
        basePath: '/api/v1',
    },
};
