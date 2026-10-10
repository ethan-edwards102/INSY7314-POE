import { describe, expect, jest, test } from '@jest/globals';

const RATE_LIMITS = {
    global: { windowMinutes: 15, max: 300 },
    login: { windowMinutes: 15, max: 5 },
    loginIp: { windowMinutes: 15, max: 20 },
    register: { windowMinutes: 60, max: 20 },
    booking: { windowMinutes: 10, max: 10 },
};

// Replace the startup config, because the real module stops the process when .env or the certificate is absent.
jest.unstable_mockModule('../config/env.js', () => ({
    config: { clientOrigins: [], rateLimits: RATE_LIMITS },
}));

const { apiRouters } = await import('../routes/index.js');
const { buildOpenApiDocument } = await import('../openapi/openapi.js');

const document = buildOpenApiDocument(RATE_LIMITS);

// Turn "/:id" into "/{id}", because OpenAPI writes a path parameter in braces.
const servedRoutes = () =>
    apiRouters.flatMap(([mountPath, router]) =>
        router.stack
            .filter((layer) => layer.route)
            .flatMap((layer) => {
                const path = `${mountPath}${layer.route.path === '/' ? '' : layer.route.path}`.replace(/:(\w+)/g, '{$1}');

                return Object.keys(layer.route.methods).map((method) => `${method.toUpperCase()} ${path}`);
            })
    );

const documentedRoutes = () =>
    Object.entries(document.paths).flatMap(([path, item]) =>
        Object.keys(item)
            .filter((key) => key !== 'parameters')
            .map((method) => `${method.toUpperCase()} ${path}`)
    );

describe('OpenAPI document', () => {
    test('documents every route that the API serves, and no route that it does not serve', () => {
        expect(documentedRoutes().sort()).toEqual(servedRoutes().sort());
    });

    test('asks for a token on every route except health, register and login', () => {
        const publicRoutes = Object.entries(document.paths).flatMap(([path, item]) =>
            Object.entries(item)
                .filter(([key, operation]) => key !== 'parameters' && operation.security?.length === 0)
                .map(([method]) => `${method.toUpperCase()} ${path}`)
        );

        expect(publicRoutes.sort()).toEqual(['GET /health', 'POST /auth/login', 'POST /auth/register']);
        expect(document.security).toEqual([{ bearerAuth: [] }]);
    });

    test('offers only the self service roles at registration', () => {
        expect(document.components.schemas.RegisterInput.properties.role.enum).toEqual(['Client', 'Freelancer']);
    });
});

/* ref
https://jestjs.io/docs/ecmascript-modules#module-mocking-in-esm
*/
