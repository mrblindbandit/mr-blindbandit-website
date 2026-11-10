/** Pure rules for the 2edfaaa production patch. No network, no secrets. */

export function chooseCallProvider({requested, preferred, agoraConfigured, livekitConfigured, locked}) {
  if (locked) {
    if (requested && requested !== locked) return {error: 'PROVIDER_LOCKED', provider: locked};
    return {provider: locked};
  }
  if (requested === 'agora') {
    if (!agoraConfigured) return {error: 'AGORA_NOT_CONFIGURED'};
    return {provider: 'agora'};
  }
  if (requested === 'livekit') {
    if (!livekitConfigured) return {error: 'LIVEKIT_NOT_CONFIGURED'};
    return {provider: 'livekit'};
  }
  const provider = preferred === 'agora' && agoraConfigured ? 'agora' : 'livekit';
  if (provider === 'livekit' && !livekitConfigured) return {error: 'LIVEKIT_NOT_CONFIGURED'};
  return {provider};
}

export function publishSources(roomType, screenShare = false) {
  if (roomType === 'data' || roomType === 'none') return [];
  if (roomType === 'voice') return ['microphone'];
  const sources = ['microphone', 'camera'];
  if (screenShare) sources.push('screen_share', 'screen_share_audio');
  return sources;
}

export function presentProfileUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('/assets/') || raw.startsWith('/v1/') || raw.startsWith('/api/v1/')) return 'https://mrblindbandit.net' + raw;
  return raw;
}

export function suspensionUntil(value, now) {
  let until = Number(value) || (now + 7 * 86400000);
  if (until > 0 && until < 1e12) until *= 1000;
  return until;
}

export function restrictionFlag(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return ['true', '1', 'yes'].includes(value.toLowerCase());
  return undefined;
}

/** Fail closed. Only exact public, or followers when the viewer is authorized, is visible. */
export function biteVisible(row) {
  if (!row || row.deleted || row.hidden || row.blocked || row.reported) return false;
  if (row.visibility === 'public') return true;
  if (row.visibility === 'followers') return row.followerAuthorized === true;
  return false;
}
