import test from 'node:test';
import assert from 'node:assert/strict';
import { initialWorkspace } from '../lib/benchmate.ts';
import { createWorkspaceHydration } from '../lib/workspace-hydration.ts';

test('delayed restoration preserves early edits and restores untouched saved fields', async () => {
  const hydration = createWorkspaceHydration(initialWorkspace);
  let finishRead;
  const pending = new Promise(resolve => { finishRead = resolve; });
  const result = pending.then(saved => hydration.restore(saved));
  hydration.record({ symptom: 'My new problem', region: 'CA', reserve: 150 });
  hydration.record({ symptom: 'My latest problem' });
  finishRead({ ...initialWorkspace, symptom: 'Old problem', budget: 2400, step: 7, completed: [0, 1] });
  const restored = await result;
  assert.equal(restored.workspace.symptom, 'My latest problem');
  assert.equal(restored.workspace.region, 'CA');
  assert.equal(restored.workspace.reserve, 150);
  assert.equal(restored.workspace.step, 7);
  assert.equal(restored.budgetText, '2400');
  assert.deepEqual(restored.workspace.completed, [0, 1]);
});

test('early checklist edits preserve other saved checks, including explicit unchecking', () => {
  const hydration = createWorkspaceHydration(initialWorkspace);
  hydration.record({ completed: [2] });
  hydration.record({ completed: [2, 4] });
  hydration.record({ completed: [4] });
  const saved = { ...initialWorkspace, completed: [0, 1, 2, 3] };
  assert.deepEqual(hydration.restore(saved).workspace.completed, [0, 1, 3, 4]);
  assert.deepEqual(saved.completed, [0, 1, 2, 3], 'remote baseline stays unchanged for autosave comparison');
});

test('empty or partial budget text survives loading without discarding the stored valid amount', () => {
  const hydration = createWorkspaceHydration(initialWorkspace);
  hydration.editBudgetText();
  const restored = hydration.restore({ ...initialWorkspace, budget: 2400 });
  assert.equal(restored.budgetText, undefined, 'caller keeps the in-progress input');
  assert.equal(restored.workspace.budget, 2400);
});

test('valid early budget changes remain the amount to save after loading', () => {
  const hydration = createWorkspaceHydration(initialWorkspace);
  hydration.editBudgetText();
  hydration.record({ budget: 1800 });
  assert.equal(hydration.restore({ ...initialWorkspace, budget: 2400 }).workspace.budget, 1800);
});

test('untouched workspace restores exactly and a guest keeps early work', () => {
  const saved = { ...initialWorkspace, budget: 3100, symptom: 'Stored issue', completed: [0, 1] };
  assert.deepEqual(createWorkspaceHydration(initialWorkspace).restore(saved).workspace, saved);
  const guest = createWorkspaceHydration(initialWorkspace);
  guest.record({ symptom: 'Guest issue', step: 3 });
  assert.equal(guest.restore(initialWorkspace).workspace.symptom, 'Guest issue');
  assert.equal(guest.restore(initialWorkspace).workspace.step, 3);
});
