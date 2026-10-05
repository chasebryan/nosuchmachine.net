---
title: "Worked answers: Chapters 1–3"
part: "Worked answers"
order: 4
description: "Worked answers for the opening exercises on messages, notation, and reversible rules."
---
These answers cover the exercises above. They are not substitutes for your
attempt. When an answer differs from yours, compare the rule used at the
first differing step.

## Chapter 1 answers

**1.1.** The reversal is `C BA`; reversing again gives `AB C`. For the input
`AB CD`, reversing within each word gives `BA DC`, while reversing the whole
sequence gives `DC BA`. The methods implement different requirements.

**1.2.** Their lengths are zero, one, and one. The latter two contain
different characters: a space and the digit character `0`. Each reverses
to itself, but that does not make the three inputs identical.

**1.3.** Tests of selected messages do not establish correct recovery for
every permitted message. Correct recovery, even if proved universally,
does not establish that an outsider cannot also recover the message.
The report also leaves its tested inputs and implementation unspecified.

**1.4.** Observation raises the concern that the meeting location becomes
known to the carrier. Replacement adds the concern that the receiver acts
on a substituted location. These require different claims; merely stating
that a message is confidential does not settle the replacement case.

**1.5.** The reversal argument tracks positions rather than unique letter
identities. Each position is moved to its opposite position and then back.
Equal characters in different positions do not invalidate that reasoning.

**1.6.** The proof concerns the specified mathematical operation, including
its empty case. The program's failure shows that the program does not meet
that specification on the reported input, assuming the failure report is
accurate. Its name does not make it the operation proved correct.

## Chapter 2 answers

**2.1.** The weights are sixteen, eight, four, two, one. The contributions
are sixteen, zero, four, two, zero. The total is twenty-two.

**2.2.** Nineteen minus sixteen leaves three; three minus two leaves one;
one minus one leaves zero. The eight-bit representation is `00010011`.
Grouped by fours, that is `0001 0011`, or `0x13`. The leading hex digit
contributes `1 × 16 = 16`, and the last digit contributes `3`, so
`(1 × 16) + 3 = 19`. A leading `1` in the decimal numeral 19 would
contribute ten instead.

**2.3.** Five unrestricted positions give `2⁵ = 32` strings. The largest
unsigned value is `11111`, or `16 + 8 + 4 + 2 + 1 = 31`. Zero is one of
the 32 values, which is why the maximum is one less than the count.

**2.4.** Under unsigned binary interpretation, both have numerical value
one. As bit strings, their lengths differ: one position versus eight.
Equality of interpreted numerical values is not identity of stored strings.

**2.5.** `0x3C` is `00111100`: `3` corresponds to `0011`, and `C` to `1100`.
Its decimal value is `(3 × 16) + 12 = 60`.

**2.6.** There is exactly one string with no positions: the empty string.
Writing it as a pair of empty quotation marks is one way to name it; the
quotation marks are notation, not contents of the string. There are no
bits to choose differently, so no second zero-length string exists.

**2.7.** You can check the number of positions and whether both digit
values occur. Randomness is a claim about selection, not a property
established by this visual mixture. Many fully predictable procedures
produce mixed strings.

**2.8.** The display provides a hexadecimal representation. Without
additional facts, it demonstrates no secret-dependent protection. Anyone
with the same hex convention can recover the represented byte values.

**2.9.** Take each old string and make two new strings, one by adding `0`
and one by adding `1` at the front. Every new string begins with exactly
one of those bits and has exactly one old string as its remainder. The
construction therefore misses none and counts none twice.

## Chapter 3 answers

**3.1.** In the order `00`, `01`, `10`, `11`, the XOR results are `0`, `1`,
`1`, `0`. In the last case both inputs are one, so the condition requiring exactly
one input to be one is false.

**3.2.** AND gives `1000`; OR gives `1110`; XOR gives `0110`. In every
column, use the rule for that particular operation. Do not carry between
columns.

**3.3.** The middle four positions selected by the ones in `00111100`
change. The result is `10011010`. XOR with `00111100` again gives
`10100110`.

