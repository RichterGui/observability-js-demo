const express = require('express');
const pino = require('pino');
const pinoHttp = require('pino-http');
const client = require('prom-client');


const streams = [
  { stream: process.stdout },
  { stream: pino.destination('./logs/app.log') }
];

const logger = pino({ level: 'info' }, pino.multistream(streams));
const httpLogger = pinoHttp({ logger });

// setup metricas prometheus
const register = new client.Registry();
client.collectDefaultMetrics({ register });
const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});
register.registerMetric(httpDuration);

const app = express();
app.use(httpLogger);
app.use(express.json());

// midd pra metricas
app.use((req, res, next) => {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route?.path || req.path, status_code: res.statusCode });
  });
  next();
});


app.get('/um', (req, res) => res.status(200).json({ msg: 'um' }));
app.get('/dois', (req, res) => setTimeout(() => res.json({ msg: 'dois' }), Math.random() * 300));
app.post('/tres', (req, res) => res.status(201).json({ received: req.body }));
app.get('/quatro', (req, res) => res.send('quatro'));


app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(4000, () => logger.info(`Running on 4000`));