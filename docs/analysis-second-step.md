# Second-step analysis: where "lucky" bits come from (EN)

Script: `scripts/analysis/second-step.ts` (Bun, about 30 s). Raw output: `scripts/analysis/second-step.out.json`.
Data: 2315 answers, 12972 allowed guesses. Maximum information: log2(2315) = **11.18 bits**.
"Best second guess" = the guess with the highest entropy over the bucket left after the opener, searched across all 12972 guesses. Ties go to a candidate.

## 1. Main point: average gain is fixed, luck is variance
For any guess, the expected information equals the entropy of its feedback distribution, H = Σ p·log2(1/p). You can't beat that on average. What you get in one game is the **surprisal** log2(n_before / n_after), and it moves around that mean.
"+2 bits of luck" on step 2 means the answer landed in a small sub-bucket. That's balanced by other answers landing in big ones. The total after two guesses averages exactly H1 + E[H2] (checked numerically: realized mean = adaptive expectation to 3 decimals).

## 2. Openers: adaptive 2-step information
| opener | H1 | E[bits after 2] adaptive | candidates-only 2nd | best fixed 2nd (pair bits) | step-2 realized mean ± SD | after-2 SD | P10 / P50 | identified after 2 (≥11.18 b) | solved in 2 |
|---|---|---|---|---|---|---|---|---|---|
| SALET | 5.835 | 10.017 | 9.762 | CORNI 9.50 | 4.18 ± 1.49 | 1.19 | 8.18 / 10.18 | 41.0% | 3.4% |
| SOARE | 5.886 | 9.994 | 9.605 | CLINT 9.63 | 4.11 ± 1.40 | 1.19 | 8.37 / 10.18 | 39.8% | 1.9% |
| CRANE | 5.743 | 9.977 | 9.699 | TOILS 9.57 | 4.23 ± 1.52 | 1.28 | 8.01 / 10.18 | 41.5% | 3.1% |
| TRACE | 5.831 | 10.014 | 9.731 | NOILS 9.52 | 4.18 ± 1.48 | 1.22 | 8.18 / 10.18 | 41.9% | 3.2% |
| ROATE | 5.883 | 9.987 | 9.730 | SLING 9.40 | 4.10 ± 1.37 | 1.16 | 8.37 / 10.18 | 38.9% | 2.3% |
| RAISE (freq.) | 5.878 | 9.957 | 9.652 | CLOTH 9.40 | 4.08 ± 1.42 | 1.22 | 8.18 / 10.18 | 39.1% | 2.5% |
| AROSE (freq.) | 5.768 | 9.962 | 9.617 | CLINT 9.54 | 4.20 ± 1.43 | 1.20 | 8.18 / 10.18 | 38.9% | 1.9% |
| STARE (freq.) | 5.807 | 9.985 | 9.687 | COLIN 9.50 | 4.18 ± 1.47 | 1.26 | 8.18 / 10.18 | 40.8% | 2.1% |
| ADIEU (vowels) | 4.879 | 9.466 | 9.226 | SNORT 9.06 | 4.59 ± 1.48 | 1.41 | 7.59 / 9.59 | 28.0% | 1.5% |

Takeaways:
* The top openers all land within about 0.06 bit of each other after two adaptive guesses (≈10.0 of 11.18 bits). A weaker opener is partly made up for by a stronger second step. ADIEU starts 1 bit behind and is still 0.5 bit behind after step 2.
* Step-2 realized bits: SD ≈ 1.4–1.5 bits. For SALET, 12% of answers get ≥6 bits on step 2 and 19% get <3 bits. That spread is the "luck".
* About 40% of answers are fully identified after 2 guesses (a guaranteed solve on guess 3). The distribution is skewed: the median is 10.18 bits, and a heavy 11.18 spike sits next to a 7–8-bit tail of 5–9% (the bad buckets).
* Restricting guess 2 to candidates (hard-mode style) costs 0.25–0.39 bit on average.

