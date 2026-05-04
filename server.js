const fs = require('fs');
const path = require('path');
const http = require('http');

const port = parseInt(process.env.PORT || '8080', 10);
const publicDir = path.join(__dirname, 'www');
const openAiApiKey = process.env.OPENAI_API_KEY || '';
const openAiModel = process.env.OPENAI_MODEL || 'gpt-4.1-nano';
const googleTtsApiKey = process.env.GOOGLE_TTS_API_KEY || '';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function sendBuffer(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, headers);
  response.end(body);
}

function sendFile(filePath, response) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extension] || 'application/octet-stream';

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Internal Server Error');
      return;
    }

    response.writeHead(200, { 'Content-Type': contentType });
    response.end(data);
  });
}

function resolveFilePath(requestUrl) {
  const pathname = decodeURIComponent(new URL(requestUrl, 'http://localhost').pathname);
  const sanitizedPath = pathname.replace(/^\/+/, '');
  const requestedPath = path.join(publicDir, sanitizedPath);
  const normalizedPath = path.normalize(requestedPath);

  if (!normalizedPath.startsWith(publicDir)) {
    return null;
  }

  return normalizedPath;
}

function getBodyBuffer(request, maxBytes = 30 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;

    request.on('data', chunk => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error('Payload too large'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });

    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}

async function getJsonBody(request) {
  const bodyBuffer = await getBodyBuffer(request);
  if (!bodyBuffer.length) {
    return {};
  }

  try {
    return JSON.parse(bodyBuffer.toString('utf-8'));
  } catch {
    throw new Error('Invalid JSON payload');
  }
}

async function proxyJsonToOpenAI(response, upstreamPath, payload) {
  if (!openAiApiKey) {
    sendJson(response, 503, { error: 'OPENAI_API_KEY is not configured on the server.' });
    return;
  }

  const upstreamResponse = await fetch(`https://api.openai.com${upstreamPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openAiApiKey}`
    },
    body: JSON.stringify(payload)
  });

  const responseBody = await upstreamResponse.arrayBuffer();
  sendBuffer(response, upstreamResponse.status, Buffer.from(responseBody), {
    'Content-Type': upstreamResponse.headers.get('content-type') || 'application/json; charset=utf-8'
  });
}

async function proxyMultipartToOpenAI(request, response, upstreamPath) {
  if (!openAiApiKey) {
    sendJson(response, 503, { error: 'OPENAI_API_KEY is not configured on the server.' });
    return;
  }

  const contentType = request.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    sendJson(response, 400, { error: 'Expected multipart/form-data request.' });
    return;
  }

  const bodyBuffer = await getBodyBuffer(request);
  const upstreamResponse = await fetch(`https://api.openai.com${upstreamPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      'Authorization': `Bearer ${openAiApiKey}`
    },
    body: bodyBuffer
  });

  const responseBody = await upstreamResponse.arrayBuffer();
  sendBuffer(response, upstreamResponse.status, Buffer.from(responseBody), {
    'Content-Type': upstreamResponse.headers.get('content-type') || 'application/json; charset=utf-8'
  });
}

async function handleOpenAIChat(request, response) {
  const payload = await getJsonBody(request);
  const upstreamPayload = {
    model: payload.model || openAiModel,
    messages: payload.messages || [],
    temperature: payload.temperature ?? 0.7,
    response_format: payload.response_format
  };

  await proxyJsonToOpenAI(response, '/v1/chat/completions', upstreamPayload);
}

async function handleOpenAISpeech(request, response) {
  const payload = await getJsonBody(request);
  const upstreamPayload = {
    model: payload.model || 'tts-1-hd',
    input: payload.input || '',
    voice: payload.voice || 'nova',
    response_format: payload.response_format || 'mp3',
    speed: payload.speed ?? 1
  };

  await proxyJsonToOpenAI(response, '/v1/audio/speech', upstreamPayload);
}

async function handleOpenAITranscriptions(request, response) {
  await proxyMultipartToOpenAI(request, response, '/v1/audio/transcriptions');
}

async function handleGoogleTts(request, response) {
  if (!googleTtsApiKey) {
    sendJson(response, 503, { error: 'GOOGLE_TTS_API_KEY is not configured on the server.' });
    return;
  }

  const payload = await getJsonBody(request);
  const upstreamResponse = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleTtsApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const responseBody = await upstreamResponse.arrayBuffer();
  sendBuffer(response, upstreamResponse.status, Buffer.from(responseBody), {
    'Content-Type': upstreamResponse.headers.get('content-type') || 'application/json; charset=utf-8'
  });
}

async function handleApiRequest(request, response, pathname) {
  if (request.method !== 'POST') {
    sendJson(response, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    if (pathname === '/api/openai/chat') {
      await handleOpenAIChat(request, response);
      return;
    }

    if (pathname === '/api/openai/speech') {
      await handleOpenAISpeech(request, response);
      return;
    }

    if (pathname === '/api/openai/transcriptions') {
      await handleOpenAITranscriptions(request, response);
      return;
    }

    if (pathname === '/api/google-tts') {
      await handleGoogleTts(request, response);
      return;
    }

    sendJson(response, 404, { error: 'API route not found' });
  } catch (error) {
    const statusCode = error.message === 'Payload too large' ? 413 : 400;
    sendJson(response, statusCode, {
      error: error.message || 'Unexpected server error'
    });
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', 'http://localhost');
  const { pathname } = url;

  if (pathname === '/api/health') {
    sendJson(response, 200, {
      ok: true,
      openaiConfigured: !!openAiApiKey,
      googleTtsConfigured: !!googleTtsApiKey
    });
    return;
  }

  if (pathname.startsWith('/api/')) {
    await handleApiRequest(request, response, pathname);
    return;
  }

  if (!fs.existsSync(publicDir)) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Build output not found. Run "npm run build:web" first.');
    return;
  }

  const resolvedPath = resolveFilePath(request.url || '/');
  if (!resolvedPath) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Bad Request');
    return;
  }

  fs.stat(resolvedPath, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(resolvedPath, response);
      return;
    }

    const indexPath = path.join(publicDir, 'index.html');
    sendFile(indexPath, response);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`NuovaLingua web server listening on port ${port}`);
});
