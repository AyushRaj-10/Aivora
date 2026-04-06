export function isAudioValid(buffer) {
  return Buffer.isBuffer(buffer) && buffer.length > 100;
}

export function bufferToBase64(buffer) {
  return buffer.toString('base64');
}