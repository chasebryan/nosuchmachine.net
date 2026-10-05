---
title: "Appendix C: Claim Vocabulary"
part: "Appendices"
order: 20
description: "Definitions of the claim and evidence vocabulary used throughout the book."
---

These terms are used throughout the book. Most belong to the proposed public
assurance model, D-005, and will change if that decision changes.

**Statement kinds.** *Current* describes what the repository contains now.
*Directed* describes explicit owner direction. *Proposed* describes a
recommendation awaiting a decision. *Future* describes an intended capability
whose design, implementation, or evidence is incomplete.

**Claim.** A proposition about an exact subject, under identified contexts,
with stated assumptions and exclusions, supported by typed evidence and judged
by a policy. A claim is not a label attached to a project or a function name.

**Outcomes.** `satisfied`: every mandatory basis, context, identity binding, and
trust-closure element the claim policy requires is present, valid, and bound to
the same subject, and no valid decisive negative result exists.
`not_satisfied`: the proposition was checked and found false or violated.
`unresolved`: the system cannot presently decide it. `unsupported`: the
toolchain, model, target, or operating mode does not offer the claim.

**Evidence bases.** Kernel proofs, checked certificates, external proofs, test
runs, audits, external validations, and assumptions. Each keeps its own
authority. None becomes another by accumulation or relabeling.

**Assumption.** A named dependency that a claim does not prove, stated with why
it is needed and what fails if it is false.

**Exclusion.** A tempting interpretation that the claim's wording does not
cover, stated so the claim does not grow as it travels.

**Trust budget.** The per-claim closure of checkers, axioms, models, foreign
contracts, and other trusted components, including what a compromise of each
would invalidate.

**Leakage profile.** A named observation model, such as control flow and memory
addresses, together with a target model. A constant-time claim is meaningful
only relative to one.

**Solo-reviewed and owner-approved.** Labels for review or approval by the sole
owner. They are never written as independent review.

**Same-owner replay.** A repetition performed or provisioned by the owner.
Useful evidence of determinism; not independent reproduction.

**Thin manifest and thick bundle.** A manifest content-addresses evidence that
may live elsewhere; a bundle contains every byte needed for the replay it
advertises.

**Edition.** A versioned language surface, selected by `edition 2026;` today, so
that later language changes do not silently change the meaning of older
programs.

