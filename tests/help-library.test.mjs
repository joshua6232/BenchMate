import {test} from 'node:test';
import assert from 'node:assert/strict';
import {helpGuides,helpQuestions,searchHelp,hasSafetyConcern} from '../lib/help-library.mjs';
test('library has 100 unique questions across 20 cited guides',()=>{assert.equal(helpQuestions.length,100);assert.equal(helpGuides.length,20);assert.equal(new Set(helpQuestions.map(x=>x.question)).size,100);for(const g of helpGuides){assert.equal(new URL(g.source.url).protocol,'https:');assert.ok(g.steps.length>=3);}});
test('every exact question is the first suggestion',()=>{for(const q of helpQuestions)assert.equal(searchHelp(q.question)[0]?.id,q.id,q.question);});
test('prefix, hardware synonyms and a spelling mistake find the right guides',()=>{assert.equal(searchHelp('pc turns on but')[0]?.guide.id,'display');assert.equal(searchHelp('install ram')[0]?.guide.id,'ram');assert.equal(searchHelp('bluetooh headphones')[0]?.guide.id,'bluetooth');});
test('unrelated searches produce no invented answers',()=>{for(const q of ['banana smoothie','quantum teleportation','the'])assert.equal(searchHelp(q).length,0);});
test('hazards are intercepted before normal suggestions',()=>{for(const q of ['burning smell from my pc','sparks from PSU','liquid spill','open my power supply','swollen battery'])assert.ok(hasSafetyConcern(q),q);assert.equal(hasSafetyConcern('install memory'),false);});

import { helpDetails } from '../lib/help-details.mjs';
test('each searchable guide has a distinct preparation, result check and escalation path',()=>{
 for(const guide of helpGuides){assert.equal(helpDetails[guide.id]?.length,3);for(const text of helpDetails[guide.id])assert.ok(text.length>50);}
 assert.equal(new Set(Object.values(helpDetails).flat()).size,60);
});
