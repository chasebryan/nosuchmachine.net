# No Such Machine portfolio research

Reviewed 2026-10-01. All 63 public repositories returned by the live GitHub connector were reviewed. Private repositories were excluded from research and publication.

The portfolio contains 40 worthwhile projects: 18 core entries and 22 entries under Further explorations. Orange, AIRWAV and CENTL are featured. Further explorations preserve original work that has a narrower utility, early prototype, specification, research or creative scope.

Read-only review used repository metadata, READMEs, recursive trees and representative implementation or specification files. No repository code, hardware acceptance procedures, security tools or test suites were executed. Existing validation claims were read rather than independently reproduced.

## Core selection — 18 projects

### Orange

A mathematical language for cryptography, with a Rust frontend and exact reference evaluator.

Status: Pre-alpha language

Cryptographic software crosses mathematics, implementation and security claims. Orange aims to keep those meanings explicit in one language and make each claim traceable to the evidence that supports it.

The implemented compiler separates lexing, bounded parsing, typed semantic analysis, a reference core and deterministic evaluation. Mathematical integers, fixed-width words and modular values have explicit semantics; standards-based fixtures make the current language fragment inspectable.

Capabilities:

- Typed specification functions and deterministic reference evaluation
- Exact integer, word and modular arithmetic with checked array and index rules
- Bindings, bounded loops, modules and executable cryptographic test-vector fixtures

Limits:

- Pre-alpha; native code generation and proof checking remain future work
- No independent review or whole-project formal verification
- Evaluation of a specification does not establish constant-time behavior or cryptographic security

