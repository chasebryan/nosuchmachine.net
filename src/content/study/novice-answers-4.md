---
title: "Worked answers: Chapters 4–6"
part: "Worked answers"
order: 8
description: "Worked answers for the exercises on the working environment, a first program, and word arithmetic."
---
## Chapter 4 answers

**4.1.** `../notes.txt` goes from `experiments` up to `orange-study`, then
to its `notes.txt`. Starting in `orange-study`, the same path goes to
that directory's parent instead. The relative path requires a starting
point to identify a location.

**4.2.** The filename changed. The original file format and contents did
not thereby become plain Orange source. An extension signals intention;
it does not prove that the content follows the intended format.

**4.3.** Check that the buffer was saved, that the command names the intended
file, and that the working directory resolves that relative path correctly.
Also identify the actual executable if several compiler builds exist.

**4.4.** `cargo` is the build tool; `build` requests a build;
`--manifest-path compiler/Cargo.toml` selects the manifest; `-p orangec`
selects the package; `--locked` prohibits lockfile changes; `--offline`
restricts Cargo's network access. The latter does not install a missing
Rust toolchain or linker.

**4.5.** No. Rust source for the compiler was compiled into the native
`orangec` executable. An Orange source file is a separate input processed
by that tool. This baseline reference-evaluates its supported source; the
successful Rust build does not add Orange native-code generation.

**4.6.** A clearly labeled hypothetical record could name revision R,
compiler version V, working directory `/study/orange-source`, saved input
`../trial.or`, the complete `eval` command, status zero, printed output
`trial::answer: Word[8] = 0x0d`, and the hand-derived expectation thirteen.
R and V here are placeholders in an exercise answer, not real observed
revision identifiers. A real record must supply its actual values.

**4.7.** Zero reports that the command finished according to its success
convention. A listing command and a source checker have different success
conditions. Neither becomes a proof of secrecy by returning zero.

## Chapter 5 answers

**5.1.** The semicolon ends the edition declaration. Empty parentheses
state that `answer` takes no parameters. The arrow introduces its result
type; brackets supply the width eight to `Word`. The inner braces enclose
the function body, and the outer braces enclose the module body.

**5.2.** `x` receives `0xa6`, or `10100110`; `k` receives `0x3c`, or
`00111100`. Their XOR is `10011010`, or `0x9a`. Applying `0x3c` again
restores `10100110`, or `0xa6`.

**5.3.** Rename `x` in the parameter declaration and body to `value`, and
`k` in both places to `mask`. The body becomes `value ^ mask`. The types,
comma, colons, arrow, parentheses and braces do not change. This is a
consistent renaming within scope, not a different operation.

**5.4.** One choice is `spec zero() -> Word[8] { apply(0xa6, 0xa6) }`
inside the module. Equal bits XOR to zero at every position, so the
byte result is `0x00`. This fragment needs the surrounding edition,
module and `apply` declaration from Listing 5.2.

**5.5.** Removing a required closing brace violates the grammar. The
literal 256 is outside `Word[8]`'s admitted literal range. Replacing 13
with 12 still supplies an allowed value, but it does not satisfy an
external requirement that the answer be thirteen.

**5.6.** `masks` is the module; `recovered` is the function; `Word[8]`
is the result type; `0x0b` is the displayed value eleven. That line
reports one parameterless computation containing particular calls.
It does not enumerate every argument pair accepted by `apply`.

**5.7.** A comment contributes a statement of claimed intent, not evidence
that the body implements it. An authentication claim needs an identified
construction, an acceptance rule, the protected message and authorized
sources, an adversary model, key assumptions and supporting reasoning or
other appropriately scoped evidence.

**5.8.** The declared name and qualified display name change. The body's
calculation and its evidentiary status do not. Naming a function
`proved_answer` creates no proof object or proof-checking result.

## Chapter 6 answers

**6.1.** `259 = 1 × 256 + 3`; `511 = 1 × 256 + 255`;
`512 = 2 × 256 + 0`; `-2 = -1 × 256 + 254`. The representatives are
3, 255, 0 and 254, each in the required range.

**6.2.** Literal admission requires the literal itself to fit. The
expression instead uses two individually admitted literals and an
addition operation defined to return the reduced word value. That
value is zero. These are different semantic rules, not an exception
invented after a failed test.

