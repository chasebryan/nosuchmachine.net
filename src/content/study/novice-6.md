---
title: "Chapter 6: Words Have Edges"
part: "Part 1, The Novice"
order: 7
description: "Fixed-width words, wrapping, shifts, rotations, and why grouping is part of the calculation."
---
> “RC5 should be simple. It should be easy to implement.”
>
> — Ronald L. Rivest, “The RC5 Encryption Algorithm,” introduction,
> p. 87. [S6]

## 6.1 Follow the carry

Write the largest byte-sized unsigned value, then add one on paper without
limiting the number of positions:

```text
  11111111
+ 00000001
----------
 100000000
```

The result requires nine positions. Its value is 256. The eight-position
format has not mysteriously gained another value; the calculation has
produced a result outside that format's unsigned range.

Several language designs could respond differently. One might reject the
operation, one might produce a wider result, and one might retain eight
positions according to an explicit wrapping rule. The machine's finite
storage does not, by itself, specify which language rule applies.

The implemented baseline defines `+`, `-`, and `*` on `Word[w]` by arithmetic
modulo two to the power `w`. The letter `w` stands for that width, and the
result keeps it. This is the baseline's rule for the fragment these chapters
run, not an acceptance of the proposal that states it. We will now calculate
the rule by hand. [O3]

## 6.2 Count in complete turns

Draw sixteen labeled positions, zero through fifteen, in a circle or in a
row that returns to its beginning. This is a paper model, not an Orange
`Word[4]` declaration: the baseline word types used here have widths 8, 16,
32 and 64. [O3]

Start at fourteen and advance five steps. You visit fifteen, zero, one,
two, three. Ordinary addition gives nineteen; counting around a sixteen-
position cycle leaves you at three. The difference is one complete turn
of sixteen.

A positive **modulus** specifies the size of the cycle. To **reduce** an
integer modulo that modulus, choose its representative from zero through
one less than the modulus. A **representative** is the selected number used
to stand for all integers differing from it by complete turns.

For modulus sixteen:

```text
19 = (1 × 16) + 3
35 = (2 × 16) + 3
```

Nineteen and thirty-five reduce to three. So does three itself. Their
ordinary numerical values have not become equal. They share the same
representative under the specified modular relation.

We write `19 ≡ 3 (mod 16)` and read it as “nineteen is congruent to three
modulo sixteen.” The symbol `≡` names **congruence**, not ordinary equality.
Two integers are congruent modulo a positive modulus when their difference
is an integer multiple of that modulus.

We will usually choose a modulus of at least two. The width-eight word
uses 256, giving representatives zero through 255. Thus 256 reduces to
zero and 257 reduces to one.

## 6.3 Negative integers belong to the rule too

An **integer** is a whole number, its negative, or zero. A negative integer
can describe steps in the opposite direction from positive steps. Start
at zero in the sixteen-position model and move back one step: you reach
fifteen.

That agrees with the equation:

```text
-1 = (-1 × 16) + 15
```

Multiplication by negative one changes a number to its opposite. The
right side is negative sixteen plus fifteen, which is negative one. Our
representative, fifteen, lies in the required range.

For a byte-sized word, subtracting one from zero similarly gives 255 under
the word operation:

```text
-1 = (-1 × 256) + 255
```

Do not write `-1 = 255` as an ordinary integer equation. They are congruent
modulo 256, not equal as integers.

**Proposition 6.1 — A nonnegative remainder.** Take any integer `n` and any
positive integer `m`. There is exactly one pair of integers `q` and `r`
such that `n = q × m + r` and `0 ≤ r < m`. The symbol `≤` means “less than
or equal to,” and `<` means “strictly less than.” `q` counts complete turns.
`r` is the representative. When `n` is negative, `q` may be negative. [M1]

**Proof.** The positive integer `m` is at least one.

Suppose `n` is at least zero. Consider the finite list whose step `k` is
`k × m`, for `k` from zero through `n + 1`. Step zero is zero, which does
not exceed `n`. Step `n + 1` is `(n + 1) × m`, which is at least `n + 1`
and therefore exceeds `n`. Let `q × m` be the last entry in this list that
does not exceed `n`. The final entry exceeds `n`, so `q × m` has a successor
in the list. Set `r = n - (q × m)`. Then `r` is at least zero. The successor
is `(q × m) + m` and exceeds `n`, so `r` is strictly less than `m`.

