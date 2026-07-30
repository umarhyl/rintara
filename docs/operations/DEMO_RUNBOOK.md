# Rintara Live Demo Runbook

> **Version:** 1.0
> **Date:** July 30, 2026
> **Target duration:** 4–5 minutes

## 1. Objective

Demonstrate Rintara's differentiator as one uninterrupted workflow:

```text
First Opportunity
-> one accepted worker
-> clear Mini Agreement
-> verified attendance/completion
-> Work Proof
-> Opportunity Credit
-> 24-hour boost
```

Do not spend demo time on settings, admin configuration, or out-of-scope features.

## 2. Required Environment

- Approved release-candidate deployment.
- Synthetic demo dataset only.
- Stable network plus backup hotspot if available.
- Two isolated browser sessions/profiles:
  - Employer session.
  - Worker session.
- Optional third admin session prepared but not part of the main path.
- Backup recording stored locally and playable without network.
- No browser extensions or password managers that expose unrelated data.

## 3. Demo Data Requirements

Use a dedicated Supabase demo project containing synthetic data only. Create
accounts through normal registration and onboarding, then publish the required
jobs through the employer UI. The repository `db:seed` command is for loopback
local/test databases only and must never be run against the remote demo
database.

Set `RINTARA_APP_URL` to the deployed demo origin (never localhost), and
allowlist that origin's `/auth/callback` in the same Supabase project.

### Employer account

- Active employer profile: **Sinar Event Studio**.
- Zero or fewer than three active Opportunity Credits.
- One pre-created published general job eligible to receive a boost.
- No active boost on the target job.

### Worker account

- Active worker profile: **Ayu Pratama**.
- No verified Work Proof in **Event Helper** category.
- Optional verified proof in a different category to demonstrate category-specific eligibility.

### Reference data

- Pilot area active.
- Event Helper category low-risk and First Opportunity allowed.
- Active compliant Wage Guideline with visible source or simulation label.

### Clean workflow

- No existing application by the worker to the demo job.
- No open reports on the job/agreement.
- Application deadline is strictly before the selection cutoff, and current
  time is before the selection cutoff and start time.

## 4. Pre-Demo Checklist

Complete 30–60 minutes before presentation:

- [ ] Confirm deployed release identifier.
- [ ] Run production smoke test.
- [ ] Rehearse or restore the synthetic demo state through approved application
      flows.
- [ ] Sign in to both isolated sessions.
- [ ] Confirm role-specific dashboards.
- [ ] Confirm seed category, Wage Guideline, and target boost job.
- [ ] Confirm the Worker discovery page contains at least one published job
      with a future application deadline.
- [ ] Disable browser notification popups and unrelated tabs.
- [ ] Set readable zoom and viewport.
- [ ] Test projector/display connection.
- [ ] Verify backup recording and local playback.
- [ ] Record the reset timestamp and operator.

## 5. Main Demo Script

### 0:00–0:30 — Problem and promise

Say:

> Workers often need experience before anyone gives them a first chance. Rintara turns a fair first opportunity into verified work history and rewards the employer who provides it.

Show the landing page and move immediately to the employer session.

### 0:30–1:15 — Publish a First Opportunity

Employer creates an **Event Helper** job.

Highlight:

- clear tasks;
- general area versus private full address;
- fixed visible wage and unit;
- Wage Guideline compliance; and
- First Opportunity label.

Publish the job.

### 1:15–1:50 — Worker applies

Switch to the worker session.

- Open the job.
- Point out that the full address remains hidden.
- Show category-specific First Opportunity eligibility.
- Submit a short application without changing the wage.

### 1:50–2:25 — Employer accepts one worker

Switch to employer.

- Open applicants.
- Show the worker's authorized Passport context.
- Accept the worker.
- State that Rintara atomically accepts one worker, rejects other submitted applications, fills the job, and creates an agreement snapshot.

### 2:25–3:05 — Confirm agreement and attendance

- Employer confirms the Mini Agreement.
- Worker confirms in the other session.
- Employer generates the short-lived check-in code.
- Worker checks in, then checks out using the prepared expedited demo flow.

Do not reveal the code to the audience longer than necessary or include it in screenshots.

### 3:05–3:45 — Verify completion and proof

Employer verifies completion.

Switch to worker and show the new Work Proof in Rintara Passport. Emphasize that beginner status changes only for the completed category.

### 3:45–4:30 — Credit and boost

Switch to employer.

- Show the newly earned Opportunity Credit.
- Redeem it against the pre-created published job.
- Show the exact 24-hour boost end time and boosted discovery label.

Close with the full loop and measurable outcome: one verified First Opportunity completion.

## 6. Optional Admin Proof Point

Only if time permits or jurors ask:

- Open a pre-seeded report.
- Show that an active report blocks completion.
- Show explicit audited moderation actions.

Do not derail the main demo to create a report live.

## 7. Failure Recovery

| Failure | Recovery |
| --- | --- |
| Session expired | Use prepared sign-in tab; do not change accounts live |
| Job validation fails | Explain the visible field error; use pre-created compliant backup job |
| Application conflict | Refresh and use the already-created application state |
| Acceptance already completed | Continue from the agreement in dashboard |
| Code expired | Generate a new code; explain the 15-minute protection |
| Completion blocked | Confirm no seeded active report; if blocked unexpectedly, use backup workflow |
| Credit cap reached | Use the prepared backup employer; do not edit database manually |
| Deployment unavailable | Attempt one controlled reload, then play backup recording |
| Network unstable | Switch to backup network or recording |

Never repair the demo through direct production database edits during presentation.

## 8. Demo Recovery

There is no automated remote reset command in this repository. Restore the
dedicated demo environment from an approved provider snapshot or rebuild its
synthetic state through normal application flows. Never run `db:seed` against
the remote demo database or repair it through direct production database edits.
After recovery, rerun the checklist above.

## 9. Presenter Notes

- Use product language, not implementation jargon.
- Be precise: Rintara verifies completion through its workflow; it does not guarantee work quality or payment.
- Do not call Wage Guidelines legal minimums unless validated.
- Do not claim concurrency, uptime, or impact numbers without evidence.
- Keep backup architecture and database diagrams ready for Q&A.

## 10. Post-Demo

- Record whether the golden path completed.
- Note errors or confusing transitions.
- Preserve logs by request/release identifier without copying sensitive content.
- Reset or retire demo credentials according to team policy.
- Convert discovered defects into prioritized issues; do not patch production manually without review.