## 3. Where lucky bits come from
1. **Rare step-1 patterns (small buckets).** A bucket with n answers gives log2(2315/n) bits immediately. With SALET, all-grey (n=221) gives 3.39 bits, while a green+yellow mix with n≈5 gives about 8.9 bits. Small buckets also make step 2 easy: you can often split them fully, getting log2(n) bits, which is the most possible.
2. **Second-step efficiency.** Across buckets, the best second guess reaches only about 78% of the possible log2(n) (SALET 0.783, ADIEU 0.728). Luck means landing in a small sub-bucket of that guess, not a better guess.
3. **The letter ~50% split is the strongest predictor.** Pearson r between a guess's H2 and its "split score" Σ min(p, 1−p) over its distinct letters (p = share of the bucket containing the letter) is **0.81–0.85** across all openers. The number of letters unseen in guess 1 gives r ≈ 0.50–0.57. Distinct-letter count: r ≈ 0.2. Being a candidate: r ≈ 0.10.
4. **Non-candidates dominate.** The best second guess is a non-candidate and strictly better than any candidate for 75–97% of answers (SOARE/AROSE 97%, SALET 75%). On average it uses about 4 new letters.
5. **Repeated letters** show up in the best second guess for 11–29% of answers (for example SLEET or DENET in E-heavy buckets). They help only when a duplicate is itself uncertain inside the bucket; generally fewer distinct letters means a lower split score.
6. **Greens** cut the bucket hard (high surprisal), and the best follow-up then "moves" the known letters away to test new ones. That's why words like CORNU or NIDOR appear even though they can't be answers.

## 4. Universal second words
Here is how often each word is the best adaptive 2nd guess, counted in answers across the 9 openers: CLINT 881, DENET 464, COLIN 354, SLEET 313, SLIPT 312, TORCS 284, TOILS 283, SOILY 246, CORNU 221, HORST 220. CLINT/COLIN/TOILS-type words (C, L, I, N/T, O) are the near-universal complement to S/A/R/E/T openers.

## 5. Non-adaptive (fixed) pairs and triples
Best fixed pairs, searching the top-80 first words × top-3000 second words by entropy:

| pair | bits | classes | % unique after 2 |
|---|---|---|---|
| SOARE+CLINT | **9.633** | 1104 | 27.7 |
| ROAST+CLINE | 9.615 | 1087 | 26.8 |
| TRICE+SALON | 9.584 | 1065 | 26.0 |
| LIANE+CROST | 9.584 | 1073 | 26.4 |
| CRANE+TOILS | 9.569 | 1066 | 26.9 |

All of the best pairs use 10 distinct letters. The best fixed pair (9.63) gets within **0.36–0.39 bit** of the best adaptive 2-step (≈10.0). But it identifies the answer only about 27% of the time, versus about 40% adaptively. Adaptivity's real value is in the tail, not the mean. Some named pairs: SALET+COURD 9.35, CRANE+DOILT 9.51, RAISE+CLOUT 9.39.

Best fixed triples (top-25 pairs × all 12972 third words), 15 distinct letters:

| triple | bits | % unique after 3 |
|---|---|---|
| PARSE+CLINT+DOUGH | **10.787** | 71.7 |
| PARSE+CLINT+DUMBO | 10.786 | 69.9 |
| CARSE+DOILT+NYMPH | 10.772 | 70.3 |
| SNARE+DOILT+CHUMP | 10.765 | 70.6 |
| SOARE+CLINT+DUMPY | 10.753 | 69.6 |

A fixed triple (10.79 bits, 72% unique) is still weaker than 2 adaptive guesses on identification (≈40% unique after 2, ≈10.0 bits), and it uses up guess 3. Its worth is as a human-memorable 4/5-guess scheme, not as an optimum.

## 6. Ideas that actually help worst cases (luck can't be planned, but variance can be shaped)
* **Pick the 2nd guess for the tail, not the mean.** In large buckets (SALET all-grey n=221, ⬜⬜⬜🟨⬜ n=165), choose a guess that minimises the **largest sub-bucket** or the expected number of guesses (as the Selby tree does) rather than maximising entropy. Same average bits, fewer 5-guess games.
* **Use non-candidate probes in steps 2–3** (easy mode): they're worth +0.25–0.4 bit on average, and more in "_IGHT/_ATCH"-style traps where candidates differ only by one letter.
* **Hybrid fixed→adaptive:** play SOARE/SALET, then CLINT-like only when the bucket is large (n > ~50), and adapt otherwise. This loses little against full adaptivity and is human-friendly.
* **Avoid vowel-dump openers** (ADIEU): −0.5 bit after 2, and only 28% vs 40% identified.
* The surprisal you'll get is predictable from the step-1 bucket size. Expect "lucky" games when guess 1 gives greens or rare yellows. All-grey or single-yellow outcomes are where the worst cases live and where tail-optimised play matters most.