Suppose `n` is negative. Let `t` be the positive distance from `n` up to
zero, so `n` lies `t` ones below zero. Start at zero and subtract `m` once
per step, for `t` steps. Each subtraction moves down by at least one,
because `m` is at least one, so `t` subtractions move down by at least `t`
and reach or pass `n`. In that finite list, from the starting zero through
the result of the `t`-th subtraction, take the first entry that is less
than or equal to `n`. That entry is a multiple of `m`; call it `q × m`.
Here `q` is negative. Zero itself is greater than `n`, so this entry has
a preceding one, and that preceding entry is greater than `n`. Consecutive
entries differ by `m`, so `n` is at least `q × m` and strictly less than
`(q × m) + m`. Set `r = n - (q × m)`. Then `0 ≤ r < m`.

For uniqueness, suppose two pairs both express `n` in the required form.
Their remainders then differ by an integer multiple of `m`. Each remainder
lies from zero through `m - 1`, so that difference lies strictly between
`-m` and `m`. The only multiple of `m` strictly between those bounds is
zero. Thus the remainders agree. The two turn counts then differ by an
integer, and that integer's product with `m` is zero. A positive `m` times
a positive integer is positive, and a positive `m` times a negative integer
is negative, so the only integer with product zero is zero. The turn counts
agree as well.

Each integer is therefore congruent to exactly one representative in range.
Congruent integers share that representative.

## 6.4 Let the type choose the arithmetic

Save the following as `word_edges.or` in the study directory.

**Listing 6.1 — `word_edges.or`**

```orange
edition 2026;
module word_edges {
  spec wrapped() -> Word[8] {
    255 + 1
  }

  spec backward() -> Word[8] {
    0 - 1
  }

  spec product() -> Word[8] {
    200 * 2
  }

  spec integer_sum() -> Int {
    255 + 1
  }

  spec wider_sum() -> Word[16] {
    255 + 1
  }
}
```

In Orange source, `*` writes multiplication. The mathematical `×` from our
paper equations is not the operator spelling in this program. `Int` is the
mathematical-integer type. Its arithmetic does not wrap at a fixed machine
width, although a real evaluator still has finite resources and can reject
work exceeding its implementation limits. [O3]

Predict every output before evaluating:

```sh
./compiler/target/debug/orangec eval ../word_edges.or
```

**Expected evaluation output:**

```text
word_edges::wrapped: Word[8] = 0x00
word_edges::backward: Word[8] = 0xff
word_edges::product: Word[8] = 0x90
word_edges::integer_sum: Int = 256
word_edges::wider_sum: Word[16] = 0x0100
```

Two hundred times two gives four hundred as an integer. One complete turn
of 256 leaves 144; hexadecimal `0x90` represents 144. The sixteen-bit
addition has more range, so 256 is still represented directly there.
The `Int` result also has value 256, but for a different reason: it does
not use fixed-width wrapping arithmetic.

Why was Listing 5.3 rejected while `wrapped` works? In `wrapped`, both
literals fit their expected word type and the defined addition produces a
word result. In Listing 5.3, the single literal `256` itself does not fit
`Word[8]`. Literal admission and arithmetic reduction are different rules.
The book must teach both rather than replacing them with “everything wraps.”
[O2, O3]

## 6.5 Reduction forgets a count, not a position

Reduction modulo 256 maps integer zero, 256, 512 and many other integers
to the same word value. From that word alone, you cannot recover how many
complete turns were removed. Information has been discarded by that map.

But adding a retained constant to an already byte-sized value is reversible
within the byte-sized domain: subtract the same constant modulo 256. For
example, 250 plus ten wraps to four, and four minus ten wraps back to 250.

The example is one pair, not the argument. Let `x` be any byte, so
`0 ≤ x < 256`, and let `c` be the retained integer. Proposition 6.1 supplies
`q` and `r` with `x + c = (q × 256) + r` and `0 ≤ r < 256`. Then
`r - c = x - (q × 256)`, so `r - c` and `x` differ by a multiple of 256.
They are congruent. Their shared representative is `x`, because `x` is
already in range. Word subtraction denotes that representative, so
subtracting `c` from `r` returns `x` for every byte.