**6.3.** The byte result is four. The sixteen-bit and `Int` results both
have value 260. A `Word[16]` still has a fixed domain and wrapping
arithmetic, while `Int` denotes mathematical integers without fixed-width
wraparound. Equal values in this example do not erase those differences.

**6.4.** `0xa5` is `10100101`. Left shift gives `01001010` (`0x4a`);
right shift gives `01010010` (`0x52`); left rotation gives `01001011`
(`0x4b`); right rotation gives `11010010` (`0xd2`). The departing one
is discarded by a shift and retained by a rotation.

**6.5.** `0x01` and `0x81` both shift left by one to `0x02` at width
eight. Their differing most significant bit is discarded. The result
does not contain a choice between those two originals.

**6.6.** Write the computed boundary amount as `(8)`, not bare `8`.
Left rotations by zero and eight both give `0xa5`; by nine,
`0x4b`. Left shift by eight gives `0x00` under the implemented S3r
amount semantics. That boundary behavior must not be inferred for an
unidentified older compiler or another language.

**6.7.** With multiplier two, inputs zero and 128 both produce zero
modulo 256. The multiplier is nonzero, but the transformation is not
one-to-one, so the result and multiplier do not uniquely recover an
input.

**6.8.** `(1 + 1) ^ 1` yields three; `1 + (1 ^ 1)` yields one.
The ungrouped form fails to specify which of these meanings is intended
under Orange's operator-family rules.

**6.9.** Starting at zero, add seven to obtain `0x07`; XOR `0x3c` to
obtain `0x3b`; rotate left to obtain `0x76`. Reverse by rotating right
to `0x3b`, XORing to `0x07`, and subtracting seven to obtain zero.

**6.10.** The mathematical argument establishes reversal for every
byte under the stated word operations. The observed run establishes
what the identified tool reported for that saved example in that run.
Neither alone establishes confidentiality or compiler correctness.
Neither qualifies the construction for production use.

**6.11.** The forward result is `0x7a`. Subtracting seven first gives
`0x73`, which does not undo the last forward operation, the rotation.
XOR then gives `0x4f`; rotating right gives `0xa7`, not `0xfa`.
The inverse went wrong in its first step, not only in its final result.

**6.12.** A rotation moves every bit by the same number of positions around
the word, so each original one occupies exactly one resulting position.
None is created or destroyed. The converse is false. Exchanging only the
two most significant bits preserves the count of ones, but it is not a
rotation. On `10100000` the exchange yields `01100000`. The eight rotations
of `10100000` are `10100000`, `01000001`, `10000010`, `00000101`,
`00001010`, `00010100`, `00101000`, and `01010000`. The exchanged byte is
not among them. Some other bytes hide the difference: exchanging the same
two bits of `10000000` yields `01000000`, which is one of its rotations.
One agreeing byte does not make the operations the same.


## Sources and epigraph record

**[S4] Bruce Schneier.** “The Process of Security,” *Information Security*,
April 2000. The seven-word quotation is the opening sentence of the third
paragraph of the essay on the author's page, the paragraph immediately
before the heading “Will We Ever Learn?”. Wording and context checked
2026-10-05. It concerns security as continuing practice, not a claim that
the shell setup in this book guarantees security.

<https://www.schneier.com/essays/archives/2000/04/the_process_of_secur.html>

**[S5] Alan M. Turing.** “Computing Machinery and Intelligence,” *Mind*
59(236), 1950, pp. 433–460. The nineteen-word quotation is the concluding
sentence. Checked visually on the final page of the 22-page university-
hosted transcription on 2026-10-05. The transcription's first-line volume
number is erroneous; bibliographic volume 59 belongs to the original.
The publisher's record confirms that volume and pagination.
No translation or alteration of the quoted sentence is involved.

<https://www.csee.umbc.edu/courses/471/papers/turing.pdf>

<https://doi.org/10.1093/mind/LIX.236.433>

**[S6] Ronald L. Rivest.** “The RC5 Encryption Algorithm,” *Fast Software
Encryption*, proceedings of the 1994 Leuven workshop, published 1995,
pp. 86–96. Ten quoted words from the introduction's simplicity objective
on printed p. 87, checked visually against the author-hosted paper, PDF
page 2, on 2026-10-05. That objective follows the objectives for a
symmetric cipher, hardware or software, speed, adaptable word length, a
variable number of rounds, and a variable-length key. It is not the first
objective in the list. The historical design objective is not contemporary
security guidance or an endorsement of RC5 deployment.

