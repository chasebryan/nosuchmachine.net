---
title: "Worked answers: N8"
part: "Worked answers"
order: 12
description: "Worked answers for reading diagnostics and making one repair at a time."
---
**N8.1.** Check writes nothing and returns status 0. The amount that
differs from §2.1 is the `8` on `d1`. The rotation on `d2` is 8 in the
standard as well. Listing N8.2 matches the RFC vector on one input.
Proposition N7.2 still assumes that Orange's `+`, `^`, and `<<<` on
`Word[32]` denote addition modulo 2³², XOR, and left rotation. One
matching vector does not discharge that assumption.

**N8.2.** The code is `ORC0108`. The locus is line 4, column 11. The
label is `ungrouped operator`. The note says that operators from different
groups have no relative precedence, and that you parenthesize the part
that applies first. The single caret covers `^`. Deleting `^` leaves
`a + b a`, which is not a grouping of the two operations. Listing N8.4
keeps both operations and parenthesizes the sum, which is the add-then-XOR
function in Proposition N8.2.

**N8.3.** `(a + b) ^ a = 0x03020504`. `a + (b ^ a) = 0x21242326`.
`grouped_mix::sample` is the first. The second value is the other function
in Proposition N8.2. The intention in N8.3 was add, then XOR with `a`.
The parentheses in Listing N8.4 record that function. A silent check
records that the parentheses were well-formed.

**N8.4.** Add-then-widen is `(255 + 1) mod 256 = 0`, then `0` as
`Word[32]`, which is `0x00000000`. Widen-then-add is `255 + 1 = 256`,
which is `0x00000100`. Listing N8.6 is the first. The result type
`Word[32]` has room for both 0 and 256, so "whichever fits" does not
choose. Proposition N7.1 is why the compiler refuses to choose either.
The ungrouped spelling is `ORC0108`.

**N8.5.** By assumption A3, index `k` is legal when `0 ≤ k < 4`. The
integer 3 satisfies that. The integer 4 fails `4 < 4`. The label says
the indices run from 0 through 3. The four words are the RFC input, and
position 3 is `d`. The repair changes the index. Shortening the literal
would make a different array, and the diagnostic did not say the literal
had the wrong length.

**N8.6.** `i + 1` is 1, 2, 3, 4. `3 - i` is 3, 2, 1, 0. Listing N8.10
keeps the update at `[i]` and reads `x[3 - i]`, the family that stays
inside 0 through 3. Listing N8.9 is rejected with `ORC0223` before any
step, so the body does not run. The `...` is the renderer's window, not a
source token. The carets at column 58 cover `i + 1`, and that expression
is what you replace.

**N8.7.** Left is `vector()`, the program. Right is the expected array.
They differ at `[3]`. The program's word there is `0x5881c4bb`. The
claim's word is `0x00000000`. Left already matches the RFC result, so the
false `Bool` is the claim. Proposition N8.3 says replacing the claim's
last word is enough, and that `quarter_round` need not change.

**N8.8.** `--steps 7` prints `ORC0301`, reference evaluation step limit
exceeded, at `<stdin>` line 7 column 8, on the name `sample`. Standard
output is empty. The notes say at most 7 steps are permitted, no partial
value set is returned, and `--steps N` sets the budget up to 1073741824.
`--steps 8` prints `grouped_mix::sample: Word[32] = 0x03020504`. The 8
counts this run of `sample` on one input. Another input is another run,
and Proposition N8.2 was a proof about these two particular words, not a
step count. `--spec first` omits `two_specs::last`. `--spec
quarter_round` on Listing N8.11 is `ORC1016`: the module has no function
`quarter_round` without parameters.

**N8.9.** The code is `ORC0108`. The token is `<<<` on the `d1` line,
column 31, following `^`. After the parentheses, `orangec test` prints
the passing claim. Check prints nothing and returns status 0. Eval prints
nothing and returns status 0, because Listing N8.17 has no parameterless
spec. That silence means eval had no entry to run. The silence in Listing
N8.1 means a parameterless spec was accepted and, when evaluated, denoted
an array other than the RFC result. The two empty reports are different
commands with different contents available to run.

**N8.10.** One specimen is a tuple projection past the last element. The
four RFC words are a tuple, and `.4` counts from zero past `.3`. The
prediction is `ORC0223` at the `4`, with a note that a tuple's elements
are counted from zero.

**Listing N8.18 — `bad_field.or`, intentionally rejected**

```orange
edition 2026;
module bad_field {
  spec lane() -> Word[32] {
    let quad: (Word[32], Word[32], Word[32], Word[32]) = (0xea2a92f4, 0xcb1cf8ce, 0x4581472e, 0x5881c4bb);
    quad.4
  }
}
```

**Diagnostic:**

```text
error[ORC0223]: `(Word[32], Word[32], Word[32], Word[32])` has no element 4
 --> <stdin>:5:10
  |
5 |     quad.4
  |          ^ its elements are numbered 0 through 3
  = note: a tuple's elements are counted from zero
```

The caret covers `4`. Elements `.0` through `.3` are the four words.
This module is rejected, so it meets the exercise. A partner who instead
submits Listing N8.1 has written a real mistake and has not given you a
code to predict. You answer that partner with N8.1: run check, observe
the silence, then compare eval with the value the name claimed.


## Sources

**[R1] RFC 8439.** Y. Nir and A. Langley, “ChaCha20 and Poly1305 for IETF
Protocols,” June 2018, §2.1 and §2.1.1. The rotation amounts and the
quarter-round vector are those sections. Consulted 2026-10-05. This lesson
repairs transcriptions of that quarter round. It does not transcribe the
block function.

<https://www.rfc-editor.org/rfc/rfc8439>

**[Q1] Orange tests.** `docs/TESTS_2026.md`, proposed under OEP-0020, in
particular the command behavior: `orangec check` checks tests and runs
none, `orangec eval` runs none, and `orangec test` runs the root module's
tests under one step budget. A failed `left == right` reports both values
and the first difference. A test that exceeds the budget is `ORC0301` and
reports no outcome. `--spec` applies to `eval` only. The proposal is not
accepted by being implemented here, and a passing test is one `Bool` on
one run.
