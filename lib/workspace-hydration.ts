import type { Workspace } from './benchmate';

/** Keep edits made during the initial read, while restoring untouched saved work. */
export function createWorkspaceHydration(initial: Workspace) {
  const edits: Partial<Workspace> = {};
  const completedEdits = new Map<number, boolean>();
  let previousCompleted = initial.completed;
  let budgetTextEdited = false;
  return {
    record(patch: Partial<Workspace>) {
      const { completed, ...fields } = patch;
      Object.assign(edits, fields);
      if (completed) {
        for (const step of new Set([...previousCompleted, ...completed])) {
          if (previousCompleted.includes(step) !== completed.includes(step)) {
            completedEdits.set(step, completed.includes(step));
          }
        }
        previousCompleted = completed;
      }
    },
    editBudgetText() { budgetTextEdited = true; },
    restore(saved: Workspace) {
      const completed = new Set(saved.completed);
      for (const [step, checked] of completedEdits) {
        if (checked) completed.add(step);
        else completed.delete(step);
      }
      const workspace = { ...saved, ...edits, completed: [...completed].sort((a, b) => a - b) };
      return { workspace, budgetText: budgetTextEdited ? undefined : String(workspace.budget) };
    },
  };
}