There is no contradiction. One statement concerns arbitrary integers mapped
into a smaller domain; the other concerns a transformation within a fixed
domain with the added constant retained.

This distinction resembles §3.6, but it is a new application: count which
information is available before asking whether a transformation can be
undone. “It loses information” and “it is reversible” can both become vague
claims when their inputs and retained data are not identified.

Multiplication behaves differently. Modulo 256, both zero and 128 become
zero after multiplication by two. With only the result and the retained
multiplier, you cannot tell those two inputs apart. An operation's familiar
integer name does not guarantee an inverse inside a different arithmetic.
We will derive the exact conditions for modular inverses later.

## 6.6 Move the positions without changing the width

Return to the byte `10000001`, or `0x81`. A **left shift by one** moves
each bit one position toward the more significant end, discards the bit
that leaves that end, and inserts zero at the other end. A **right shift
by one** does the opposite, inserting zero at the most significant end.
Here we are discussing unsigned logical shifts, not signed arithmetic
right shifts from other languages. [O3, O4]

The **most significant** position has the largest binary place value;
the **least significant** has the smallest. For our written byte, these
are the leftmost and rightmost positions, respectively.

```text
Original:      10000001
Left by one:   00000010
Right by one:  01000000
```

The original integer value is 129. Left shift by one corresponds to
multiplication by two followed by reduction to the word width: 258 becomes
two. Right shift by one corresponds to integer division by two with the
nonnegative remainder discarded: 129 gives quotient 64 and remainder one.
For a nonnegative shift amount `s`, the factor is two to the power `s`. [O4]

A **rotation** keeps the departing bits and brings them back at the other
end. It changes positions without dropping the bits:

```text
Original:        10000001
Rotate left 1:   00000011
Rotate right 1:  11000000
```

If those differences feel small, trace the leftmost one in the original.
A left shift discards it. A left rotation brings it into the rightmost
position. The other seven moves are the same in this example; the returning
bit explains the difference between `0x02` and `0x03`.

## 6.7 Read every angle bracket

Orange spells left shift `<<` and right shift `>>`. It spells left rotation
`<<<` and right rotation `>>>`. One additional angle bracket changes the
operation. [O3, O4]

Save this complete file as `movement.or`:

**Listing 6.2 — `movement.or`**

```orange
edition 2026;
module movement {
  spec shifted_left() -> Word[8] {
    0x81 << 1
  }

  spec shifted_right() -> Word[8] {
    0x81 >> 1
  }

  spec rotated_left() -> Word[8] {
    0x81 <<< 1
  }

  spec rotated_right() -> Word[8] {
    0x81 >>> 1
  }

  spec restored() -> Word[8] {
    (0x81 <<< 1) >>> 1
  }
}
```

**Expected evaluation output:**

```text
movement::shifted_left: Word[8] = 0x02
movement::shifted_right: Word[8] = 0x40
movement::rotated_left: Word[8] = 0x03
movement::rotated_right: Word[8] = 0xc0
movement::restored: Word[8] = 0x81
```

Use `check` and `eval` with `../movement.or`, as you did for the previous
files. The final function rotates and then reverses that rotation. It
returns the original byte because every position returns to its starting
place. Number the positions `0` through `w - 1`, starting at the most
significant end. One left rotation sends the bit at position `0` to position
`w - 1` and sends every other bit one step toward position `0`. One right
rotation sends each of those bits back. Repeat the left rotation a retained
number of times, then the right rotation the same number of times: each bit
is back in its starting position. The listing is that accounting for one
step on a byte. It does not depend on which positions held ones, or on the
width being eight.

By contrast, shifting left and then shifting right can fail to restore the
original. In our example, `0x81` shifts left to `0x02`, then right to
`0x01`. The first shift discarded a bit; the second has no way to infer it.
Keeping the width the same did not preserve all the information.

## 6.8 Zero, a complete turn, and one turn too many

A rotation by zero changes no positions. A rotation by exactly the word
width makes one complete turn and also returns the original. A rotation
by the width plus one has the same effect as a rotation by one.
For a positive width `w`, the effective rotation amount is the amount
reduced modulo `w`. That reduction is Proposition 6.1 with modulus `w`.
A negative amount is a positive number of steps in the other direction;
its representative is how many forward steps land in the same place.

