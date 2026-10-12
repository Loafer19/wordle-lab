# Dictionary sources
- `answers.txt` (2,315 words): original NYT/Wordle answer list, alphabetical — https://gist.github.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b
- `allowed-extra.txt` (10,657 words): extra allowed guesses (non-answers) — https://gist.github.com/cfreshman/cdcdf777450c5b5301e439061d29694c
- `allowed.txt` (12,972 words): union of the two = all valid guesses (pre-NYT original list).
- `optimal/salet.*.tree`: provably optimal SALET decision trees (normal 3.4212, hard 3.5084) by Alex Selby — https://github.com/alex1770/wordle (verified by `bun run simulate`).

# Ukrainian (data/ua, public/ua)
- `ua/allowed.txt` (7,158 words): five-letter word forms from the Kobza dictionary (https://github.com/kobzaapp/kobzadict, `out/kobza_filtered_dict.txt`). Kobza filters VESUM (Великий електронний словник української мови, https://github.com/brown-uk/dict_uk), removing vulgarisms, inflected forms and words with apostrophes. Data licence: **CC BY-NC-SA 4.0** (same as VESUM); filter code MIT.
- `ua/answers.txt` (1,717 words): Kobza "random" pool restricted to nouns tagged only as nominative singular (no rare, archaic, slang, proper-noun or abbreviation tags), keeping only words found in the OpenSubtitles frequency list (hermitdave/FrequencyWords, `uk_full.txt`, CC BY-SA 4.0; used for filtering only), minus a small blocklist.
