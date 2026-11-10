import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chooseCallProvider, publishSources, presentProfileUrl, suspensionUntil, restrictionFlag, biteVisible} from '../release/2edfaaa/rules.mjs';

test('explicit Agora is frozen for both peers and is not dropped', () => {
  const created = chooseCallProvider({requested: 'agora', preferred: 'livekit', agoraConfigured: true, livekitConfigured: true});
  assert.equal(created.provider, 'agora');
  const joined = chooseCallProvider({requested: 'livekit', locked: created.provider, agoraConfigured: true, livekitConfigured: true});
  assert.equal(joined.error, 'PROVIDER_LOCKED');
  assert.equal(joined.provider, 'agora');
  const same = chooseCallProvider({locked: 'agora', agoraConfigured: true, livekitConfigured: true});
  assert.equal(same.provider, 'agora');
});

test('omitted provider follows the saved preference and does not cross over after lock', () => {
  assert.equal(chooseCallProvider({preferred: 'livekit', agoraConfigured: true, livekitConfigured: true}).provider, 'livekit');
  assert.equal(chooseCallProvider({preferred: 'agora', agoraConfigured: true, livekitConfigured: true}).provider, 'agora');
  assert.equal(chooseCallProvider({requested: 'agora', agoraConfigured: false, livekitConfigured: true}).error, 'AGORA_NOT_CONFIGURED');
  assert.equal(chooseCallProvider({requested: 'livekit', agoraConfigured: true, livekitConfigured: false}).error, 'LIVEKIT_NOT_CONFIGURED');
});

test('voice tokens do not grant screen recording', () => {
  assert.deepEqual(publishSources('voice'), ['microphone']);
  assert.deepEqual(publishSources('video'), ['microphone', 'camera']);
  assert.equal(publishSources('video').includes('screen_share'), false);
  assert.equal(publishSources('video', true).includes('screen_share_audio'), true);
});

test('relative profile photos become an https site URL and empty clears', () => {
  assert.equal(presentProfileUrl('/assets/mobile-artist.jpg'), 'https://mrblindbandit.net/assets/mobile-artist.jpg');
  assert.equal(presentProfileUrl('/v1/social/avatars/abc'), 'https://mrblindbandit.net/v1/social/avatars/abc');
  assert.equal(presentProfileUrl(''), '');
  assert.equal(presentProfileUrl('https://cdn.example.test/a.jpg'), 'https://cdn.example.test/a.jpg');
});

test('null empty unknown private draft and reported visibility stay hidden', () => {
  const rows = [
    {id: 'public', visibility: 'public'},
    {id: 'followers', visibility: 'followers', followerAuthorized: true},
    {id: 'followers-stranger', visibility: 'followers', followerAuthorized: false},
    {id: 'shared', visibility: 'shared'},
    {id: 'empty', visibility: ''},
    {id: 'unknown', visibility: 'unknown'},
    {id: 'legacy'},
    {id: 'nullvis', visibility: null},
    {id: 'private', visibility: 'private'},
    {id: 'draft', visibility: 'draft'},
    {id: 'gone', visibility: 'public', deleted: true},
    {id: 'hidden', visibility: 'public', hidden: true},
    {id: 'blocked', visibility: 'public', blocked: true},
    {id: 'reported', visibility: 'public', reported: true}
  ];
  assert.deepEqual(rows.filter(biteVisible).map(row => row.id), ['public', 'followers']);
});

test('the release patch does not treat missing visibility as public', () => {
  const patch = readFileSync(new URL('../release/2edfaaa/mobile-release.patch', import.meta.url), 'utf8');
  for (const forbidden of ["row.visibility||'public'", "IFNULL(p.visibility,'public')", "NOT IN ('private','draft')", "NOT IN ('followers')", "IN ('public','')"]) {
    assert.equal(patch.includes(forbidden), false, forbidden);
  }
  assert.equal(patch.includes("!['public','followers'].includes(row.visibility)"), true);
  assert.equal(patch.includes("p.visibility='public'"), true);
  assert.equal(patch.includes("p.visibility IN ('public','followers')"), true);
});

test('admin suspend and restriction strings are accepted without dropping the action', () => {
  const now = 1_700_000_000_000;
  assert.equal(suspensionUntil(String(Math.floor(now / 1000) + 3600), now) > now, true);
  assert.equal(restrictionFlag('true'), true);
  assert.equal(restrictionFlag('false'), false);
  assert.equal(restrictionFlag(true), true);
});
