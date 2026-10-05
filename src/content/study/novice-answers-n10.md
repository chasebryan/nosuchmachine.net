---
title: "Worked answers: N10"
part: "Worked answers"
order: 16
description: "Worked answers for the exercises on counting, probability, and uncertainty."
---
**N10.1.** `1/2 + 1/3 + 1/6 = 3/6 + 2/6 + 1/6 = 6/6 = 1`. The other
numeral is `3/11`. Only the first is the sum from Definition N10.2.

**N10.2.** `16/64 = 1/4` because `16*4 = 64`. Striking the digit `6` is
not Proposition N10.1. The common factor is `16`. `12/24 = 1/2` because
`12*2 = 24`. Striking the digit `2` leaves `1/4`, and `12*4 = 48`, which
is not `24`.

**N10.3.** The weights `1/2`, `1/3`, and `1/6` are nonnegative and sum to
`1`, so they form a finite probability space once each is attached to one
outcome. The weights `1/2`, `1/3`, and `1/7` sum to `41/42`, not `1`.

**N10.4.** The assignment violates Assumption N10.2. The sentence “the
draw is uniform on these four strings” would make each weight `1/4`.

**N10.5.** The probability is `1/6 + 1/6 = 1/3`. The complement is `2/3`.
They sum to `1`, as Proposition N10.3 requires.

**N10.6.** `P(the key is 00 and the first bit is 0) = 1/2` and
`P(the first bit is 0) = 2/3`, so the first conditional probability is
`3/4`. The second is `(1/2)/(1/2) = 1`.

**N10.7.** No outcome is both `00` and `11`, so the conditioning event has
probability `0`. Definition N10.7 assigns no number. Assigning zero would
invent a quotient by zero, and Proposition N10.5 would have no retained
row on which to place total weight `1`.

**N10.8.** The intersection is empty, so its probability is `0`. The
product is `(1/2)*(1/2) = 1/4`. The events are not independent.

**N10.9.** `P(the second key is A) = 1/3`. Given that the first is `A`,
the probability that the second is `A` is `0`. The product of the separate
probabilities is `1/9`. The events are not independent.

**N10.10.** There are `256*2 = 512` combined outcomes. The stated pair has
weight `1/512`. The factor `256` is the number of byte strings from
Chapter 2. The factor `2` is the number of values of one bit.

**N10.11.** The collision probability is `13/25`. `S = 3/5`. The lower
bound is `3/8`. And `3/8 ≤ 13/25 ≤ 3/5`.

**N10.12.** `S = 2`. The exact collision probability is `601/625`. The
bound `2` is weaker than the bound `1` already proved for every event.
The lower bound `2/3` still sits below `601/625`.

**N10.13.** `S = 253/365` and `S/(1+S) = 253/618`. Because
`253/618 < 1/2 < 253/365`, the bounds alone do not prove a comparison
with `1/2`. The exact collision probability is greater than `1/2` because
twice the product of the twenty-two numerators `364` through `343` is
smaller than `365` to the 22nd power. That is a fact about Assumption
N10.3 with these two integers. It is not a fact about human birthdays and
not a key-length recommendation.

**N10.14.** The expected number of colliding unordered pairs is `3/5`.
The collision probability is `13/25`. Proposition N10.13 adds expected
values without an independence hypothesis. The three pair-events are not
independent as a group: for five days, the probability that all three
pairs match is `1/25`, while the product of the three separate
probabilities is `1/125`.

**N10.15.** A byte has length `8` by Definition 2.2. The distribution has
ten keys. The brackets of `10` are `3` and `4`, because `8 ≤ 10 ≤ 16` and
no integer exponent lies strictly between `3` and `4`. Definition N10.12
assigns `log2` only when a power of two equals the count. `10` is not such
a count.

**N10.16.** The length is `16`. The distribution is uniform on the four
named strings, each of weight `1/4`. Before the extra announcement, the
uncertainty is that same list. After “the last bit is `0`,” the remaining
outcomes are `0x0000` and `0x0002`, each of conditional weight `1/2`. The
conditional list has size `2`. The worst-case trial count is `2`. The
expected trial count is `3/2`. The logarithm `2` of the original support
is not `3/2`. On the original list it is also not the expected trial count
`5/2` and not the worst-case count `4`.

```text
n10-ledger
sum-half-third = 5/6
bad-numerator-sum = 2/5
three-fraction-sum = 1/1
rejected-weights = 41/42
conditional-unequal-00 = 3/4
conditional-unequal-01 = 1/4
conditional-uniform-00 = 1/2
conditional-reverse = 1/1
second-bit-one = 1/3
second-bit-complement = 2/3
disjoint-product = 1/4
draw-product = 1/9
byte-bit-count = 512/1
byte-bit-zero = 1/512
birthday-3-5-distinct = 12/25
birthday-3-5-collision = 13/25
birthday-3-5-upper = 3/5
birthday-3-5-lower = 3/8
birthday-5-5-collision = 601/625
birthday-5-5-lower = 2/3
birthday-23-upper = 253/365
birthday-23-lower = 253/618
expected-pairs-3-5 = 3/5
triple-pair-event = 1/25
triple-pair-product = 1/125
expected-trials-4 = 5/2
early-stop-4 = 1/2
expected-trials-remaining = 3/2
sixteen-bit-count = 65536/1
```


## Source note for the epigraph

**[S8] Claude E. Shannon.** “Communication Theory of Secrecy Systems.”
*Bell System Technical Journal* 28(4), 1949, pp. 656–715. The epigraph is
the first sentence on the page whose footer is 703, in §21, “The Work
Characteristic.” Wording and page footer were checked on 2026-10-05 against
the retypeset PDF hosted by the University of Wisconsin–Madison, the same
copy used for [S1]. This is a retypeset copy, not a scan of the 1949
printing. No translation is involved. The sentence says that trying each
possible key can determine the solutions in principle, and that the amount
of work varies. It is not a method prescribed by this lesson and not a
computed work characteristic.

Source: <https://pages.cs.wisc.edu/~rist/642-spring-2014/shannon-secrecy.pdf>

Epigraph verification establishes wording and attribution, not publication-
rights clearance.


## Evidence boundary

N10 adds sixteen exercises with worked answers. The rational ledger is
recomputed by `tools/test_book_foundations.py`. That check does not execute
Orange, sample a key, or establish a cryptographic security claim. No
Orange listing was added, because a draw would require a source of choices
this lesson does not invent.

The lesson was drafted with Grok 4.7 on 2026-10-05 at the owner's
direction. It is stacked after N9 on `book/novice-journeyman-master-opening`.
N10 does not re-teach N9's vocabulary. Owner review is pending. No
key-length recommendation, deployment claim, or proof-checker acceptance
is made.
