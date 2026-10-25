# Swarm cache fingerprint exception

25 October 2026. Full-history Gitleaks 8.30.1 findings were confined to the
`key` field in `swarm/records/judge_cache.jsonl`, in three source commits.
That field is the SHA-256 of a model-tagged prompt, created by `Cache.key()` in
the [pinned scoring code](https://github.com/amitvijapur/oxhack-2026/blob/f2fe2971d9f041a819f7b7ff4a78e10f840884f5/swarm/score.py#L290).
The cache schema is `key`, `model`, `content`. These reported values are prompt
fingerprints rather than API credentials.

`.gitleaks.toml` extends the default rules. Its exception requires the exact
cache path, the generic-api-key rule, and an exact lowercase 64-hex JSON key
match. It does not ignore the file, commit, branch or other credential fields.
Full-history scanning stays enabled. Regression checks prove that the same key
outside the cache, an `api_key` in the cache, and a non-fingerprint key still fail.
