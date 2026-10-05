---
title: "Worked answers: N9"
part: "Worked answers"
order: 14
description: "Worked answers for the exercises on sets, functions, quantifiers, and proof patterns."
---
These answers cover the exercises above. They are not substitutes for
your attempt. When an answer differs from yours, compare the definition
used at the first differing step.

**N9.1.** The rule is membership in
`{ n : n is an integer and 0 ≤ n ≤ 255 }`. Belong: 0, 1, 2, and 255.
Do not belong: 256 and -1.

**N9.2.** The set has two elements. The string `10` is not that set.
The string `11` is not the one-element set written `{1, 1}`.

**N9.3.** The empty set is a subset. `{256}` is not a subset. The even
byte values number 128. Five tested masks are five tests. A universal
claim about `B` needs every element of `B`, or a proof that covers `B`,
not a list of five.

**N9.4.** The pairs are `(0, 0)`, `(0, 1)`, `(1, 0)`, and `(1, 1)`.
There are 4 pairs. The byte pair set has 65536 elements, because
`|B × B| = 256 · 256` and the Chapter 3 survey uses one pair per
byte value and mask.

**N9.5.** Not reflexive: `0 - 0 = 0`. Symmetric: the two equations swap
when the names swap. Not transitive: 0 and 2 differ by 2, while each
differs by 1 from 1.

**N9.6.** The representative rule is a function. Congruence on the
integers is not a function. Section 5.4 requires exactly one output;
§6.3 gives one representative; congruence of `19` with both `3` and
`19` gives two.

**N9.7.** Both 0 and 128 send to 0. The value 1 is missed. The image is
the 128 even byte values.

**N9.8.** Proposition 3.1 says `f(f(x)) = x` for every string `x` of
length `n`. That equation is both a left-inverse equation and a
right-inverse equation for `f` with itself. Proposition N9.4 yields
injectivity and surjectivity, hence a bijection. The map is bijective.
The all-zero mask is one such bijection and hides nothing.

**N9.9.** Ten pairs establish ten pairs. All 65536 byte pairs establish
the byte domain. Proposition 3.1 establishes every finite equal length.
One evaluation establishes one execution of one input.

**N9.10.** It is a predicate, not a statement, until `x` is bound.
`255 ∈ B` is true. `256 ∈ B` is false.

**N9.11.** The implication is true. The hypothesis is false, so the row
is `P = 0`, and both rows with `P = 0` have implication value `1`.

**N9.12.** In the order asked: true; false; false; false; true. The
first holds because every value `2x - 256q` is even. The second fails
because `1` is odd. The third fails because odd `y` are missed; it is
surjectivity of `d`. The fourth fails because one output cannot equal
every byte; already `d(x) = 0` and `d(x) = 1` cannot hold together.
The fifth holds because `d` is a function into `B`: take `y = d(x)`.

**N9.13.** The negation of the universal claim is an existential claim,
and that negation is false. The negation of the existential claim is a
universal claim, and that negation is true. The original universal
claim is the true one. The sentence “every double is odd” is a
different universal claim. It is false, and it is stronger than one
counterexample. The negation of “every double is even” is “some double
is odd.”

**N9.14.** The cases are the four members of `{0, 1} × {0, 1}`. Direct
calculation gives, in order `00`, `01`, `10`, `11`, the common values
`0`, `1`, `1`, `1` for OR and for `(a XOR b) XOR (a AND b)`. All four
rows agree. The proof establishes the bit identity. A byte claim needs
the further sentence that the bit identity applies at each position.

**N9.15.** Suppose `g` is a two-sided inverse of `d` on `B`. Then `g` is
a left inverse, so Proposition N9.4 makes `d` injective, which
contradicts Proposition N9.6. No such inverse exists: it would have to
send 0 to both 0 and 128.

**N9.16.** The contrapositive is: if a byte is in the image, then it is
even. The parity calculation proves that direction directly: an attained
value `2x - 256q` is even. Proposition N9.14 transfers it to the odd-miss
wording. The converse of “a nonzero mask implies a bijective XOR map” is
false, because the zero mask is a bijection. The forward implication is
true because every mask, zero or not, gives a bijection, so a nonzero
mask does too.

