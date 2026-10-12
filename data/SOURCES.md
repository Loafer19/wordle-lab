# Dictionary sources
- `answers.txt` (2,315 words): original NYT/Wordle answer list, alphabetical — https://gist.github.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b
- `allowed-extra.txt` (10,657 words): extra allowed guesses (non-answers) — https://gist.github.com/cfreshman/cdcdf777450c5b5301e439061d29694c
- `allowed.txt` (12,972 words): union of the two = all valid guesses (pre-NYT original list).
- `optimal/salet.*.tree`: provably optimal SALET decision trees (normal 3.4212, hard 3.5084) by Alex Selby — https://github.com/alex1770/wordle (verified by `bun run simulate`).
