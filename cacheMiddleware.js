const redis = require('redis');
const redisClient = redis.createClient({ url: process.env.REDIS_URL });

redisClient.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
    await redisClient.connect();
})();

function generateCacheKey(req) {
    const { originalUrl, method } = req;
    return `cache:${method}:${originalUrl}`;
}

function cacheMiddleware(ttlSeconds) {
    return async (req, res, next) => {
        const cacheKey = generateCacheKey(req);

        try {
            const cachedResponse = await redisClient.get(cacheKey);
            if (cachedResponse) {
                console.log(`Cache HIT para chave ${cacheKey}`);
                return res.json(JSON.parse(cachedResponse));
            } else {
                console.log(`Cache MISS para chave ${cacheKey}`);

                const originalJson = res.json.bind(res);
                res.json = async (body) => {
                    try {
                        await redisClient.setEx(cacheKey, ttlSeconds, JSON.stringify(body));
                        console.log(`Resposta armazenada no cache com chave ${cacheKey} por ${ttlSeconds}s`);
                    } catch (err) {
                        console.error('Erro ao salvar cache:', err.message);
                    }
                    return originalJson(body);
                };

                next();
            }
        } catch (err) {
            console.error('Erro no middleware de cache:', err.message);
            next();
        }
    };
}

module.exports = cacheMiddleware;
