---
title: "Worked answers: N7"
part: "Worked answers"
order: 10
description: "Worked answers for naming intermediate steps, conversions, and the quarter round."
---
**N7.1.** `added` is `0x01`, because 250 + 7 = 257 = 1 × 256 + 1.
`masked` is `0x01 XOR 0x3c = 0x3d`. The rotation is `0x7a`. Evaluation
prints only `named_round::example`, the nullary spec. `added` and `masked`
are bindings inside `forward`. They are not module results. Calling
`forward` from `example` is what makes the final byte a printed result.

**N7.2.** 200 + 100 = 300. Modulo 256 that is 44, so the add-then-widen
result is `0x0000002c`. The widen-then-add result is 300, or `0x0000012c`.
For 255 and 1, add-then-widen is 0 and widen-then-add is 256, or
`0x00000100`, as in Listing N7.2. The ungrouped spelling is rejected with
`ORC0108` because `as` would have to attach either to `y` alone or to the
sum, and those attachments are Proposition N7.1's two functions. Leaving
out the parentheses does not select the mathematically nicer one. It
selects neither.

**N7.3.** `0x11111111 + 0x01020304 = 0x12131415 = 303240213`.
`2³² = 4294967296`. Because 303240213 < 4294967296, the residue modulo
2³² is the sum. Thus `a1 = 0x12131415`.

**N7.4.** `d1 = 0x51721330`. On a 32-bit word, left rotation by 16 sends
each 16-bit half onto the other half. The bits that leave either end are
exactly the other half, so the operation is an exchange:
`0x1330` and `0x5172` trade places. The same fact holds for every 32-bit
word, not only this one.

**N7.5.** The undischarged assumption is that Orange's `+`, `^`, and
`<<<` on `Word[32]` denote addition modulo 2³², XOR, and left rotation.
The expected output adds one checked input, the RFC 8439 §2.1.1 vector,
and only after a real run of that listing. One agreeing input does not
discharge the assumption for every operator on every word, does not cover
the other 2¹²⁸ − 1 inputs by itself, and does not establish confidentiality,
integrity, or any property of the ChaCha20 block function beyond this
quarter round.

**N7.6.** The legal literal indices are 0, 1, 2, and 3. Index 4 fails
`4 < 4`, so `ORC0223` rejects Listing N7.6 before evaluation. Counting the
elements as 1, 2, 3, 4 names four positions, but it starts at one. The
first element is position 0, so the fourth element is position 3, not 4.

**N7.7.** Final `a` is position 0, the value `a2`. Final `d` is position
3, the value `d2`. The printed vector shows those positions for one input.
Proposition N7.4 claims every input, and its proof uses the operator
assumption together with the order of the bindings. One matching line does
not discharge that assumption.

**N7.8.** `0x81` is 129, which is at least 128, so the most significant
bit is 1 and `high` is `true`. `0x7f` is 127, so that bit is 0 and `high`
is `false`. At −12 the condition `x < 0` is true, the branch `0 - x`
runs, and the result is 12. At 12 the condition is false, the branch `x`
runs, and the result is 12. The other branch is not evaluated.

**N7.9.** `true && false` has type `Bool` and value `false`. It is the
AND of two truth values, not an arithmetic sum, so it is not the byte 0
and not the integer 0 sitting in a word. An `if` condition is that `Bool`.
Adding it to a byte would mix a truth value with a residue. Orange does
not give that mixture a meaning: the condition stays a `Bool`, and the
branches stay values of the result type.

**N7.10.** Final `b` is position 1, written `.1`, because the tuple is
`(a2, b2, c2, d2)` and counting starts at zero. Position 2 is final `c`.
The RFC states final `b` as `0xcb1cf8ce`. That equality uses the order of
the tuple and the identification of `b2` with the standard's final `b`.
The `.1` does not add, XOR, or rotate. A second call of `quarter_round`
does recompute the body; the projection only reads the element.

**N7.11.** `3 - i` is 3, 2, 1, 0, all inside 0 through 3. `i + 1` is
1, 2, 3, 4. The value 4 is not a legal index of a length-4 array, so
Listing N7.11 is rejected with `ORC0223` before any step. The body does
not run, and no array is printed. Listing N7.12 is rejected with
`ORC0226`. The parameter `k` is an `Int` with no bound the checker can
compute, so there is no range to compare with the length. `words` is not
read. The two codes are different failures: a proved range that leaves
the array, and no proved range at all.

**N7.12.** The integers are 286331153, 16909060, 2609737539, and
19088743. Their sum is 2932066495, which is `bounded::total`, because
`as Int` keeps each word's value and the accumulator adds those integers.
`2³² = 4294967296`, and 2932066495 is smaller, so the residue modulo 2³²
is the same integer. The functions still differ. `0xffffffff + 1` is
4294967296 as an `Int` and 0 as a `Word[32]`.


## Sources

**[R1] RFC 8439.** Y. Nir and A. Langley, “ChaCha20 and Poly1305 for IETF
Protocols,” June 2018, §2.1 and §2.1.1. The four update lines and the
quarter-round test vector are those sections. `+`, `^`, and `<<<` in the
quotation have the meanings the RFC states there: addition modulo 2³²,
XOR, and left rotation. Consulted 2026-10-05. This lesson transcribes the
quarter round into named bindings. It does not transcribe the block
function, and it is not a recommendation to deploy an implementation.

<https://www.rfc-editor.org/rfc/rfc8439>

**[B1] Orange bindings.** `docs/BINDINGS_2026.md` and the S3c fixtures in
this repository, including the quarter round with named steps and the
rejection of an ungrouped conversion. `let` begins a binding only where a
body item starts with `let` and a name. `as` converts only after one
complete operand. Elsewhere both words can still be ordinary names. The
diagnostic quoted for Listing N7.3 is `ORC0108` with the message that
`` `as` follows `+` without grouping parentheses ``. Implementation of the
slice is not acceptance of the proposal, and it adds no cryptographic
claim.

**[A1] Orange arrays.** `docs/ARRAYS_2026.md` and the S3d fixtures in this
repository. A length is a decimal integer on the element type, and a
literal index is an integer token in brackets. The diagnostic quoted for
Listing N7.6 is `ORC0223`. An array in this lesson is a value, not a region
of memory that later text may overwrite.

**[F1] Orange conditions.** `docs/CONDITIONS_2026.md` and the S3f fixtures
in this repository. `Bool`, comparisons, `&&`, and `if` / `else` are that
slice. Word comparison is unsigned. Only the selected branch is evaluated.
Implementation of the slice is not acceptance of the proposal.

**[K1] Orange tuples.** `docs/TUPLES_2026.md` and the S3k fixtures in this
repository. A tuple lists two through sixteen elements, and `.k` selects
element `k` counting from zero. The quarter round in Listing N7.9 is the
shape of the S3k quarter round reduced to the RFC §2.1.1 vector. The tuple
slice is implemented here; that is not acceptance of the proposal.

**[E1] Orange loops.** `docs/LOOPS_2026.md` and the S3e fixtures in this
repository. A loop's bounds are integer literals, and an index built from
a loop index is proved in range before evaluation. The diagnostic quoted
for Listing N7.11 is `ORC0223`, including the computed range. Listing N7.12
is `ORC0226`: `` an `Int` index may use only integer literals, loop indices, and words converted with `as Int` ``,
with the label `` this `Int` has no bound ``. Bounded
iteration here is not a general `while`, and it adds no cryptographic
claim.