A shift is different. In the implemented S3r rules at this baseline, a
computed shift by a distance of the width or more produces zero. There is
no returning bit. A negative amount reverses the direction, and the distance
is then the absolute value. If that distance is still the width or more,
the result is zero. Unlike a rotation, the shift amount is not folded
modulo the width. These are the baseline's reference rules, not a promise
that every host language or processor interprets its shift instructions
the same way. [O4]

One syntax rule matters here. A bare literal amount is checked against the
word width: on a byte, `x << 8` is rejected, because a literal amount must
be from zero through seven. S3r treats a grouped expression, such as `(8)`,
as a computed amount instead. Thus `x << (8)` is accepted and produces
zero. Likewise, `x <<< (8)` expresses a complete computed turn. [O4]

The parentheses do not change the number eight. They change which source
form the checker sees. The literal restriction is a diagnostic guard; the
computed rule supplies a meaning for values obtained from expressions.
Reading only the arithmetic and ignoring that distinction would give you
correct mathematics in a rejected program.

The next listing makes the intended computed boundary amounts explicit.

**Listing 6.3 — `boundary_moves.or`**

```orange
edition 2026;
module boundary_moves {
  spec no_turn() -> Word[8] { 0x81 <<< 0 }
  spec full_turn() -> Word[8] { 0x81 <<< (8) }
  spec extra_turn() -> Word[8] { 0x81 <<< (9) }
  spec lost_left() -> Word[8] { 0x81 << (8) }
  spec lost_right() -> Word[8] { 0x81 >> (9) }
  spec reverse_direction() -> Word[8] { 0x81 <<< (-1) }
}
```

**Expected evaluation output:**

```text
boundary_moves::no_turn: Word[8] = 0x81
boundary_moves::full_turn: Word[8] = 0x81
boundary_moves::extra_turn: Word[8] = 0x03
boundary_moves::lost_left: Word[8] = 0x00
boundary_moves::lost_right: Word[8] = 0x00
boundary_moves::reverse_direction: Word[8] = 0xc0
```

An older compiler may reject the computed forms that this implemented
slice defines. The current compiler still rejects bare out-of-range
literals. That is why both the exact source and the revision record in
Chapter 4 belong with the example. Do not “fix” a book by changing a
negative example into a positive one without also checking which semantics
the book targets.

## 6.9 Group first, then calculate

Consider two calculations on byte-sized values:

```text
(1 + 1) XOR 1
1 + (1 XOR 1)
```

The first adds one and one to obtain two, then XORs with one to obtain
three. The second XORs one with one to obtain zero, then adds one to
obtain one. Grouping changes the result even though the same three
input values and two operations appear.

Orange does not let an unparenthesized mixture of addition and XOR choose
between those meanings by your visual preference. Group the operations
explicitly. [O3]

**Listing 6.4 — `grouping.or`**

```orange
edition 2026;
module grouping {
  spec add_first() -> Word[8] { (1 + 1) ^ 1 }
  spec xor_first() -> Word[8] { 1 + (1 ^ 1) }
}
```

**Expected evaluation output:**

```text
grouping::add_first: Word[8] = 0x03
grouping::xor_first: Word[8] = 0x01
```

The corresponding ungrouped expression is deliberately invalid:

**Listing 6.5 — `ungrouped.or`, intentionally rejected**

```orange
edition 2026;
module ungrouped {
  spec answer() -> Word[8] { 1 + 1 ^ 1 }
}
```

The diagnostic should identify missing grouping between operator families.
The rule is not that Orange refuses every expression with several
operators. It is that these families do not have an implicit relative
precedence that you may rely on. [O3]

## 6.10 A small reversible construction

You now have three operations that can be combined on a byte: add a
retained value, XOR with a retained mask, and rotate by a retained amount.
Each has an inverse in the stated domain. Apply their inverses in the
opposite order to undo their composition.

Use a fixed educational rule: add seven, XOR with `0x3c`, then rotate
left by one. This is **not a secure cipher**. It is a small construction
for studying composition and its inverse; its constants are public,
its domain has only 256 values, and we make no confidentiality claim.

**Listing 6.6 — `small_round.or`**