<https://people.csail.mit.edu/rivest/pubs/Riv94.pdf>

Epigraph verification establishes wording and attribution, not publication-
rights clearance. The surrounding lessons, worked examples and exercises
are original drafting for this book, not adaptations of those papers.

**[O1] Orange compiler guide.** `compiler/README.md` at baseline commit
`21ae40f77b691099b41ee22990bad3322350eb46`, especially “Run,” “Identify the
compiler on your path,” and the implemented-slice boundary. The baseline
has implemented proposals that are still in owner review.

**[O2] Orange source and literal grammar.** `docs/LANGUAGE_2026.md`,
`docs/SEMANTICS_2026.md`, and the CLI/literal conformance tests at the
same baseline. The book changes neither the grammar nor its acceptance
status.

**[O3] Orange pure-expression semantics.** `docs/EXPRESSIONS_2026.md`
and the implemented S3b conformance evidence at the same baseline:
word widths, typed literals, calls, operator families, integer and
word arithmetic, shifts and rotations. Later amount rules are covered
by [O4] rather than silently attributed to the original slice.

**[O4] Orange computed-amount semantics.** `docs/AMOUNTS_2026.md` and
implemented S3r conformance evidence at the same baseline. These distinguish
guarded literal amounts from computed amounts,
including large and negative values. Listing 6.3 uses explicitly grouped
computed boundary amounts; it does not discard the retained literal guard.

**[T1] GNU Bash.** The installed Bash built-in help for `cd`, `pwd` and
`echo`, together with an isolated local check of directory commands,
quoted paths and `$?`, were consulted on 2026-10-05. The online reference
manual could not be retrieved in this session and is linked for further
study, not represented as inspected. The chapter uses a POSIX-style shell
track and makes no claim of PowerShell command equivalence.

<https://www.gnu.org/software/bash/manual/bash.html>

**[T2] IETF RFC 3629.** “UTF-8, a transformation format of ISO 10646,”
November 2003, especially §3. The introductory source uses the ASCII
subset of UTF-8; this is not a complete chapter on text encoding.

<https://www.rfc-editor.org/rfc/rfc3629>

**[T3] Rust project.** *The Rust Programming Language*, “Installation.”
Consulted 2026-10-05. Follow its platform-specific prerequisites rather
than interpreting one command track as a tested installer for every OS.

<https://doc.rust-lang.org/book/ch01-01-installation.html>

**[T4] Rust project.** *The Cargo Book*, `cargo build` reference, and
*The rustup book*, toolchain overrides. Consulted 2026-10-05. These
support build-flag and toolchain-pin explanations, not an assertion
that every reader's environment has been tested.

<https://doc.rust-lang.org/cargo/commands/cargo-build.html>

<https://rust-lang.github.io/rustup/overrides.html>

**[T5] Git project.** `git-clone`, `git-checkout` and `git-rev-parse`
reference manuals. Consulted 2026-10-05. A pinned revision identifies
source but does not by itself authenticate its origin.

<https://git-scm.com/docs/git-clone>

<https://git-scm.com/docs/git-checkout>

<https://git-scm.com/docs/git-rev-parse>

**[M1] Euclidean division.** The existence and uniqueness argument is
provided in §6.3. It uses the ordinary ordered integers and a positive
modulus. Negative values use a nonnegative remainder; readers must not
substitute another language's `%` convention without checking it.


## Evidence boundary

The opening in `NOVICE_OPENING.md` remains byte-for-byte unchanged from
the approved installment. The continuation adds three chapters, nine
complete Orange listings (seven valid and two deliberately rejected),
and 27 exercises with worked answers.

Expected-output blocks are expectations until supported by a recorded
execution of the exact listings. The accompanying Rust integration test
reads the listing blocks from this manuscript and invokes the actual
`orangec` binary. A separate local Python check covers arithmetic,
exercise numbering and document structure; it is not an Orange interpreter.
The delivery validation record distinguishes executed checks from checks
awaiting a build environment. No general compiler proof, secrecy claim,
independent review or platform-wide installation validation is implied.

The new drafting and tests are AI-assisted with ChatGPT (GPT-6 Astra Pro)
at Chase Bryan's direction, 2026-10-05. The previous installment received
owner approval; the newly added prose and implementation checks require
review. The project's Current/Directed/Proposed/Future distinctions,
legal boundaries and original manuscript source disclosures remain in
force. This is a continuation of the same Orange Book, not a separate
beginner product.
