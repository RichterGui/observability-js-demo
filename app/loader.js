const axios = require('axios');

async function hitEndpoints() {
  const paths = ['/um', '/dois', '/tres', '/quatro'];

  for (const path of paths) {
    try {
      const start = Date.now();
      const res = await axios({
        method: path === '/tres' ? 'post' : 'get',
        url: `http://localhost:4000${path}`,
        data: path === '/tres' ? { foo: 'bar' } : null,
        timeout: 2000,
      });
      const duration = Date.now() - start;
      console.log(`${path} -> ${res.status} (${duration}ms)`);
    } catch (err) {
      console.error(`${path} -> ERROR`, err.message);
    }
  }
}

setInterval(hitEndpoints, 1000);