**3.4.** `1101 ⊕ 0110 = 1011`. Without the retained mask, another input
and mask can yield the same result. For example, `1101` with mask `0000`
also produces `1101`. The output alone does not select one original.

**3.5.** Start with input `1` and mask `0`. The first AND gives `0`, and
the second gives `0` again, not the original `1`. An *always* statement
includes this permitted case. One failure is enough to contradict it.

**3.6.** No: the proposition requires equal-length strings. A designer
could define a padding or alignment rule for unequal lengths, but that
would be additional semantics. The present specification does not choose
one, and the present proof must not be silently applied to an unspecified
extension.

**3.7.** For triples `000`, `001`, `010`, `011`, `100`, `101`, `110`,
`111`, both groupings give, in order, `0`, `1`, `1`, `0`, `1`, `0`, `0`,
`1`. The table covers every triple of individual bits. To extend it to
equal-length strings, apply the bit result separately at every position;
that extra argument identifies the larger domain.

**3.8.** XOR with a publicly known all-zero mask leaves the input visible.
The narrower property is recovery under a retained mask: applying the same
mask twice returns the original. The failed secrecy inference does not
contradict cancellation.

**3.9.** For each of 256 possible input bytes, there are 256 possible
masks. Sixteen-bit strings have 65,536 values each, so pairs have
`65,536 × 65,536 = 4,294,967,296` possibilities. A test over byte pairs
has not examined those additional inputs.

**3.10.** The first statement asserts at least one success; the second
asserts success for all permitted inputs; the third asserts at least one
failure. The second and third contradict each other when they concern
the same operation, domain, and meaning of success. The first and third
can both be true.


## Source notes and epigraph record

The quoted words below are the chapter epigraphs only. The exercises,
examples, and explanatory prose are newly drafted for this book. The
quotations frame questions; they do not replace the arguments in the text.

**[S1] Claude E. Shannon.** “Communication Theory of Secrecy Systems.”
*Bell System Technical Journal* 28(4), 1949, pp. 656–715. The epigraph is
a seven-word excerpt from §2, p. 662. The surrounding sentence introduces
knowledge of the system as an assumption. Wording and location were checked
against the rendered page of the retypeset copy hosted by the University of
Wisconsin–Madison. This is a retypeset copy, not a scan of the original
printing. No translation is involved. Checked 2026-10-05.

Source: <https://pages.cs.wisc.edu/~rist/642-spring-2014/shannon-secrecy.pdf>

**[S2] Claude E. Shannon.** “A Mathematical Theory of Communication.”
*Bell System Technical Journal* 27, 1948, pp. 379–423 and 623–656. The
17-word epigraph is from the introduction, p. 1 of the corrected reprint
hosted by Harvard Mathematics. Wording and location were checked against
the rendered page. The quotation concerns a message selected from possible
messages; it does not assert that every message is equally probable.
No translation is involved. Checked 2026-10-05.

Source: <https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf>

**[S3] Bruce Schneier.** “Schneier's Law,” 15 April 2011, on the author's
website. The 19-word epigraph is the initial block quotation, which Schneier
identifies as his 1998 formulation. Wording was checked on the author's
page. The attribution identifies the page actually consulted rather than
claiming inspection of a 1998 original. No translation is involved.
Checked 2026-10-05.

Source: <https://www.schneier.com/blog/archives/2011/04/schneiers_law.html>

Epigraph sourcing is not a determination of publication permissions.
Any publication-rights decisions remain separate from verification of
wording and attribution.


## Draft status and provenance

This is the first newly written opening of the three-part *Orange Book*,
not a completed novice curriculum or a second companion book. The integrated
navigation and mapping to all seventeen existing chapters are in
[the book index](/book/). Existing source chapters and their status
qualifications have not been rewritten or removed in this increment.

The new prose, examples, exercises, and editorial integration were drafted
with ChatGPT (GPT-6 Astra Pro) at the owner's direction on 2026-10-05.
Authorship remains attributed to Chase Bryan; owner review is pending.
No independent review, proof-checker acceptance, compiler verification,
or release qualification is claimed. The accompanying reference tests
check the elementary worked examples in Python, not an Orange executable.
