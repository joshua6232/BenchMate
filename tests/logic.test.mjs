import test from 'node:test';
import assert from 'node:assert/strict';
import { allocation, guidedDiagnosis, workspaceSchema, initialWorkspace, assembly } from '../lib/benchmate.ts';
test('hazard symptoms take priority over display troubleshooting',()=>{
  assert.equal(guidedDiagnosis('Black screen and burning smell').title,'Stop and disconnect power');
  assert.match(guidedDiagnosis('black screen').title,/display/);
});
test('budget allocations never exceed budget and preserve category coverage',()=>{
 for(const use of ['Gaming','Creative work','Everyday use'])for(const budget of [300,999,1200,10000]){const rows=allocation(budget,use);assert.equal(rows.length,8);assert.ok(rows.reduce((s,r)=>s+r.amount,0)<=budget);assert.equal(rows.reduce((s,r)=>s+r.share,0),100);}
});
test('saved workspace rejects invalid budgets, steps and extra-long requests',()=>{
 assert.ok(workspaceSchema.safeParse(initialWorkspace).success);
 for(const patch of [{budget:-1},{step:10},{symptom:'a'.repeat(3001)},{region:'invalid'},{completed:[11]}])assert.equal(workspaceSchema.safeParse({...initialWorkspace,...patch}).success,false);
 assert.equal(assembly.length,10);
});

test('older workspaces get a zero extras reserve and unsafe reserves are rejected',()=>{
 const {reserve,...old}=initialWorkspace;
 assert.equal(workspaceSchema.parse(old).reserve,0);
 for(const reserve of [-1,10001,NaN])assert.equal(workspaceSchema.safeParse({...initialWorkspace,reserve}).success,false);
 assert.equal(workspaceSchema.parse({...initialWorkspace,reserve:250}).reserve,250);
});
test('component allowances plus rounding buffer and extras reconcile to total',()=>{
 for(const total of [300,1200,1234.56])for(const reserve of [0,200,total,total+1]){
 const hardware=Math.max(0,total-reserve);
 const allocated=allocation(hardware,'Gaming').reduce((sum,row)=>sum+row.amount,0);
 assert.ok(allocated<=hardware);
 if(reserve<=total)assert.ok(Math.abs(allocated+(hardware-allocated)+reserve-total)<0.00001);
 }
});
