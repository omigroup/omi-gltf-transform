export async function transformHubsToOMI(doc, options = {}) {
  await doc.transform(hubsAudioToOMI(options));
  return doc;
}

export function hubsAudioToOMI(options = {}) {
  return async function transformHubsToOmIAudio(doc) {
    // TODO: Transform audio extension
  }
}