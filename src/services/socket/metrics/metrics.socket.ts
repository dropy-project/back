import Prometheus, { Counter, Gauge } from 'prom-client';
import { Express } from 'express';

export const totalUsersOnSocket = new Gauge({
  name: 'total_users_on_socket',
  help: 'Number of users connected to  the socket',
});

export const addMetricsRoute = (server: Express) => {
  server.get('/metrics', async (req, res) => {
    res.set('Content-Type', Prometheus.register.contentType);
    res.end(await Prometheus.register.metrics());
  });
};
