import test from 'node:test';
import assert from 'node:assert/strict';
import { guidedDiagnosis } from '../lib/benchmate.ts';

// These exercise the offline router. They do not evaluate live model answers.
test('physical hazards override every ordinary support category', () => {
  for (const symptom of [
    'Black screen and burning smell',
    'My keyboard got wet and stopped working',
    'No audio after I spilled water on the PC',
    'The case gives me an electrical shock',
    'Laptop will not boot and the battery is swollen',
    'PC is smoking and the fans stopped',
    'Sparks from the power supply when gaming',
  ]) {
    const result = guidedDiagnosis(symptom);
    assert.equal(result.title, 'Stop and disconnect power', symptom);
    assert.match(result.steps.join(' '), /only if.*safely/);
    assert.match(result.steps.join(' '), /qualified technician/);
  }
});

test('boot and stop errors do not become monitor cable advice', () => {
  for (const symptom of [
    'Blue screen after startup',
    'BSOD with stop code after a driver update',
    'Black screen says no bootable device',
    'Operating system not found',
    'Stuck on automatic repair screen',
  ]) {
    const result = guidedDiagnosis(symptom);
    assert.equal(result.title, 'Record the startup error first', symptom);
    assert.match(result.steps.join(' '), /back up/);
    assert.match(result.steps.join(' '), /Do not format, reset, reinstall/);
  }
});

test('no-power reports are distinguished from a running PC with no picture', () => {
  for (const symptom of ['PC won’t turn on, no fans', 'No power and a black screen', 'Nothing happens when I press power']) {
    const result = guidedDiagnosis(symptom);
    assert.equal(result.title, 'Work from the outlet inward', symptom);
    assert.match(result.steps.join(' '), /Do not change a voltage selector/);
  }
  assert.equal(guidedDiagnosis('Fans spin but monitor says no signal').title, 'Start with the display path');
});

test('audio, input and cooling still get their own focused checks', () => {
  assert.equal(guidedDiagnosis('Bluetooth headphones have no sound').title, 'Follow the audio connection');
  assert.equal(guidedDiagnosis('Wireless mouse is not responding').title, 'Check the connection first');
  const cooling = guidedDiagnosis('GPU fan stopped at idle');
  assert.equal(cooling.title, 'Check cooling before stressing the PC');
  assert.match(cooling.steps.join(' '), /intentionally stop at low load/);
  assert.match(cooling.steps.join(' '), /Shut down and unplug/);
});

test('unknown symptoms ask for evidence instead of guessing a replacement', () => {
  const result = guidedDiagnosis('It freezes in one application');
  assert.equal(result.title, 'Narrow down what changed');
  assert.match(result.steps.join(' '), /exact error/);
  assert.match(result.question, /operating system/);
  assert.doesNotMatch(result.steps.join(' '), /buy|replace|flash|format/i);
});
