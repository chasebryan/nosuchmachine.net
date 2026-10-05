---
title: "Chapter 3: A Rule You Can Undo"
part: "Part 1, The Novice"
order: 3
description: "Boolean operations, masks, XOR, and what an exhaustive check can honestly say."
---
> “Anyone, from the most clueless amateur to the best cryptographer, can create an algorithm that he himself can’t break.”
>
> — Bruce Schneier, “Schneier's Law” (2011), quoting his 1998 formulation. [S3]

## 3.1 Start with a question that has two answers

Take the statement “these two bits are equal.” Given their values, you can
answer either true or false. In the two-valued logic used here, those are
the available **truth values**.

A **Boolean value** is one of those two values. We may represent false by
`0` and true by `1`, but this is a chosen interpretation of the digits.
It does not make every byte containing a one into the English word *true*.
The numerical and logical readings must still be distinguished.

A **logical operation** produces a truth value according to a stated rule.
Begin with **NOT**, which changes true to false and false to true:

| Input | NOT input |
| --- | --- |
| `0` | `1` |
| `1` | `0` |

This is a **truth table**. It lists every allowed input and the result
assigned to it. There are only two inputs here, so the table defines the
operation completely.

An **operator** is a symbol or word naming an operation. An **operand** is
a value the operation acts on. NOT takes one operand. We will next define
operations that take two.

## 3.2 Three ways to combine two bits

With two input bits, there are four input pairs. Keep the first and second
positions distinct, even when the operation happens to give the same result
in either order.

**AND** gives `1` only when both inputs are `1`. **OR**, in its inclusive
sense, gives `1` when at least one input is `1`; that includes the case where
both are. **XOR**, pronounced *ex-or* and short for *exclusive OR*, gives `1`
when exactly one of the two inputs is `1`.

| First bit | Second bit | AND | OR | XOR |
| --- | --- | --- | --- | --- |
| `0` | `0` | `0` | `0` | `0` |
| `0` | `1` | `0` | `1` | `1` |
| `1` | `0` | `0` | `1` | `1` |
| `1` | `1` | `1` | `1` | `0` |

Read the final row carefully. OR allows both inputs to be one. XOR does not.
This is the precise difference that the word *exclusive* contributes.

You can also read XOR as a test for difference: equal input bits give zero;
different input bits give one. That is the same operation described from
another angle, not an additional rule you have to memorize.

The phrase “exactly one” describes the two-input definition. When we later
combine three or more bits by repeated XOR, do not assume that the result
still means exactly one input was one. We will calculate what repeated
application actually does.

## 3.3 From a bit to a string

A **bitwise** operation applies a bit rule separately at corresponding
positions. For now, both strings must have the same length. Put one beneath
the other so the positions line up:

```text
First input:   1011
Second input:  0110
XOR result:    1101
```

At the first position, `1 XOR 0` gives `1`. At the second, `0 XOR 1` gives
`1`. At the third, `1 XOR 1` gives `0`. At the fourth, `1 XOR 0` gives `1`.
Nothing is carried from one position to the next.

That last fact distinguishes bitwise XOR from ordinary integer addition.
Under the unsigned interpretation, the inputs above are eleven and six,
while the result is thirteen. Eleven plus six is seventeen, not thirteen.
A similar-looking symbol cannot be allowed to change the operation silently.

For mathematical discussion, I will write XOR as `⊕`. The previous example
is therefore:

```text
1011 ⊕ 0110 = 1101
```

Here the digit groups are bit strings, not decimal numerals. The symbol
`⊕` is mathematical notation in this book, not a line of Orange source.
We will introduce executable syntax separately.

## 3.4 One operand as a set of instructions

Hold the second input fixed and examine just two rows at a time.

When the second input is `0`, the output equals the first input: `0` remains
`0`, and `1` remains `1`. When the second input is `1`, the output is the
opposite of the first: `0` becomes `1`, and `1` becomes `0`.

So XOR with zero means **leave this bit alone**. XOR with one means
**flip this bit**. To flip a bit is to replace it with its opposite value.

A bit string used to select such per-position behavior is often called a
**mask**. In our example, the mask `0110` leaves the first and fourth
positions alone and flips the second and third.

This is a useful way to predict the result without reciting four table
lookups. It also exposes why XOR can undo itself.

Apply the same mask again:

```text
Original:       1011
Mask:           0110
First result:   1101
Same mask:      0110
Second result:  1011
```

Every unchanged position stays unchanged. Every flipped position flips
back. We recovered the original string without storing a separate copy
of it inside this calculation.

We did retain the mask. Do not leave that fact out of the explanation.

## 3.5 Prove the rule, not just this example

**Proposition 3.1 — Cancellation with a retained mask.** For any two
finite, equal-length bit strings `x` and `k`, applying XOR with `k` twice
returns `x`:

```text
(x ⊕ k) ⊕ k = x.
```

The letters name arbitrary strings, not special values. The parentheses
say to compute `x ⊕ k` first, then XOR that result with `k`.

**Proof.** Choose any position. If the bit of `k` there is zero, neither
application changes the corresponding bit of `x`. If it is one, the first
application flips that bit and the second flips it back. Those are all
possible values for a bit of `k`. Thus every position ends with its original
value. XOR preserves the number and order of positions, so the complete
result is `x`. For empty strings, there are no positions to alter, and the
result is again the empty string.

The argument covers every allowed length and every allowed pair of strings.
It does not rely on `1011`, on the number thirteen, or on a mask containing
exactly two ones.

Now narrow the conclusion to what we actually established. Given the output
and the retained mask, we can recover the input. We have not established
that an observer who lacks the mask cannot learn the input. That would need
a different argument, including an account of how the mask is selected,
what the observer knows, and how the construction is used.