[Repository](https://github.com/chasebryan/orange)

### AIRWAV

A native Rust observation terminal for the RTL-SDR Blog V4, combining spectrum analysis, bounded IQ recording and replay with evidence-gated protocol labels.

Status: RF observation prototype

Keep measured radio energy, recorded IQ and verified protocol frames distinct so that an observation does not silently turn into an unsupported identity claim.

Receiver and DSP workers feed measured FFT spectra and signal islands into a Ratatui interface. Separate recording and decoder crates maintain a clear boundary between observed energy, captured evidence and verified protocol frames.

Capabilities:

- Hann-window FFT, spectral averaging and local-noise signal-island detection
- Bounded pre/post-trigger IQ capture, AWR journals, SQLite indexing and BLAKE3 artifact integrity
- Offline replay, AM/FM/NFM listening and WAV export
- Mode S, ACARS, APRS, POCSAG and SAME decoding with CRC, parity or header gates
- Separate browser observer for synthetic and file IQ

Limits:

- Physical RTL-SDR V4 and speaker acceptance remains outstanding
- Synthetic/browser observations are not live USB capture
- Not a production ATC/P25 system; no transmitter support

[Repository](https://github.com/chasebryan/airwav)

### CENTL

An offline scientific workbench built around exact rational arithmetic and inspectable computation.

Status: Scientific workbench

Scientific computation should preserve the distinction between an exact result, a numerical approximation and a conjecture. CENTL brings arithmetic, algebra, STEM tools and research records into a local computing environment.

A Rust engine implements big integers, rational values, symbolic operations and domain kernels. A local web interface and desktop hosts expose the same computation surface; notebooks, plotting and export support a reproducible working record.

Capabilities:

- Exact rational arithmetic and canonical polynomial operations
- Scientific notebooks, workspace history and Jupyter notebook export
- Function plotting and physics/chemistry computation modules
- Desktop wrappers and a local browser interface

Limits:

- Operation coverage and numerical guarantees vary by module
- A computation or research search is not a proof of an arbitrary conjecture
- Optional academic search and AI integrations require network access

[Repository](https://github.com/chasebryan/centl)

### Sigil

A local-first cryptography and cryptology workbench with a Go command line and embedded browser interface.

Status: Usable local workbench; engineering prototype without independent security audit.

Provide a local workspace for inspecting bytes, learning cryptology and performing standard cryptographic operations without a cloud dependency.

A shared Go crypto layer serves CLI and GUI operations. Cryptographic primitives use Go's standard library. The profile pipeline combines statistical measures into bounded research triage. Envelope records carry authenticated chunk metadata; the local HTTP GUI has per-process tokens, same-origin checks and a strict CSP.

Capabilities:

- Hashing and HMAC with SHA-2 and SHA-3
- CSPRNG bytes and passphrases
- Byte entropy, bit balance, coincidence, block repetition and autocorrelation reports
- Ed25519 key generation, signing and verification
- Chunked AES-256-GCM envelopes derived from passphrases
- Embedded local browser workspace with JSON result export

Limits:

- Not externally audited or FIPS validated.
- Statistical profiling is triage and does not prove a cipher, key or source.
- Legacy MD5/SHA-1 are exposed only as deprecated digest-inspection options.

[Repository](https://github.com/chasebryan/sigil)

### snoot

An offline cryptography inventory tool that helps teams locate classical public-key cryptography and plan post-quantum migration.

Status: Experimental release · v0.1.0

Locate classical public-key cryptography before a post-quantum migration, and preserve the resulting inventory in formats that teams can review and use in CI.

Four Rust detection engines examine source syntax, key material, dependency manifests and TLS configuration. Tree-sitter queries cover source languages; structured parsers support other evidence. Findings flow into portable baselines and machine-readable reports.

Capabilities:

- Inventories RSA, elliptic-curve, DSA and DH surfaces across source, keys, dependencies and configuration
- Exports SARIF, JSON and CycloneDX 1.6 cryptographic bills of materials
- Provides a GitHub Action, reviewed baselines and severity gates
- Maps findings to NIST post-quantum replacement families

Limits:

- Detection is heuristic and recall is unmeasured
- No data-flow or transitive dependency analysis; source code only
- A clean scan does not establish quantum safety or complete coverage

[Repository](https://github.com/chasebryan/snoot)

### Kaiju

A Rust binary-analysis workbench that turns executable bytes into inspectable maps, strings, symbols and control-flow facts.

Status: Early but substantial reverse-engineering workbench.

Make executable structure inspectable by keeping binary loading, addresses, control flow and analysis facts in a bounded and understandable pipeline.

Small Rust crates separate addresses and memory maps, loaders, disassembly, IR, analysis passes, project state and interface. The headless pipeline is bytes → loader → memory map → project facts → analysis. Direct branches and call targets seed bounded recursive CFG discovery.

Capabilities:

- ELF, PE and Mach-O format detection and limited metadata parsing
- Memory mapping, imports, exports, relocations and dependencies
- ASCII and UTF-16LE string extraction
- Conservative x86-64 function and control-flow discovery
- Bounded IR summaries and data/string cross-references
- Project JSON and .kaiju snapshots
- Native Rust desktop workbench
- User-supplied PCAP and network-evidence topology inspection

Limits:

- Executable-format parsers and x86-64 decoder cover limited subsets.
- No decompiler, full disassembly, advanced indirect-flow recovery or plugin runtime.
- No privileged live interface-capture backend.

[Repository](https://github.com/chasebryan/kaiju)

### TRACTOR

A native research application that preserves public-source evidence, discovery paths and unfinished work.

Status: Released application · v0.4.0

A single search result is rarely the whole research record. TRACTOR organizes an investigation across independent public sources while recording what was requested, what responded and what remains unsearched.

A resumable asynchronous query queue feeds source adapters into a local database. Deduplication, multilingual query variants, evidence hashes and provenance records support a Qt desktop interface with readable source coverage and export.

Capabilities:

- Iterative public-source research across independent providers
- Evidence views, discovery chains, duplicate grouping and content hashes
- Stop, resume, refresh and searchable local investigation history
- JSON, Markdown and spreadsheet-safe CSV export

Limits:

- Recorded coverage is not exhaustive coverage of the internet
- Provider availability, credentials, rate limits and returned metadata constrain results
- Native bundles are unsigned and not notarized

[Repository](https://github.com/chasebryan/tractor)

### CENTL-CBX

An exact arithmetic laboratory for Erdős–Straus decomposition geometry and reproducible certificates.

Status: Exact research framework

The Erdős–Straus conjecture asks whether 4/n can always be written as the sum of three positive unit fractions for every integer n greater than one. CENTL-CBX studies exact candidate decompositions, obstruction structure and certificate construction.

C kernels and Python analyzers preserve exact Type-I and signed-box Type-II state. Independent research lanes expose geometry and survivor structure; executable theorem modules and verifier scripts distinguish proved state transitions from scheduling annotations.

Capabilities:

- Exact decomposition search and signed-box geometry analysis
- Independent research lanes and survivor-state classification
- Certificate discovery with executable verifier modules

Limits:

- The Erdős–Straus conjecture remains open
- The current framework is a developing decomposition mechanism, not a proof of the conjecture
- Heuristics and directional annotations confer no proof authority

[Repository](https://github.com/chasebryan/centl-cbx)

### ZP-1

An experimental Rust signed-envelope protocol focused on canonical wire formats, provider boundaries and reproducible verification.

Status: Experimental unaudited protocol reference implementation.

Study protocol composition through deterministic wire formats, separated cryptographic providers and repeatable verification, while keeping experimental assumptions visible.

The reference library separates KEM and signature provider traits from object encoding, KDF, sealing, opening and Merkle logic. The target suite specifies ML-KEM-1024 and ML-DSA-87, HMAC-SHA384 and AES-256-GCM-SIV. Deterministic test providers exercise protocol mechanics while remaining explicitly non-cryptographic.

Capabilities:

- Canonical binary object encoding
- Recipient stanzas and key commitment
- Signed public manifests
- Authenticated chunks bound by a domain-separated SHA-384 Merkle tree
- Protocol limit checks and tamper rejection
- Frozen reference vectors, negative corpus and mutation-test scaffolding

Limits:

- The default crate has no production PQC provider.
- Tests-only deterministic provider is not cryptographically secure.
- Archival SLH-DSA structures are defined but operation requires a real provider.
- No independent cryptographic review or formal security proof.

[Repository](https://github.com/chasebryan/ZP-1)

### Wuci-Ji

An x86_64 assembly research system for sealed artifacts, receipt-bound release and deterministic public evidence.

Status: Active research/public-review artifact; substantive implementation with extensive evidence tooling.

Explore disciplined systems construction in which proposed operations, authority boundaries and the evidence behind a change remain explicit.

Assembly owns narrow envelope, Gate and authenticated final-output boundaries. Python and Zig provide fixture, policy, orchestration and public-verifier layers, with additional Rust research components. The system connects artifact digests, authorization receipts, public witness bundles and append-only local history; its documentation separates each implemented boundary from wider security claims.

Capabilities:

- WJSEAL artifact envelopes and public manifests
- Capability and rooted-contract checks for supported open/release decisions
- Public witness bundles and domain-separated Merkle history proofs
- Read-only public artifact inspection through Wuci-Prism
- Deterministic Daylight evidence and claim gates
- Defensive evidence perimeter and quantum-migration inventory
- Bounded Linux no-network proof lane on supporting kernels

Limits:

- Custom research cryptography is unaudited and not suitable for production claims.
- Production publish/trust authority is not established; fixture FROST authority is test-only.
- Local Merkle history is not an operated transparency-log service.
- General runtime containment and whole-system post-quantum security are not claimed.

[Repository](https://github.com/chasebryan/-wuci-ji)

### Fyr

A Rust-built programming-language bootstrap with static checks, an interpreter, formatter and persistent REPL.

Status: Working language bootstrap; native compiler layers remain planned.

Explore a readable systems-language surface with explicit structure, executable examples and a small implementation that can evolve toward stronger guarantees.

A conventional compiler front end transforms source into tokens and an AST, performs typechecking, then evaluates the program. The bootstrap command integrates manifests, diagnostics, imports, formatting and tests. Build currently emits checked import-flattened Fyr source rather than native machine code.

Capabilities:

- Lexer, parser, static type checker and interpreter
- Typed functions, structs, enums and exhaustive match
- Bounds-checked arrays and string operations
- Nullable types and scoped unwrapping
- Project scaffolding and root-confined relative imports
- Formatter, assertion-file tests and checked source bundles
- Persistent interactive REPL

Limits:

- Native performance and Rust-class ownership/concurrency safety are goals, not present capabilities.
- Native code generation and ownership checking remain future layers.
- Bootstrap build output is source, not a native executable.

[Repository](https://github.com/chasebryan/fyr)

### JLR

A Linux security-governance prototype that combines content-addressed software identity, signed policy, evidence ledgers and confinement.

Status: Pre-release Linux prototype

Explore a Linux governance boundary that makes permitted operations, operator authority and decision evidence explicit.

Measured artifact records feed a deterministic policy engine. Signed evidence records track decisions; execution cells reduce authority through namespaces, seccomp, Landlock and capability controls. Separate boot work explores signed releases, A/B slots and rollback policy.

Capabilities:

- Deterministic trust decisions with explicit evidence and revocation
- Canonical CBOR records, Ed25519 envelopes and content-addressed artifact identity
- Merkle evidence ledger with signed checkpoints
- Sealed execution cells and an audit/enforcement exec gate
- Reproducible base-image and initramfs tooling with QEMU test coverage

Limits:

- Not externally audited or production-ready
- Companion mode depends on host trust and has documented execution-gate boundaries
- Firmware/TPM authentication, installer/recovery integration and post-quantum signatures remain design work

[Repository](https://github.com/chasebryan/JLR)

### WARLOCK-INDEX

A source-traceable strategic research corpus, organized into dated assessments, explainers, source packets, timelines and registers.

Status: Published research corpus

Organize unclassified, public-source strategic research into a searchable corpus with clear source routes and published claim boundaries.

Canonical Markdown records follow standards for information cutoff, confidence and source traceability. A custom Node build turns the corpus into a searchable static library, update feeds and an installable browsing workspace.

Capabilities:

- Dated assessments and explainers with evidence separated from analytic judgment
- Source registers, timelines and thematic research collections
- Generated static library, client-side search, citation support and RSS
- Installable workspace for browsing and selected-record downloads

Limits:

- Open-source strategic research, not operational intelligence or classified analysis
- Dated products must be read with their information cutoff and confidence
- The corpus is a public research and publishing system; it does not establish government authority.

[Repository](https://github.com/chasebryan/warlock-index)

### tracksim

A reproducible sensor-fusion and multi-target tracking sandbox that exposes estimator behavior through a real-time HUD.

Status: Deterministic simulation sandbox

Make estimator behavior visible under noise, missing measurements, clutter and association uncertainty in a reproducible synthetic environment.

Five simulated navigation sensors feed an extended Kalman filter with chi-square innovation gating. Simulated radar adds noisy detections and clutter; nearest-neighbour association and M-of-N confirmation maintain tracks. A fixed-step seeded model runs separately from the canvas presentation.

Capabilities:

- Extended Kalman fusion with Joseph-form covariance updates
- Innovation gating, covariance-derived influence and comparison against simulated ground truth
- Sensor degradation, fix-spoofing, clutter and decoy scenarios
- Seeded runs, backward scrubbing, headless execution and telemetry encoders
- Canvas HUD with a worker bridge and documented mathematical contracts

Limits:

- All sensors and radar detections are simulated
- Simplified local 2-D kinematics and sensor models, not field-validated navigation or radar hardware
- Reproducibility describes the simulation implementation rather than real-world predictive accuracy

[Repository](https://github.com/chasebryan/tracksim)

### TranscentreVG-1

A synthetic beacon-acquisition laboratory with Bayesian localization and audible packet records.

Status: Reproducible simulation

Receiving a report is different from confirming a position. TranscentreVG-1 explores how uncertain range/bearing observations, independent witnesses and packet delivery affect the evidence behind a synthetic beacon estimate.

Four simulated receivers search a 42 × 32 grid. A Bayesian posterior tracks each static identified beacon; an adaptive planner weighs information gain, travel and viewpoint geometry. CRC-checked relay frames connect observation delivery to the estimator, with reproducible synthetic benchmarks.

Capabilities:

- Bayesian grid localization with uncertainty and outlier gating
- Independent confirmation and adaptive receiver planning
- Packet-loss, corruption, outage and repeated-view scenarios
- Audible FSK packet capture and WAV verification

Limits:

- All receivers, beacons and measurements are simulated
- The model assumes static identified beacons and omits terrain, propagation and physical vehicle dynamics
- Synthetic benchmark results do not establish field accuracy; CRC is not sender authentication

[Repository](https://github.com/chasebryan/transcentrevg-1)

### PEEL

A small F* experiment in labeled cryptographic expressions and a recorded path to C.

Status: P0 research prototype

PEEL narrows the language question to one inspectable experiment: how can public and secret values be represented so that forbidden observations are rejected by the type system?

Two F* modules define classification labels and label-indexed bytes. Positive and expected-failure examples exercise the boundary. Pinned F*, Z3 and KaRaMeL tools verify and extract the byte-XOR subset, with scripts recording the resulting evidence.

Capabilities:

- Public/Secret labels with explicit join laws
- Label-indexed byte XOR and restricted public observation
- Expected verifier rejections and a scripted verification/extraction path

Limits:

- P0 research prototype; no custom PEEL parser
- The checked experiment is narrow and depends on its recorded toolchain
- No claim of cryptographic security, constant-time behavior or production readiness

[Repository](https://github.com/chasebryan/peel)

### Enkel

A controlled language that turns explicit grammatical structure into scoped meaning trees.

Status: Formal language prototype · v0.2.0

Natural-language word order can conceal a change in scope or reference. Enkel makes tense, argument roles, quantifier order and negation explicit, then renders the accepted structure deterministically.

A dependency-free Python compiler parses a closed grammar, lowers surface order into a JSON-safe scoped tree and produces a canonical English rendering. A limited English input layer accepts declared patterns and reports ambiguity instead of guessing.

Capabilities:

- Explicit quantifier scope, tense, roles and negation
- Scoped meaning-tree and deterministic English/JSON output
- A limited English input layer and inspectable vocabulary
- Tests for reference identity, finite-world counterexamples and normalization round trips

Limits:

- Does not translate arbitrary English or infer intended reference
- Grammar, vocabulary and context are closed and explicit
- Unique structure does not establish real-world truth

[Repository](https://github.com/chasebryan/enkel)

### Orange School

A competency-based curriculum connecting computing foundations to cryptographic language work.

Status: Developing curriculum · 0.9.0-dev

Working with cryptography requires more than learning syntax. Orange School makes the programming, mathematics, systems, cryptography and assurance prerequisites explicit, with learner work evaluated against stated competencies.

A machine-readable prerequisite graph drives thirty-six released foundation modules, lessons, labs, rubrics and check scripts. Current Orange exercises pin an exact source revision; planned and blocked language capabilities stay visible without being taught as implemented features.

Capabilities:

- Released foundations in computing, mathematics, cryptography, systems and formal methods
- Lessons, labs, assessments and professional role pathways
- A prerequisite graph and machine-readable curriculum catalog
- Revision-pinned examples and curriculum checks

Limits:

- Development curriculum rather than accredited education
- Orange-dependent material is intentionally tied to a narrow older accepted compiler revision
- Planned and blocked modules remain incomplete

[Repository](https://github.com/chasebryan/orange-school)

## Further explorations — 22 projects

### AESOP

A command-line and desktop cryptanalysis workbench for CTF exercises, coursework and teaching.

Status: Cryptanalysis teaching workbench

Cryptology learning often means moving among many small tools and disconnected explanations. AESOP brings classical-cipher analysis, encodings, byte statistics and published educational techniques into a single workspace with an integrated field guide.

Python modules register capabilities through a shared command contract. Pure algorithm functions sit beneath CLI handlers, while a Tkinter interface builds forms from the same registry and runs long operations in a separate worker process.

Capabilities:

- Classical-cipher analysis and common encoding transformations
- Frequency, coincidence, entropy and byte-distribution inspection
- Published number-theory and cryptographic teaching exercises
- CLI, interactive session, graphical forms and built-in field guides

Limits:

- An educational and authorized-research workbench, not a general method for deciphering secure modern cryptography
- Identification and automatic solving use heuristics and may yield ambiguous or unsuccessful results
- Some mathematical and cryptographic capabilities require optional dependencies

[Repository](https://github.com/chasebryan/aesop)

### Black Calculus

A public working manuscript on cryptology, intelligence, uncertainty and the governance of secret power.

Status: Working manuscript

Intelligence judgments are made from incomplete evidence that an adversary may deliberately shape. Black Calculus examines how knowledge, trust and legitimate action can remain accountable under deception, uncertainty and secret power.

An eight-book argument moves from knowledge, trust and belief through identity, strategy, force, legitimacy and institutional design. The working draft labels material claims as fact, inference, doctrine or speculation, and the first chapter traces evidence from collection to decision.

Capabilities:

- Public preface and substantial first-chapter working draft
- Eight-book outline spanning forty planned chapters
- Book constitution and editorial standards for evidence and terminology

Limits:

- Public working manuscript; the complete planned book is not yet present
- Draft text, terminology and conclusions remain open to revision

[Repository](https://github.com/chasebryan/Black-Calculus)

### CaseGrid

A browser-based evidence-management concept exploring file integrity, evidence-to-lead links and chain-of-custody presentation.

Status: Browser MVP

Evidence work depends on understanding where a file came from, how it changed hands and which records support it. CaseGrid explores a clear browser workflow for linking evidence, leads, authority records and custody history.

Browser-native Web Crypto hashes uploaded file bytes with SHA-256. The application links evidence and legal-authority records, appends hash-linked audit events and renders custody records for PDF export, keeping demo state in local storage.

Capabilities:

- Real SHA-256 file hashing for new uploads
- Case creation, evidence linking and legal-authority records
- Hash-linked audit events and custody-report previews
- Selected-record PDF export

Limits:

- Authentication and roles are simulated in the browser
- Local-storage demo state is editable, with no server-backed access control or protected evidence vault
- Seeded records are demo data; hashes do not establish legal admissibility

[Repository](https://github.com/chasebryan/case-grid)

### devprep

A cross-platform planner and installer for a curated development workstation toolkit.

Status: Initial workstation setup utility

Preparing a development machine repeatedly involves the same dependency ordering and platform-specific package choices. devprep exposes that work as a readable plan, with explicit unavailable packages, execution records and tool-specific next steps.

A dependency-aware Python planner maps catalog entries to eleven package-manager adapters and bounded installation recipes. Separate platform detection, planning and execution layers support dry runs, JSON plans, custom selections and result reports.

Capabilities:

- Full or custom selections of languages, compilers, editors, containers and scientific tools
- Package-manager mappings across major Linux families, macOS and Windows
- Dependency ordering, dry runs and machine-readable plans
- Per-tool execution status and failure reports

Limits:

- Initial implementation; adapter coverage does not mean installation testing on every distribution
- Available versions depend on the platform, architecture and enabled package repositories
- Installation can change system packages and services; there is no automatic uninstall or rollback

[Repository](https://github.com/chasebryan/devprep)

### DOG1

A fictional tabletop world with continuous routes, fuel stops and inspectable game rules.

Status: Fictional tabletop simulation

DOG1 turns movement, resource constraints and abstract token interactions into a small visual world. The project is a game-model study: its map, distances, allegiances and power points are invented and can be inspected independently of the presentation.

A JavaScript model runs continuous movement on a periodic 42 × 32 grid, separating routes and game state from browser rendering. Node tests cover rules, while a Python/FFmpeg renderer creates a reproducible demonstration and records its authored scenario in a manifest.

Capabilities:

- Continuous routes across a periodic map seam
- Relative speed allocation, distance-based fuel and arrival-based refuelling
- Editable abstract power points and synthetic token rules
- Inspectable exported state and a reproducible video demonstration

Limits:

- A fictional uncalibrated game model rather than an Earth coordinate system
- Token visibility, power and interaction scores have no real sensor or weapon interpretation
- Debugging exports expose synthetic hidden state and are not competitive-game boundaries

[Repository](https://github.com/chasebryan/DOG1)

### DREAM-001

An exploratory model-state experiment with pre-token features, grouped evaluation and offline reports.

Status: Exploratory model-state prototype

DREAM-001 investigates whether changes in a language model's internal state can precede the first annotated false claim. Its contribution is an explicit extraction and evaluation pipeline that makes timing, labels, folds and uncertainty inspectable.

Python extracts seven pre-token distribution and hidden-state features from annotated continuations. Grouped out-of-fold logistic evaluation keeps related answers together and excludes post-onset fitting rows. An offline HTML report displays risk traces, onset alignment, token records and audit metadata.

Capabilities:

- Annotation-aware pre-token feature extraction
- Grouped out-of-fold evaluation and censored-tail handling
- CSV features/predictions, metric records and a saved logistic model
- Offline interactive reports with state traces and timing audits

Limits:

- The shipped demo uses a tiny randomly initialized model and eight handcrafted annotations; it demonstrates plumbing, not predictive evidence
- Results depend on annotation quality, model, prompt format and numerical precision
- The advertised 8 GB CUDA setup was not measured in the repository's documented demonstration

[Repository](https://github.com/chasebryan/dr-proto)

### ES-ASM-SNIPER

A C and assembly search kernel that separates finite Erdős–Straus residuals from checkable certificates.

Status: Finite search and certificate experiment

The Erdős–Straus search problem demands exact evidence rather than impressive search counts. ES-ASM-SNIPER focuses on a defined modular search region and separates an optimized hunt from independent certificate construction and verification.

A segmented modular sieve and exact integer routines drive the search. Handwritten AArch64 and x86-64 modular multiplication support the hot path, with C fallbacks. Independent certification and verification programs preserve a distinction between incomplete menu residuals and complete bounded regions.

Capabilities:

- Modular residue-class search with configurable bounds and threads
- C and assembly modular arithmetic with exact identity checks
- Append-only range ownership and resumable search manifests
- Separate certificate creation and third-party reconstruction programs

Limits:

- A bounded computational research kernel, not a proof of the Erdős–Straus conjecture
- A miss in the search menu is not an unsolved integer or a universal disproof
- Complete-region certification has explicit implementation bounds; wrapping arithmetic cannot certify

[Repository](https://github.com/chasebryan/ES-ASM-SNIPER)

### Latticra

An early evidence-bound system substrate for local authority metadata, reports, receipts and future runtime boundaries.

Status: Systems research substrate

System actions often hide the authority, assumptions and evidence behind them. Latticra explores a substrate where local state, requests, capability boundaries and reports become explicit, inspectable records before wider runtime authority is granted.

C/C++ models and supporting scripts represent state, requests, transitions and evidence as structured records. A Lat-to-LIR pipeline records parsing, semantic checks and lowering, while capability and effect classifiers preserve explicit no-effect boundaries. Receipts, reports and validation contracts track what a local observation can support.

Capabilities:

- State-lattice and preview-only transition models
- Lat parsing, semantic checks and lowering to LIR
- Capability, effect and verification metadata classification
- Nucleus task and report architecture
- Local receipts, reproducible reports and evidence contracts

Limits:

- Early architecture and validation work, with many surfaces limited to metadata and preview
- Production protection, hardened sandboxing and OS replacement are not established
- Privileged, network and general runtime authority remain closed unless a narrower record explicitly supports them

[Repository](https://github.com/chasebryan/Latticra)

### Mint Terminal Predictor

A local Bash predictor that displays history-based command suggestions as you type.

Status: Small local shell utility

Repeated shell work often begins with a familiar prefix. Mint Terminal Predictor uses the commands already in Bash history to suggest likely completions while keeping the suggestion separate from the command that will execute.

A small Bash layer synchronizes recent command history, ranks prefix matches by frequency and recency, and draws a dim suggestion beside the current input. Key bindings accept or cycle suggestions while leaving ordinary Tab completion available.

Capabilities:

- Local predictions from existing Bash history
- Frequency and recency ranking with configurable history limits
- Accept/cycle bindings and manual history reload
- Installer backups and a focused shell test script

Limits:

- Initially targets Bash on Linux Mint
- Suggestions are completions, not natural-language reasoning or automatically executed commands
- History-based ranking is limited to previously recorded commands

[Repository](https://github.com/chasebryan/mint-terminal-predictor)

### Muddog-fleer

A wordless procedural film through an invented forest with authored visual and sound cues.

Status: Procedural creative film

Muddog-fleer explores a restrained field-simulator aesthetic through a continuous fictional first-person walk. Fixed world geometry, a small hyperbolic reticle and synchronized stereo cues carry the sequence without captions or interface text.

Python, NumPy and Pillow generate terrain, layered foliage, synthetic figures and frame rendering from an authored scene. FFmpeg encodes the resulting 42-second 1080p film with stereo audio; a manifest records timing, cues and output checksums.

Capabilities:

- Procedural forest geometry and continuous camera motion
- A fully wordless second version with a minimal reticle
- Authored visual pulses, beacon timing and synthesized stereo sound
- Reproducible frame rendering, preview contact sheets and a media manifest

Limits:

- A scripted fictional game film with no real people, locations or sensor input
- Thermal-style contrast and classification colors are authored animation
- Rendering cost depends on CPU and frame-worker memory use

[Repository](https://github.com/chasebryan/Muddog-fleer)

### Nevins Port

A native receive-only radio console with capture packs, conservative signal cards and policy specifications.

Status: First-pass native RF prototype

Radio observations are easier to understand when the capture, interpretation and permitted next step stay connected. Nevins Port explores a native listening station that makes spectra, evidence records and conservative signal summaries readable.

C++23 owns the CLI, GLFW/OpenGL dashboard, receiver adapters and capture handling. Deterministic mock data and an explicit RTL-SDR path feed the same analysis pipeline. F* modules specify bounded device values, capture manifests and routing rules; the current runtime still uses a C++ mirror bridge.

Capabilities:

- Native spectrum/waterfall, receiver metrics and signal-card panes
- Deterministic mock surveys and an explicit receive-only RTL-SDR capture path
- Capture pack writing, explanation and replay
- F* policy/validation specifications and native regression tests

Limits:

- First implementation pass; hardware-mode support is optional and not required by CI
- The runtime bridge currently mirrors the F* rules in C++; generated KaRaMeL integration remains planned
- Richer controls and DSP summaries remain unfinished

[Repository](https://github.com/chasebryan/nevins-port)

### Phase1

A terminal-first educational virtual OS console implemented in Rust.

Status: Educational virtual OS console

Operating-system ideas are easier to study when their state is visible and their controls are approachable. Phase1 provides a terminal environment for exploring filesystems, processes, command policy and local workflows through a simulated system model.

Rust modules implement a simulated scheduler, virtual filesystem and process table beneath a terminal operator interface. Command metadata and explicit policy gates control host-backed operations. Sanitized history, audit records and a local notes-and-rules companion make experiments inspectable.

Capabilities:

- Boot interface, dashboard, help and command completion
- Simulated kernel, virtual filesystem and process table
- Explicit policy gates for host-backed commands
- Sanitized local history, audit log and learning notes
- Documentation, browser demo and repository quality tooling

Limits:

- Educational virtual OS simulation, not an independent kernel or hardened security boundary
- Base1 real-hardware foundation remains planned
- The checked package is a development line; release labels in documentation describe separate tracks

[Repository](https://github.com/chasebryan/phase1)

### PITHOS

A draft post-quantum object-sealing construction that specifies how standardized cryptographic components fit into a strict binary object format.

Status: Experimental specification draft

Object encryption needs more than a choice of cipher: keys, recipients, metadata, chunk boundaries and signatures must agree on one format. PITHOS explores that composition through an explicit post-quantum sealing specification.

The proposed PITHOS-1 profile combines ML-KEM-1024, a SHA-384-based derivation, AES-256-GCM chunk protection and optional ML-DSA-87 signatures. The repository defines wire encodings, parser requirements, security goals, review questions and a future validation path.

Capabilities:

- Normative draft, equation transcript and canonical wire-format definitions
- Recipient and associated-data binding requirements
- Explicit chunking, parser bounds and algorithm-profile rules
- Published review agenda and validation roadmap

Limits:

- Specification only; no reference implementation or generated test-vector corpus
- Composition and misuse-resistance questions remain open for review
- No algorithm/module validation or government approval

[Repository](https://github.com/chasebryan/PITHOS)

### PMGS

A receive-only satellite workflow helper for inexpensive RTL-SDR hardware and stock antennas.

Status: Pre-alpha toolkit

A low-cost receiver and stock antenna can make a first satellite pass difficult to plan and diagnose. PMGS brings pass planning, antenna guidance, capture preparation and local observation reports into one receive-only workflow.

Python modules combine optional Skyfield pass prediction and TLE data with a realistic satellite/antenna catalog. The CLI prepares captures, checks unsigned IQ recordings, coordinates established decoders and turns observations into local reports.

Capabilities:

- Pass planning with optional Skyfield and public TLE data
- Stock-antenna guidance and target difficulty scoring
- Dry-run capture plans with duration, storage estimates and metadata sidecars
- IQ-file verification, decoder handoff and HTML observation reports

Limits:

- Initial v0.1 scaffold / pre-alpha
- Decoder templates require version-specific verification before release
- Orchestrates existing decoding tools rather than replacing them

[Repository](https://github.com/chasebryan/pmgs)

### POINT/3

A sequence of small reconstruction experiments, from repetition codes to authenticated recursive fragments.

Status: Small reconstruction research prototype

POINT/3 separates recovery from integrity. Its early repetition-code experiments show the limits of majority decoding; POINT/3-W explores a recursive two-of-three reconstruction topology in which a recovered value must also satisfy a path-bound authenticator.

Small C and Orange examples implement repetition and affine scattering. The later C/OpenSSL prototype combines an object, an HMAC tag and their XOR at each node. A Cryptol executable specification describes a depth-four, 81-leaf tree and its round-trip and branch-loss properties.

Capabilities:

- Three-way repetition and affine-scatter demonstrations
- Recursive authenticated two-of-three reconstruction for a 128-bit object
- Presence masks for modeling erased terminal fragments
- A depth-four Cryptol specification with round-trip and branch-loss checks

Limits:

- Experimental reference code with a narrow object/key interface
- Affine scattering changes locality rather than coding distance
- The repository's executable checks are not an independent security review or a production storage-system claim

[Repository](https://github.com/chasebryan/point3)

### RF Commons

A browser radio-workbench prototype designed to make spectrum exploration and radio learning approachable.

Status: Radio-workbench prototype

Radio tools can make the spectrum difficult for newcomers to explore. RF Commons develops an approachable workbench for tuning, signal learning, bookmarks and logs, with a local receive-only audio bridge.

A dependency-free browser interface provides a synthetic waterfall, tuner controls, bookmarks, logs and learning surfaces. A local Node helper offers receiver health checks and receive-only audio through rtl_fm and FFmpeg.

Capabilities:

- Synthetic spectrum/waterfall and signal-learning UI
- Frequency bookmarks and a local logbook
- Local RTL-SDR audio bridge with explicit missing-tool/device states
- Public receiver directory/map interface

Limits:

- The waterfall is synthetic, not live receiver IQ
- No completed real FFT/waterfall pipeline or gain calibration
- A front-end prototype; listed product modes partly describe its roadmap

[Repository](https://github.com/chasebryan/rf-commons)

### SEAL

A small F* authority model that makes capability, evidence and receipt requirements explicit.

Status: Formal-model prototype

An authority decision should reveal which capability, evidence and receipt it requires. SEAL models that decision as a small fail-closed gate whose allowed outcomes can be checked against explicit invariants.

Typed subjects, operations, policies, evidence and receipt states feed a total F* decision function. Lemmas express that an allowed decision implies the required capability and supporting state; an explicit decision matrix records check precedence and denied combinations.

Capabilities:

- Capability-first total authorization gate
- Evidence requirements for open, seal and transition operations
- Receipt requirement for transitions
- F* lemmas and explicit operation decision matrix
- Repository F* verification workflow

Limits:

- SEAL-Core v0 is a narrow authority model with no parser; example files are documentation fixtures
- C extraction is deferred until a compatible KaRaMeL toolchain is pinned
- Kernel isolation, seL4 equivalence, production authorization and whole-system formal verification are not established

[Repository](https://github.com/chasebryan/SEAL)

### TCS

A capability-oriented operating-system seed built from isolated communicating servers on seL4/Microkit.

Status: Bootable OS seed

Software authority should be explicit, isolated and checked when an operation occurs. TCS explores that model in a small operating-system seed whose communicating servers enforce policy over a fixed microkernel capability graph.

A fixed kernel capability graph connects small native servers. An allocation-free policy state machine checks subject, object, rights and session generation on each read; separate profiles explore read-only UART interaction, signed administration and bounded worker lifecycle experiments.

Capabilities:

- Five-domain bootable seed in AArch64 QEMU
- Per-request policy checks, session revocation, quarantine and audit exhaustion
- Isolated read-only UART terminal and separate signed interactive profiles
- Saved boot images, transcripts, build reports and invariant tests

Limits:

- A seed, not a general-purpose operating system
- Compile-time typed capability handles, persistent storage and dynamic process creation are not implemented
- Application authorization changes inside a fixed capability graph; seed revocation is not dynamic kernel-capability deletion
- No formal-verification or production-readiness claim

[Repository](https://github.com/chasebryan/tcs)

### TELL

A deterministic black-box auditor for checking whether a local command rejects presumed-invalid binary inputs uniformly.

Status: Focused v1 audit tool

A program may reject different binary inputs through different exit codes or output. TELL makes those discrete rejection differences visible through a bounded, deterministic audit of a local command.

Starting from one accepted binary input, TELL creates a fixed set of mutations and runs a command directly with each input. It groups rejection observations by exact exit code, stdout bytes and stderr bytes, with bounded execution and deterministic reports.

Capabilities:

- Checks discrete rejection differences against a fixed deterministic profile
- Uses exact observation equivalence and content hashes for traceable reports
- Separates completed audit failures from incomplete infrastructure runs
- Includes runner, mutation, reporting and CLI regression tests

Limits:

- No timing or side-channel analysis
- Generated candidates are presumed invalid; no grammar or coverage-guided fuzzing
- Does not prove exploitability, cryptographic correctness or security; target execution is not sandboxed

[Repository](https://github.com/chasebryan/TELL)

### Tobacco

A defensive source auditor that reports review candidates with location, confidence and coverage notes.

Status: Defensive review utility

Suspicious code patterns are useful starting points when their meaning and limits are explicit. Tobacco makes those candidates readable through stable rule IDs, suggested review context and structured reports, while keeping scanned source execution out of the default workflow.

Python AST analysis resolves selected aliases and local assignments; JavaScript, PHP and configuration checks use bounded text patterns. Optional dependency advisory lookup and single-response HTTP checks extend the report surface. JSON/SARIF serialization records locations and fingerprints while omitting matched secret values.

Capabilities:

- Offline source/configuration review with severity and confidence
- Selected dependency-advisory matching and HTTP metadata checks
- Text, JSON and SARIF reports with configurable failure thresholds
- Scope exclusions, skipped-file coverage notes and redacted findings

Limits:

- Pattern matches do not establish reachability, attacker control or exploitability
- No whole-program dataflow, business-logic assessment or full parsing outside Python
- False positives and missed vulnerabilities are expected; clean output is not a security clearance

[Repository](https://github.com/chasebryan/tobacco)

### Vitamins

A small Ruby-like document language that emits ordinary LaTeX source.

Status: Small document-language prototype

Technical writing often needs both readable authoring syntax and precise mathematical typesetting. Vitamins explores a calmer document front end while retaining LaTeX as the renderer and output format.

A Rust parser and emitter translate structured document blocks into TeX. The CLI checks a document in memory, prints generated source or writes a .tex file. Math helpers, document environments and user-defined math macros provide the implemented first slice.

Capabilities:

- Paper metadata, sections, abstracts and quotations
- Paragraph formatting, citations, references, figures and tables
- Theorem/proof blocks, equations and mathematical helpers
- Check, emit and compile-to-LaTeX commands

Limits:

- First language slice; user-defined environments remain deferred
- Emits LaTeX source rather than rendering PDF itself
- Document correctness and mathematical truth are separate from syntactic acceptance

[Repository](https://github.com/chasebryan/vitamins)

### Weatherline

A small weather application served by one Go binary and open weather data sources.

Status: Small open-data application

Weatherline aims to make everyday forecasts accessible without proprietary API credentials or a commercial SDK. A compact local application combines forecast, air-quality and alert data in a readable browser interface.

A Go server handles source requests and serves a JavaScript interface. Open-Meteo supplies forecasts, city search and air quality; the National Weather Service supplies available US alerts. A small service worker caches the application shell.

Capabilities:

- Current conditions, hourly timeline and ten-day forecasts
- Air quality and available active US weather alerts
- City search, optional browser location and unit switching
- Offline application-shell caching

Limits:

- Fresh weather data still depends on upstream network services
- NWS alert coverage is specific to US locations
- Cached interface assets do not establish a complete offline forecast service

[Repository](https://github.com/chasebryan/weatherline)

## Complete public inventory — 63 repositories

| Repository | Decision | Rationale |
| --- | --- | --- |
| [-](https://github.com/chasebryan/-) | exclude | README title and license only. |
| [-wuci-ji](https://github.com/chasebryan/-wuci-ji) | selected | The deepest systems/crypto research body in this subset, with concrete implementation and unusually explicit claim boundaries. Suitable as a research project, never as a certified protection product. |
| [311case_study](https://github.com/chasebryan/311case_study) | exclude | Early coursework text rather than a maintained project with a distinctive current implementation. |
| [aesop](https://github.com/chasebryan/aesop) | further-work | Included in Further explorations with its prototype, research, utility or creative maturity made explicit. Substantive CTF/teaching cryptanalysis package with CLI/GUI and field guides. Worthwhile alternate, with overlap covered by the selected Sigil entry. |
| [airwav](https://github.com/chasebryan/airwav) | selected | Substantive DSP/recording architecture, source confirms actual FFT implementation and detailed validation records. Highly relevant to signals portfolio, with prominent hardware caveat. |
| [algebra-os](https://github.com/chasebryan/algebra-os) | exclude | Omit selected front page until runtime evidence and a meaningful kernel slice exist. Can live in an experimental repository index. |
| [amrtds-research-system](https://github.com/chasebryan/amrtds-research-system) | exclude | Exclude from the primary portfolio selection. Its visual work could later be presented separately as fiction/interface concept after claims are rewritten, but tracksim already represents this domain more credibly. |
| [Black-Calculus](https://github.com/chasebryan/Black-Calculus) | further-work | Included in Further explorations with its prototype, research, utility or creative maturity made explicit. Substantive original writing directly fits the site's intelligence theme. Reserve for a separate writing section rather than presenting as software. |
| [camelot](https://github.com/chasebryan/camelot) | exclude | Empty repository; no implementation or documentation to explain. |
| [case-grid](https://github.com/chasebryan/case-grid) | further-work | Included in Further explorations with its prototype, research, utility or creative maturity made explicit. A coherent interface and real hashing/reporting prototype; supporting portfolio material if breadth matters. Avoid production integrity or forensic admissibility claims. |
| [centl](https://github.com/chasebryan/centl) | selected | Large exact scientific workbench with an inspectable Rust arithmetic engine and local user interface. |
| [centl-cbx](https://github.com/chasebryan/centl-cbx) | selected | Substantive exact arithmetic kernels, research state and verifier modules directly support the mathematics theme. |
| [cryptography_assessment1](https://github.com/chasebryan/cryptography_assessment1) | exclude | Early classical-cryptography coursework notes; not a standalone maintained workbench or research project. |
| [devprep](https://github.com/chasebryan/devprep) | further-work | Included in Further explorations with its prototype, research, utility or creative maturity made explicit. Substantive cross-platform development setup planner and runner; useful utility alternate outside the first selection. |
| [DOG1](https://github.com/chasebryan/DOG1) | further-work | Included in Further explorations with its prototype, research, utility or creative maturity made explicit. Coherent fictional tabletop simulation, but simpler and less technically distinctive than the selected acquisition/tracking models. |
| [dr-proto](https://github.com/chasebryan/dr-proto) | further-work | Included in Further explorations with its prototype, research, utility or creative maturity made explicit. Transparent model-state research prototype with evaluation tooling and offline reports. Tiny synthetic demonstration supplies no predictive evidence; keep as a research alternate. |
| [eaglesos](https://github.com/chasebryan/eaglesos) | exclude | LionsOS downstream fork bootstrap; README identifies inherited baseline and no new assurance claims. |
| [emacs-configure-trisquel](https://github.com/chasebryan/emacs-configure-trisquel) | exclude | Personal editor configuration and manual installation script. |
| [enkel](https://github.com/chasebryan/enkel) | selected | Implemented strict grammar, scoped semantic tree and deterministic rendering with explicit boundaries. |
| [ES-ASM-SNIPER](https://github.com/chasebryan/ES-ASM-SNIPER) | further-work | Included in Further explorations with its prototype, research, utility or creative maturity made explicit. Substantive finite search/certificate kernel with C and assembly. Worthwhile mathematics alternate; CENTL-CBX presents the broader research program in the first selection. |
| [FCF-Laboratory](https://github.com/chasebryan/FCF-Laboratory) | exclude | Public tree contains only a license despite a broad project description. |
| [fyr](https://github.com/chasebryan/fyr) | selected | A meaningful language implementation with a runnable center and useful tooling, distinct from the cryptographic work. |
| [GITS-Linux-Mint-Theme-Configs](https://github.com/chasebryan/GITS-Linux-Mint-Theme-Configs) | exclude | Desktop theme/configuration and third-party visual assets; not selected as an original technical portfolio project. |
| [JLR](https://github.com/chasebryan/JLR) | selected | Substantial original system work with a disciplined distinction between implemented and proposed features. Worth featuring with prototype and boundary labels. |
| [JLR-net](https://github.com/chasebryan/JLR-net) | exclude | Exclude until there is original work to explain. |
| [kaiju](https://github.com/chasebryan/kaiju) | selected | Substantive multi-crate implementation with clear foundations and honest scope; closely supports an analysis/signal aesthetic. |
| [l3](https://github.com/chasebryan/l3) | exclude | Current implementation is too small for a selected portfolio card; its meaningful security execution work is still planned. |
| [Latticra](https://github.com/chasebryan/Latticra) | further-work | Included in Further explorations with its prototype, research, utility or creative maturity made explicit. Substantive implementation, but reserve behind more focused projects. Include as systems research if there is room; avoid implying finished security capabilities or physics breakthroughs. |
| [louisville_coding_assignment1](https://github.com/chasebryan/louisville_coding_assignment1) | exclude | Small introductory homework exercises; later work better demonstrates current depth. |
| [machine-school](https://github.com/chasebryan/machine-school) | supporting | Pass-1 courseware site, mastery schemas and course skeletons. Orange School offers more fully released educational content for the initial selection. |
| [mint-terminal-predictor](https://github.com/chasebryan/mint-terminal-predictor) | further-work | Included in Further explorations with its prototype, research, utility or creative maturity made explicit. Working local Bash predictor with tests. A focused utility rather than a central technical portfolio project. |
| [Muddog-fleer](https://github.com/chasebryan/Muddog-fleer) | further-work | Included in Further explorations with its prototype, research, utility or creative maturity made explicit. Original procedural fictional film and renderer. A creative-work alternate, less relevant than the mathematical simulations in the initial technical portfolio. |
| [nevins-port](https://github.com/chasebryan/nevins-port) | further-work | Included in Further explorations with its prototype, research, utility or creative maturity made explicit. Real first-pass native RF dashboard/capture implementation. Mock-first prototype and generated-core integration remain unfinished; AIRWAV is the stronger initial RF entry. |
| [nosuchmachine.net](https://github.com/chasebryan/nosuchmachine.net) | site-source | The source of the portfolio itself; linked as site source rather than presented as an additional project. |
| [orange](https://github.com/chasebryan/orange) | selected | Substantive pre-alpha cryptographic language with a real typed frontend and reference evaluator. |
| [orange-school](https://github.com/chasebryan/orange-school) | selected | Thirty-six released modules, prerequisite graph, labs and validation scripts form substantive educational work. |
| [peel](https://github.com/chasebryan/peel) | selected | Narrow but coherent F* experiment with explicit semantics, expected failures and verification/extraction evidence. |
| [phase1](https://github.com/chasebryan/phase1) | further-work | Included in Further explorations with its prototype, research, utility or creative maturity made explicit. Clearly authored by Chase Bryan and substantial, but less aligned than the strongest six and overlaps broader substrate projects. Worth a later systems/education card. |
| [PITHOS](https://github.com/chasebryan/PITHOS) | further-work | Included in Further explorations with its prototype, research, utility or creative maturity made explicit. Worth including as clearly labeled research because it supports the cryptography identity. Never present it as deployed or validated encryption software. |
| [pmgs](https://github.com/chasebryan/pmgs) | further-work | Included in Further explorations with its prototype, research, utility or creative maturity made explicit. Compact but tangible original receive-only workflow software. Worth a supporting page, below AIRWAV in prominence. |
| [point3](https://github.com/chasebryan/point3) | further-work | Included in Further explorations with its prototype, research, utility or creative maturity made explicit. Small C/Orange/Cryptol reconstruction experiment with clear model limits. Interesting research alternate, but a terse seed compared with selected cryptographic workbenches/toolchains. |
| [rainbow](https://github.com/chasebryan/rainbow) | exclude | Omit from curated front page to avoid duplicating Fyr. Git history contains Fyr's checked 299b317d332f603a50f26b3788154ec562ed294b revision, followed by Rainbow shaping/renaming commits; list as related work on Fyr's page if useful. |
| [rf-commons](https://github.com/chasebryan/rf-commons) | further-work | Included in Further explorations with its prototype, research, utility or creative maturity made explicit. Reasonable supporting interface project with real local audio helper, but less developed than AIRWAV. Include only with prototype label and precise distinction between synthetic visuals and receiver audio. |
| [rust_guessing_game](https://github.com/chasebryan/rust_guessing_game) | exclude | Introductory Rust Book guessing-game exercise. |
| [rust_os](https://github.com/chasebryan/rust_os) | exclude | README title and license only. |
| [SCRM](https://github.com/chasebryan/SCRM) | exclude | README title and license only. |
| [SEAL](https://github.com/chasebryan/SEAL) | further-work | Included in Further explorations with its prototype, research, utility or creative maturity made explicit. A coherent but narrow F* authority model. Worthwhile alternate; the first selection includes the similarly bounded PEEL experiment and the fuller Wuci-Ji systems research. |
| [sigil](https://github.com/chasebryan/sigil) | selected | Strong fit to the desired cryptology theme, with a complete user surface and substantive independently inspectable implementation. |
| [snoot](https://github.com/chasebryan/snoot) | selected | Clear problem, real implementation, automated regression checks, public release and directly aligned cryptography work. Strong flagship. |
| [tcs](https://github.com/chasebryan/tcs) | further-work | Included in Further explorations with its prototype, research, utility or creative maturity made explicit. Concrete bootable artifacts and deep explicit runtime architecture make this significant portfolio work. Explain the seed carefully to avoid overstating completeness. |
| [TELL](https://github.com/chasebryan/TELL) | further-work | Included in Further explorations with its prototype, research, utility or creative maturity made explicit. Small but well-defined and implemented, fitting validation-oriented engineering. Include as a project page; avoid turning the portfolio explanation into exploitation instructions. |
| [tobacco](https://github.com/chasebryan/tobacco) | further-work | Included in Further explorations with its prototype, research, utility or creative maturity made explicit. Implemented defensive source auditor with reports and tests. Worthwhile alternate; snoot offers a more specific cryptography portfolio story. |
| [tracksim](https://github.com/chasebryan/tracksim) | selected | The mathematics is implemented rather than decorative. Strong code/docs/test separation and visual suitability make it a flagship. |
| [tractor](https://github.com/chasebryan/tractor) | selected | Released native research application with resumable evidence, provenance and source coverage. |
| [transcentrevg-1](https://github.com/chasebryan/transcentrevg-1) | selected | Substantive Bayesian acquisition, planning and audible protocol simulation with documented synthetic limits. |
| [transhopper](https://github.com/chasebryan/transhopper) | related | Original audible relay/grid simulation is retained as a linked predecessor on the TranscentreVG-1 page; avoid duplicate portfolio entries for the same line of work. |
| [vitamins](https://github.com/chasebryan/vitamins) | further-work | Included in Further explorations with its prototype, research, utility or creative maturity made explicit. Substantive small Rust document-language compiler. A worthwhile utility alternate, outside the initial signals/mathematics/cryptography selection. |
| [warlock-index](https://github.com/chasebryan/warlock-index) | selected | Substantial corpus plus a maintained publishing implementation and real public URL. Include as the research dimension of the portfolio. |
| [weatherline](https://github.com/chasebryan/weatherline) | further-work | Included in Further explorations with its prototype, research, utility or creative maturity made explicit. Coherent weather utility with Go backend and browser UI, but outside the first selection's central themes. |
| [x200-sdr-configs](https://github.com/chasebryan/x200-sdr-configs) | exclude | Machine-specific receiver presets and launch configuration; not a separate project implementation. |
| [ZERO-SYSTEM](https://github.com/chasebryan/ZERO-SYSTEM) | exclude | README title and license only. |
| [Zeuz](https://github.com/chasebryan/Zeuz) | exclude | Protocol design reports and mathematical proposals without an implemented system; ZP-1 offers the concrete and bounded protocol prototype. |
| [ZP-1](https://github.com/chasebryan/ZP-1) | selected | A focused original protocol project whose wire discipline and validation assets are portfolio worthy when described as research. |