**N9.17.** From the base case, `|C(0)| = 1`, and `2⁰ = 1`. The step
doubles the count, so `|C(1)| = 2`, `|C(2)| = 4`, and `|C(3)| = 8`.
Thus `2^0 = 1` and `2^3 = 8`. For the shift claim, a shift by zero
returns every byte, so the base case holds. The inductive step fails
when n = 0, since a left shift by one does not preserve 0x81: `10000001`
becomes `00000010`.

**N9.18.** `0x81` is `10000001`, so `N(0x81) = 2`. One left rotation
yields `00000011`, which still has two ones. One left shift yields
`00000010`, which has one. `0x80` is `10000000`, so `N(0x80) = 1`, while
`d(0x80) = 0` and `N(0) = 0`. Rotation has `N` as an invariant on all of
`B`, because it permutes the eight positions and moves each one-bit onto
exactly one position. The pair `0x01` and `0x02` shows one input whose
ones-count happens to survive a shift. An invariant requires the
implication for every byte. The byte `0x81` is a counterexample for the
shift.

**N9.19.** There are 4294967296 pairs of 16-bit strings. That count does
not refute Proposition 3.1, because the proposition’s proof is a
per-position argument for an arbitrary finite length, not a claim that
someone listed `2³²` pairs. A four-row table with a wrong row is not a
proof. Completeness of the row set and correctness of each row are both
required.

**N9.20.** A true reading: for every finite length `n` and every bit
string `k` of that length, the function `f` from the set of length-`n`
bit strings to itself given by `f(x) = x ⊕ k` is bijective, and `f` is
its two-sided inverse. A false reading is: from the output alone, both
inputs of two-variable XOR are uniquely determined. For `n ≥ 1` the pairs
`(0, 0)` and `(k, k)` with nonzero `k` share the all-zero output and are
different pairs.


## Sources and epigraph record

**[S7] Whitfield Diffie and Martin E. Hellman.** “New Directions in
Cryptography.” *IEEE Transactions on Information Theory*, vol. IT-22,
no. 6, November 1976, pp. 644–654. The epigraph is an eleven-word excerpt
from the first paragraph of §I, on p. 644. The full sentence in that
paragraph is: “At the same time, theoretical developments in information
theory and computer science show promise of providing provably secure
cryptosystems, changing this ancient art into a science.” The excerpt is
the contiguous clause beginning at “providing” and ending at “science.”
No word was substituted.

Wording and page header were checked on 2026-10-05 against the text
extraction of the PDF hosted by Martin Hellman at
<https://ee.stanford.edu/~hellman/publications/24.pdf>.
The extraction renders the page’s opening small capitals with a gap
(“W E STAND TODAY”); the epigraph is not that opening sentence and does
not depend on repairing it. The consulted file is the author-hosted PDF,
not a separate inspection of a physical journal issue. No translation is
involved. The sentence states a 1976 research direction. It is not a
theorem of this lesson and not an endorsement of any construction.

Epigraph verification establishes wording and attribution, not
publication-rights clearance. The definitions, proofs, examples, and
exercises are original drafting for this book.


## Evidence boundary

Lesson N9 adds definitions, propositions, twenty exercises, and worked
answers. It adds no Orange listing. The nine listings and the Rust
integration test attached to Chapters 4–6 are unchanged. No new compiler
run is reported.

The Python checks that accompany this lesson recompute the finite counts,
truth tables, doubling image, rotation and shift examples, and exercise
structure. They do not execute Orange, do not establish a cryptographic
security claim, and do not constitute independent review.

The drafting of this lesson is AI-assisted with Grok 4.7 in Cursor, at
Chase Bryan’s direction, 2026-10-05. Owner review of the lesson is
pending. The project’s Current, Directed, Proposed, and Future
distinctions, the license boundary, and the manuscript’s existing source
disclosures remain in force. N7 and N8 are not written here. Manuscript
Chapters 1–17 are not renumbered here.