A publicly known all-zero mask satisfies Proposition 3.1 while hiding
nothing. This is a counterexample to the assertion that reversibility
alone establishes secrecy. It is not a rule that a random secret mask must
never happen to be all zeros. Selection, disclosure, and a particular
selected value are different issues.

## 3.6 Where did the other input go?

You may notice a tension. Two input bits go into XOR, but only one output
bit comes out. How can the operation be reversible?

It is not reversible as a way of recovering *both unknown inputs from the
output alone*. The output `1` could have come from `0 XOR 1` or `1 XOR 0`.
The output `0` could have come from `0 XOR 0` or `1 XOR 1`. Each possible
output leaves two possible input pairs.

Proposition 3.1 makes a narrower statement. It holds one input, the mask,
available. Once that input is known, the output determines the other input.
The missing information has not been conjured out of the result. It was
retained in `k`.

Compare AND. If the retained second operand is `1`, AND leaves the first
operand unchanged, so you can recover it. If the retained second operand is
`0`, the result is always `0`, whether the first operand was `0` or `1`.
Recovery is then impossible from those two known values alone.

This does not make AND a bad operation. It makes it a different operation.
Whether discarded information is a defect depends on what you required
of the computation.

## 3.7 Grouping is part of the calculation

Calculate these expressions using the truth table:

```text
(1 XOR 1) XOR 1
1 XOR (1 XOR 1)
```

Both give one. The first combines the left pair, producing zero, and then
combines zero with one. The second combines the right pair first, with the
same final result.

An **even** whole number can be divided into pairs without anything left
over. An **odd** whole number leaves one over. The word **parity** names this
even-or-odd distinction.

For XOR, this agreement holds for every three input bits. We can establish
it by listing all eight cases, or by observing that each input one toggles
the accumulated result, starting from zero. An even number of ones leaves
zero; an odd number leaves one. The number of ones, not their grouping,
determines the result. Exercise 3.7 asks you to check the complete table
rather than accept that observation without inspection.

Repeated XOR of bits records the parity of the number of ones. Three ones
therefore give one, despite not containing exactly one one.

Do not generalize this freedom of grouping to unrelated operations. Compare:

```text
(1 OR 0) AND 0 = 0
1 OR (0 AND 0) = 1
```

The parentheses describe different computations. We obtained different
results. A computer language needs rules to resolve grouping, but those
rules must be learned from that language rather than guessed from how an
expression looks.

## 3.8 What your experiment can honestly say

Suppose you test cancellation for every pair of byte values. There are
256 choices for the first byte and, for each, 256 choices for the mask.
That makes `256 × 256 = 65,536` pairs.

If a correct checker examines every one of those pairs and finds that
cancellation holds, it establishes the property for that complete
byte-sized model. It has not checked every longer string. Proposition 3.1
covers arbitrary finite equal lengths because its argument applies at each
position, regardless of how many positions there are.

There is another difference. A program implementing the checker runs
through some machinery. A failure in that machinery could invalidate what
you think was examined. A hand proof also requires scrutiny: a missing
case or an unjustified step can invalidate it. Neither the word *tested*
nor the word *proved* should prevent you from asking to see the work.

For these opening exercises, the executable checks accompanying the book
use Python as a reference calculation. They do not execute Orange and do
not certify its compiler. Their role is to catch transcription and example
errors while the mathematical argument states the broader property.

Schneier's quotation at the opening concerns the limits of a designer's
own inability to break a construction. Our small result illustrates the
same discipline of scope. You can now prove something useful about XOR.
That achievement does not require you to pretend that you have proved
something else about an encryption system.

## 3.9 Work at the desk

**Exercise 3.1 — Recover the definition.** Without looking back, write the
four rows of the two-input XOR table. Explain the final row in words.

**Exercise 3.2 — Compare operations.** For `1010` and `1100`, compute
bitwise AND, OR, and XOR. Keep all four positions in each result.

**Exercise 3.3 — Use a mask.** Apply the mask `00111100` to `10100110` using
XOR. Predict which positions change before calculating the output. Apply
the mask again to check your answer.

**Exercise 3.4 — Retain the right information.** An XOR result is `1101`
and the retained mask is `0110`. Recover the original input. Then explain
why the result alone would not determine the original input.

**Exercise 3.5 — Find a counterexample.** Someone claims that applying AND
with the same mask twice always restores the original input. Give a
one-bit counterexample. Explain why one counterexample is sufficient to
reject a statement that says *always*.

**Exercise 3.6 — Inspect the missing condition.** Does Proposition 3.1
specify an operation on `101` and `11`? Could a designer extend the operation
to those inputs? Distinguish “undefined by this specification” from
“impossible to define.”

**Exercise 3.7 — Check grouping exhaustively.** List all eight triples of
bits. For each, calculate `(a XOR b) XOR c` and `a XOR (b XOR c)`.
Compare the results and state exactly which domain your table covers.

**Exercise 3.8 — Separate properties.** Explain why a reversible operation
with a publicly known all-zero mask does not establish confidentiality.
State the narrower property that still holds.

**Exercise 3.9 — Change the scale.** Why are there 65,536 byte-and-mask
pairs? Why does checking them all not, by itself, check every pair of
sixteen-bit strings?

**Exercise 3.10 — Read the quantifiers.** Explain the difference between
“I found one input that works,” “every permitted input works,” and “there
is a permitted input that fails.” Which two statements cannot both be true?

Your next task is to express an operation as a complete program: say which
values it accepts, what it returns, and what every symbol in its source
means. We will not ask the machine to fill in an intention we failed to
write down.
