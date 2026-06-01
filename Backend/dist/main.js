"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const express_1 = require("express");
const app_module_1 = require("./app.module");
const JSON_BODY_LIMIT = '25mb';
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bodyParser: false });
    app.use('/webhooks/stripe', (req, res, next) => {
        if (req.method !== 'POST') {
            next();
            return;
        }
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => {
            const raw = Buffer.concat(chunks);
            req.rawBody = raw;
            try {
                req.body = raw.length ? JSON.parse(raw.toString('utf8')) : {};
            }
            catch {
                req.body = {};
            }
            next();
        });
    });
    app.use((0, express_1.json)({ limit: JSON_BODY_LIMIT }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: JSON_BODY_LIMIT }));
    app.enableCors();
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    const port = process.env.PORT ? Number(process.env.PORT) : 4000;
    await app.listen(port, '0.0.0.0');
}
bootstrap();
//# sourceMappingURL=main.js.map