```orange
edition 2026;
module small_round {
  spec forward(x: Word[8]) -> Word[8] {
    ((x + 7) ^ 0x3c) <<< 1
  }

  spec backward(y: Word[8]) -> Word[8] {
    ((y >>> 1) ^ 0x3c) - 7
  }

  spec example() -> Word[8] {
    forward(0xfa)
  }

  spec recovered() -> Word[8] {
    backward(forward(0xfa))
  }
}
```

Trace the forward operation on `0xfa`, which is 250. Adding seven wraps
to one. XOR with `0x3c` gives `0x3d`. Rotating left by one gives `0x7a`.
Now reverse: rotate right to `0x3d`; XOR the same mask to obtain one;
subtract seven modulo 256 to obtain 250.

**Expected evaluation output:**

```text
small_round::example: Word[8] = 0x7a
small_round::recovered: Word[8] = 0xfa
```

The particular trace is a worked example. The general argument identifies
the intermediate value after each inverse operation. Right rotation undoes
the final left rotation. XOR with the retained mask undoes the preceding
XOR by Proposition 3.1. Subtracting seven modulo 256 undoes the initial
addition, by the argument in §6.5. Every permitted byte therefore returns
to itself under those definitions.

Notice the order. Subtracting seven first would generally act on the
rotated, masked value rather than on the value to which seven was added.
Inverses must be matched to the operations they undo, not collected in an
arbitrary order because they look familiar.

Rivest's epigraph introduces simplicity as a design goal for RC5; its
surrounding discussion also values a structure that can be analyzed.
That historical quotation is not a recommendation to deploy RC5 or our
small construction. Here the useful lesson is visible in six lines of
source: a compact program can be worth a careful derivation. [S6]

## 6.11 Work at the desk

**Exercise 6.1 — Reduce by hand.** Find the representatives of 259, 511,
512 and -2 modulo 256. For each, give an equation of the form
`n = q × 256 + r` with `0 ≤ r < 256`.

**Exercise 6.2 — Distinguish a literal from an operation.** Explain why
`256` is rejected as a `Word[8]` literal while `255 + 1` is permitted as
an expression of that type. What result does the latter expression denote?

**Exercise 6.3 — Follow the type.** Predict `250 + 10` as `Word[8]`, as
`Word[16]`, and as `Int`. Explain which numerical results agree and why
the agreeing types are still not identical.

**Exercise 6.4 — Track a departing bit.** Starting with byte `0xa5`,
calculate left shift one, right shift one, left rotation one and right
rotation one. Show all eight positions each time.

**Exercise 6.5 — Inspect information loss.** Give two distinct bytes with
the same result after a left shift by one. Explain why the shifted result
alone does not identify which original was used.

**Exercise 6.6 — Use a complete turn.** For byte `0xa5`, predict rotation
left by zero, eight and nine positions. Contrast the result of shifting
left by eight. State which baseline semantics you are using and how the
amount eight must be written in Orange source to request the computed rule.

**Exercise 6.7 — Reject an invalid inference.** A reader notices that
modular addition by seven is reversible and concludes that modular
multiplication by any nonzero value must be reversible too. Give a
counterexample modulo 256.

**Exercise 6.8 — Repair the grouping.** Write two parenthesizations of
`1 + 1 ^ 1` that Orange can distinguish. Compute both and explain why the
unparenthesized form is not a harmless abbreviation.

**Exercise 6.9 — Derive before running.** Apply Listing 6.6 to input zero,
then undo the result by hand. Identify the exact order of inverse operations.

**Exercise 6.10 — Delimit the claim.** You have a proof of the small
construction's mathematical reversibility and a successful run of its
Orange example. State a claim supported by each. Name two further claims
that neither fact establishes by itself.

**Exercise 6.11 — Find the first wrong step.** A proposed inverse first
subtracts seven, then XORs `0x3c`, then rotates right. Apply it to the
forward result for input `0xfa`. Find the first intermediate value that
no longer undoes the corresponding forward step.

**Exercise 6.12 — Establish a general fact.** Explain why a fixed-width
rotation preserves the number of one bits. Does preserving that number,
by itself, establish that an arbitrary transformation is a rotation?

The next lesson will name intermediate values and let a program carry
several of them at once. You will be able to inspect a computation at each
stage rather than hiding its order inside one long expression.
