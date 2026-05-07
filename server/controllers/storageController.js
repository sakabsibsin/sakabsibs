const { Storage } = require('@google-cloud/storage');
const { Readable } = require('stream');
const { randomUUID } = require('crypto');

const REPLIT_SIDECAR_ENDPOINT = 'http://127.0.0.1:1106';

const objectStorageClient = new Storage({
  credentials: {
    audience: 'replit',
    subject_token_type: 'access_token',
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: 'external_account',
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: 'json',
        subject_token_field_name: 'access_token',
      },
    },
    universe_domain: 'googleapis.com',
  },
  projectId: '',
});

function parseObjectPath(path) {
  if (!path.startsWith('/')) path = `/${path}`;
  const parts = path.split('/');
  if (parts.length < 3) throw new Error('Invalid path');
  return { bucketName: parts[1], objectName: parts.slice(2).join('/') };
}

async function signObjectURL({ bucketName, objectName, method, ttlSec }) {
  const response = await fetch(`${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bucket_name: bucketName,
      object_name: objectName,
      method,
      expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Failed to sign URL: ${response.status}`);
  const { signed_url } = await response.json();
  return signed_url;
}

function getPrivateObjectDir() {
  const dir = process.env.PRIVATE_OBJECT_DIR || '';
  if (!dir) throw new Error('PRIVATE_OBJECT_DIR not set');
  return dir;
}

function normalizeObjectEntityPath(rawPath) {
  if (!rawPath.startsWith('https://storage.googleapis.com/')) return rawPath;
  const url = new URL(rawPath);
  let entityDir = getPrivateObjectDir();
  if (!entityDir.endsWith('/')) entityDir = `${entityDir}/`;
  if (!url.pathname.startsWith(entityDir)) return url.pathname;
  const entityId = url.pathname.slice(entityDir.length);
  return `/objects/${entityId}`;
}

const requestUploadUrl = async (req, res) => {
  try {
    const { name, size, contentType } = req.body;
    if (!name || !contentType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const privateObjectDir = getPrivateObjectDir();
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);

    const uploadURL = await signObjectURL({ bucketName, objectName, method: 'PUT', ttlSec: 900 });
    const objectPath = normalizeObjectEntityPath(uploadURL);

    res.json({ uploadURL, objectPath, metadata: { name, size, contentType } });
  } catch (err) {
    console.error('Error generating upload URL:', err.message);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
};

const servePublicObject = async (req, res) => {
  try {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || '';
    const searchPaths = pathsStr.split(',').map((p) => p.trim()).filter(Boolean);
    if (!searchPaths.length) return res.status(500).json({ error: 'PUBLIC_OBJECT_SEARCH_PATHS not set' });

    const filePath = req.params[0] || '';
    let found = null;
    for (const searchPath of searchPaths) {
      const { bucketName, objectName } = parseObjectPath(`${searchPath}/${filePath}`);
      const file = objectStorageClient.bucket(bucketName).file(objectName);
      const [exists] = await file.exists();
      if (exists) { found = file; break; }
    }

    if (!found) return res.status(404).json({ error: 'File not found' });

    const [metadata] = await found.getMetadata();
    res.setHeader('Content-Type', metadata.contentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    if (metadata.size) res.setHeader('Content-Length', String(metadata.size));

    found.createReadStream().pipe(res);
  } catch (err) {
    console.error('Error serving public object:', err.message);
    res.status(500).json({ error: 'Failed to serve object' });
  }
};

const serveObject = async (req, res) => {
  try {
    const wildcardPath = req.params[0] || '';
    const objectPath = `/objects/${wildcardPath}`;

    let entityDir = getPrivateObjectDir();
    if (!entityDir.endsWith('/')) entityDir = `${entityDir}/`;
    const parts = objectPath.slice(1).split('/');
    if (parts.length < 2) return res.status(404).json({ error: 'Object not found' });
    const entityId = parts.slice(1).join('/');
    const fullPath = `${entityDir}${entityId}`;

    const { bucketName, objectName } = parseObjectPath(fullPath);
    const file = objectStorageClient.bucket(bucketName).file(objectName);
    const [exists] = await file.exists();
    if (!exists) return res.status(404).json({ error: 'Object not found' });

    const [metadata] = await file.getMetadata();
    res.setHeader('Content-Type', metadata.contentType || 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    if (metadata.size) res.setHeader('Content-Length', String(metadata.size));

    file.createReadStream().pipe(res);
  } catch (err) {
    console.error('Error serving object:', err.message);
    res.status(500).json({ error: 'Failed to serve object' });
  }
};

module.exports = { requestUploadUrl, servePublicObject, serveObject };
