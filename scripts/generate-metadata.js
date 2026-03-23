/**
 * Step 4: Generate metadata — provider levels and clinical keywords
 * 
 * Tags each policy with applicable provider certification levels and
 * generates clinical synonyms/abbreviations for search.
 * 
 * Input:  ./output/scraped-policies.json
 * Output: ./output/metadata.json
 */

import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, 'output');

/**
 * Determine provider levels based on policy ID, title, and section.
 */
function assignProviderLevels(policy) {
  const id = policy.id;
  const title = (policy.title || '').toLowerCase();
  const section = policy.section || '';

  // 1750 series: CCP only
  if (id.startsWith('175')) return ['CCP'];

  // 1700 series: Paramedic + CCP (interfacility)
  if (id.startsWith('170') && !id.startsWith('1750')) return ['Paramedic', 'CCP'];

  // 1900 series: AEMT (and up)
  if (id.startsWith('19')) return ['AEMT', 'Paramedic', 'CCP'];

  // 1800 series: check BLS vs ALS prefix in title
  if (id.startsWith('18')) {
    if (title.startsWith('bls')) return ['EMT', 'AEMT', 'Paramedic', 'CCP'];
    if (title.startsWith('als')) return ['AEMT', 'Paramedic', 'CCP'];
    // Default 1800 to all clinical levels
    return ['EMT', 'AEMT', 'Paramedic', 'CCP'];
  }

  // 1000-1600 series: general treatment guidelines — all clinical levels
  if (id.match(/^1[0-6]/)) return ['EMT', 'AEMT', 'Paramedic', 'CCP'];

  // 2000-6000 series: administrative — all
  return ['All'];
}

/**
 * Clinical keyword database.
 * Maps title keywords/patterns to clinical synonyms and abbreviations.
 */
const KEYWORD_RULES = [
  // Cardiac
  { match: /pulseless arrest/i, keywords: ['cardiac arrest', 'code', 'code blue', 'CPR', 'ACLS', 'V-fib', 'VF', 'VT', 'asystole', 'PEA', 'defibrillation', 'pulseless'] },
  { match: /high performance cpr/i, keywords: ['CPR', 'compressions', 'high performance', 'pit crew', 'code', 'cardiac arrest', 'resuscitation'] },
  { match: /rosc|return of spontaneous/i, keywords: ['ROSC', 'post-arrest', 'post-resuscitation', 'pulse back', 'return of pulse', 'post-cardiac arrest'] },
  { match: /chest pain/i, keywords: ['ACS', 'acute coronary syndrome', 'MI', 'myocardial infarction', 'heart attack', 'STEMI', 'NSTEMI', 'angina', 'cardiac'] },
  { match: /bradycardia/i, keywords: ['slow heart rate', 'brady', 'atropine', 'pacing', 'heart block', 'symptomatic bradycardia'] },
  { match: /narrow tachycardia/i, keywords: ['SVT', 'supraventricular', 'adenosine', 'tachycardia', 'fast heart rate', 'narrow complex'] },
  { match: /wide tachycardia/i, keywords: ['VT', 'ventricular tachycardia', 'amiodarone', 'wide complex', 'tachycardia', 'fast heart rate'] },
  { match: /determination of death/i, keywords: ['death', 'DOA', 'dead on arrival', 'field death', 'pronouncement', 'obviously dead', 'rigor', 'lividity'] },
  { match: /do not resuscitate|polst|dnr/i, keywords: ['DNR', 'POLST', 'advance directive', 'end of life', 'no code', 'comfort care', 'hospice'] },
  { match: /mechanical chest compression/i, keywords: ['LUCAS', 'AutoPulse', 'mechanical CPR', 'chest compression device'] },
  { match: /ventricular assist/i, keywords: ['VAD', 'LVAD', 'heart pump', 'ventricular assist device', 'mechanical circulatory support'] },
  { match: /cardioversion/i, keywords: ['cardioversion', 'synchronized shock', 'electrical cardioversion'] },
  { match: /cardiac pacing/i, keywords: ['pacing', 'transcutaneous pacing', 'TCP', 'external pacing', 'pacer'] },
  { match: /12 lead/i, keywords: ['EKG', 'ECG', 'STEMI', 'electrocardiogram', 'cardiac monitor', '12-lead', 'heart tracing'] },

  // Medical
  { match: /refusal of care/i, keywords: ['refusal', 'AMA', 'against medical advice', 'declined transport', 'patient refusal', 'refused care'] },
  { match: /routine medical care/i, keywords: ['assessment', 'general medical', 'patient assessment', 'routine care', 'vital signs'] },
  { match: /pain management/i, keywords: ['analgesia', 'fentanyl', 'morphine', 'ketamine', 'toradol', 'ketorolac', 'pain control', 'pain relief'] },
  { match: /respiratory distress/i, keywords: ['breathing difficulty', 'dyspnea', 'SOB', 'shortness of breath', 'respiratory', 'wheezing', 'asthma', 'COPD', 'CHF', 'pulmonary edema'] },
  { match: /airway obstruction/i, keywords: ['choking', 'foreign body', 'FBAO', 'obstructed airway', 'Heimlich'] },
  { match: /altered neurologic|aloc/i, keywords: ['altered mental status', 'AMS', 'ALOC', 'unresponsive', 'unconscious', 'GCS', 'confusion', 'syncope'] },
  { match: /stroke/i, keywords: ['CVA', 'cerebrovascular', 'TIA', 'facial droop', 'FAST', 'LAMS', 'hemorrhagic stroke', 'ischemic stroke', 'brain attack'] },
  { match: /fever.?sepsis/i, keywords: ['sepsis', 'fever', 'infection', 'septic shock', 'febrile', 'systemic infection', 'SIRS'] },
  { match: /seizure/i, keywords: ['convulsion', 'epilepsy', 'status epilepticus', 'seizing', 'postictal', 'midazolam', 'versed'] },
  { match: /allergic reaction|anaphylaxis/i, keywords: ['epi', 'epinephrine', 'allergy', 'anaphylactic', 'hives', 'swelling', 'airway swelling', 'bee sting', 'allergic'] },
  { match: /non.?traumatic shock/i, keywords: ['shock', 'hypotension', 'hypovolemic', 'cardiogenic', 'distributive', 'septic shock', 'low blood pressure'] },
  { match: /overdose|ingestion|poisoning/i, keywords: ['OD', 'narcan', 'naloxone', 'poisoning', 'toxic', 'drug overdose', 'ingestion', 'substance abuse'] },
  { match: /anxiety|behavioral/i, keywords: ['psychiatric', 'mental health', 'agitation', 'excited delirium', 'behavioral emergency', 'psych', '5150'] },
  { match: /hyperglycemia/i, keywords: ['high blood sugar', 'diabetes', 'DKA', 'diabetic ketoacidosis', 'hyperglycemic'] },
  { match: /infectious disease/i, keywords: ['infection control', 'PPE', 'biohazard', 'communicable disease', 'exposure'] },
  { match: /ebola/i, keywords: ['Ebola', 'hemorrhagic fever', 'EVD', 'viral hemorrhagic'] },
  { match: /monkeypox|mpox/i, keywords: ['monkeypox', 'mpox', 'pox virus'] },
  { match: /vaccin/i, keywords: ['vaccination', 'immunization', 'vaccine'] },
  { match: /blood collection|law enforcement/i, keywords: ['blood draw', 'DUI', 'law enforcement', 'forensic', 'legal blood draw'] },
  { match: /taser/i, keywords: ['taser', 'barb removal', 'probe removal', 'conducted energy device', 'CED'] },
  { match: /pocus|ultrasound/i, keywords: ['POCUS', 'ultrasound', 'point of care', 'sonography', 'echo'] },
  { match: /narcan.*program|leave behind/i, keywords: ['Narcan', 'naloxone', 'leave behind', 'harm reduction', 'opioid reversal'] },

  // Trauma
  { match: /spinal motion/i, keywords: ['SMR', 'c-spine', 'backboard', 'collar', 'cervical', 'spine immobilization', 'spinal precautions'] },
  { match: /trauma care/i, keywords: ['trauma', 'injury', 'traumatic injury', 'hemorrhage', 'bleeding', 'mechanism of injury', 'MOI'] },
  { match: /traumatic arrest/i, keywords: ['traumatic cardiac arrest', 'TCA', 'trauma arrest', 'trauma code'] },
  { match: /trauma destination/i, keywords: ['trauma center', 'destination', 'transport decision', 'trauma triage', 'field triage'] },
  { match: /mci|multiple casualty/i, keywords: ['MCI', 'mass casualty', 'triage', 'START triage', 'JumpSTART', 'disaster', 'multiple patients'] },
  { match: /crisis standard/i, keywords: ['crisis', 'surge', 'scarce resources', 'disaster', 'crisis standards of care'] },

  // Environmental
  { match: /burn care/i, keywords: ['burn', 'thermal burn', 'chemical burn', 'scald', 'burn center', 'BSA', 'body surface area'] },
  { match: /bite.*sting/i, keywords: ['snake bite', 'spider bite', 'bee sting', 'insect sting', 'envenomation', 'anaphylaxis'] },
  { match: /hyperthermia/i, keywords: ['heat stroke', 'heat exhaustion', 'hyperthermia', 'overheating', 'hot', 'environmental heat'] },
  { match: /hypothermia/i, keywords: ['cold', 'hypothermia', 'cold exposure', 'frostbite', 'rewarming', 'environmental cold'] },
  { match: /hazmat/i, keywords: ['hazmat', 'hazardous materials', 'chemical exposure', 'decontamination', 'decon', 'HAZMAT'] },
  { match: /wmd|nerve agent|bioterrorism/i, keywords: ['WMD', 'nerve agent', 'bioterrorism', 'chemical weapon', 'CBRN', 'atropine', 'MARK I', 'DuoDote'] },
  { match: /radiation/i, keywords: ['radiation', 'nuclear', 'radioactive', 'contamination', 'rad exposure'] },

  // OB
  { match: /ob delivery|childbirth/i, keywords: ['delivery', 'childbirth', 'OB', 'obstetric', 'labor', 'birth', 'baby', 'pregnant'] },
  { match: /newborn care/i, keywords: ['newborn', 'neonate', 'neonatal', 'NRP', 'neonatal resuscitation', 'baby'] },
  { match: /eclampsia/i, keywords: ['eclampsia', 'pre-eclampsia', 'pregnancy seizure', 'toxemia', 'magnesium', 'PIH'] },

  // Pediatric
  { match: /pediatric/i, keywords: ['pediatric', 'peds', 'child', 'infant', 'baby', 'kid', 'Broselow'] },
  { match: /brue/i, keywords: ['BRUE', 'brief resolved unexplained event', 'ALTE', 'apparent life threatening event', 'infant'] },

  // Procedures
  { match: /airway adjunct/i, keywords: ['OPA', 'NPA', 'oral airway', 'nasal airway', 'airway adjunct'] },
  { match: /airway ventilation/i, keywords: ['BVM', 'bag valve mask', 'ventilation', 'assisted ventilation'] },
  { match: /oral glucose/i, keywords: ['glucose', 'sugar', 'hypoglycemia', 'low blood sugar', 'diabetic'] },
  { match: /epi.?pen/i, keywords: ['EpiPen', 'epinephrine auto-injector', 'anaphylaxis', 'allergic reaction'] },
  { match: /i.?gel/i, keywords: ['i-gel', 'supraglottic', 'SGA', 'SAD', 'supraglottic airway', 'advanced airway'] },
  { match: /nasal narcan/i, keywords: ['intranasal Narcan', 'naloxone nasal', 'nasal naloxone', 'IN narcan'] },
  { match: /chest seal/i, keywords: ['chest seal', 'occlusive dressing', 'sucking chest wound', 'open pneumothorax'] },
  { match: /tourniquet|hemorrhage control/i, keywords: ['tourniquet', 'TQ', 'hemorrhage', 'bleeding control', 'wound packing', 'junctional'] },
  { match: /traction splint/i, keywords: ['traction splint', 'femur fracture', 'Hare traction', 'Sager'] },
  { match: /pelvic binder/i, keywords: ['pelvic binder', 'pelvic fracture', 'SAM sling', 'pelvic stabilization'] },
  { match: /intraosseous/i, keywords: ['IO', 'intraosseous', 'EZ-IO', 'bone access', 'IO needle'] },
  { match: /endotracheal|intubation/i, keywords: ['intubation', 'ETT', 'endotracheal tube', 'ET tube', 'advanced airway', 'RSI'] },
  { match: /video laryngoscopy/i, keywords: ['video laryngoscopy', 'VL', 'GlideScope', 'King Vision', 'C-MAC', 'video intubation'] },
  { match: /needle cricothyrotomy/i, keywords: ['cric', 'cricothyrotomy', 'surgical airway', 'needle cric', 'emergency airway'] },
  { match: /needle thoracostomy/i, keywords: ['chest decompression', 'tension pneumothorax', 'tension pneumo', 'pneumo', 'needle decompression'] },
  { match: /iv access/i, keywords: ['IV', 'intravenous', 'IV start', 'peripheral IV', 'vascular access'] },
  { match: /cpap/i, keywords: ['CPAP', 'continuous positive airway pressure', 'BiPAP', 'non-invasive ventilation', 'NIV'] },
  { match: /push.?dose epinephrine/i, keywords: ['push dose epi', 'push dose pressors', 'cardiac epi', 'bolus epinephrine'] },
  { match: /high.?flow nasal/i, keywords: ['HFNC', 'high flow nasal cannula', 'high flow oxygen', 'heated humidified'] },
  { match: /blood draw/i, keywords: ['phlebotomy', 'blood draw', 'blood sample', 'venipuncture'] },

  // Interfacility / CCP
  { match: /antibiotic/i, keywords: ['antibiotics', 'IFT', 'interfacility', 'IV antibiotics', 'medication infusion'] },
  { match: /blood.*continuation/i, keywords: ['blood transfusion', 'blood products', 'PRBC', 'packed red blood cells', 'transfusion'] },
  { match: /potassium chloride/i, keywords: ['potassium', 'KCl', 'electrolyte', 'potassium infusion'] },
  { match: /thoracostomy tube/i, keywords: ['chest tube', 'thoracostomy', 'tube thoracostomy', 'chest drain'] },
  { match: /transport ventilator/i, keywords: ['vent', 'ventilator', 'mechanical ventilation', 'transport vent'] },
  { match: /nitroglycerine.*infusion/i, keywords: ['nitro drip', 'nitroglycerin', 'NTG', 'nitro infusion'] },
  { match: /heparin/i, keywords: ['heparin', 'anticoagulant', 'blood thinner', 'heparin drip'] },
  { match: /norepinephrine/i, keywords: ['Levophed', 'norepinephrine', 'norepi', 'vasopressor', 'pressor drip'] },
  { match: /lorazepam/i, keywords: ['Ativan', 'lorazepam', 'benzodiazepine', 'benzo', 'sedative'] },
  { match: /magnesium/i, keywords: ['mag', 'magnesium sulfate', 'mag sulfate', 'torsades'] },
  { match: /sedation.*analgesia/i, keywords: ['sedation', 'pain management', 'procedural sedation', 'ketamine', 'fentanyl'] },
  { match: /sodium bicarb/i, keywords: ['bicarb', 'sodium bicarbonate', 'NaHCO3', 'alkalinization'] },
  { match: /glycoprotein/i, keywords: ['GP IIb/IIIa', 'glycoprotein inhibitor', 'eptifibatide', 'Integrilin'] },
  { match: /tpa/i, keywords: ['TPA', 'alteplase', 'thrombolytic', 'clot buster', 'fibrinolytic'] },
  { match: /tpn/i, keywords: ['TPN', 'total parenteral nutrition', 'parenteral feeding'] },

  // Drug formulary
  { match: /drug formulary/i, keywords: ['medications', 'drug list', 'med list', 'formulary', 'drug reference', 'pharmacology'] },
  { match: /scope of practice/i, keywords: ['scope', 'scope of practice', 'authorized skills', 'permitted procedures'] },

  // Training
  { match: /ketorolac|toradol/i, keywords: ['Toradol', 'ketorolac', 'NSAID', 'anti-inflammatory', 'pain'] },
  { match: /ketamine/i, keywords: ['ketamine', 'Ketalar', 'pain management', 'sedation', 'dissociative'] },
  { match: /acetaminophen/i, keywords: ['Tylenol', 'acetaminophen', 'APAP', 'IV Tylenol', 'pain'] },
  { match: /tranexamic|txa/i, keywords: ['TXA', 'tranexamic acid', 'anti-fibrinolytic', 'hemorrhage', 'bleeding'] },
  { match: /capnography/i, keywords: ['capnography', 'ETCO2', 'end-tidal CO2', 'waveform capnography', 'CO2 monitoring'] },
];

function generateKeywords(policy) {
  const combined = `${policy.title} ${policy.linkText || ''}`.toLowerCase();
  const keywords = new Set();

  for (const rule of KEYWORD_RULES) {
    if (rule.match.test(combined)) {
      for (const kw of rule.keywords) {
        keywords.add(kw);
      }
    }
  }

  // Always add the policy number as a keyword
  keywords.add(policy.id);

  // Add any words from the title that are 4+ chars (likely meaningful)
  const titleWords = policy.title.split(/[\s\-–—/]+/);
  for (const word of titleWords) {
    if (word.length >= 4 && !/^\d+$/.test(word)) {
      keywords.add(word.toLowerCase());
    }
  }

  return Array.from(keywords);
}

export async function generateMetadata() {
  console.log('=== Step 4: Generating metadata ===\n');

  const scraped = JSON.parse(
    await readFile(join(OUTPUT_DIR, 'scraped-policies.json'), 'utf-8'),
  );

  const metadata = {};
  let totalKeywords = 0;

  for (const policy of scraped.policies) {
    const providerLevels = assignProviderLevels(policy);
    const keywords = generateKeywords(policy);
    totalKeywords += keywords.length;

    metadata[policy.id] = {
      providerLevels,
      keywords,
    };
  }

  const avgKeywords = (totalKeywords / scraped.policies.length).toFixed(1);
  console.log(`  ✓ Generated metadata for ${scraped.policies.length} policies`);
  console.log(`  Average keywords per policy: ${avgKeywords}`);

  await writeFile(
    join(OUTPUT_DIR, 'metadata.json'),
    JSON.stringify(metadata, null, 2),
  );

  console.log(`  Output: ${join(OUTPUT_DIR, 'metadata.json')}\n`);

  return metadata;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateMetadata().catch(err => {
    console.error('Metadata generation failed:', err);
    process.exit(1);
  });
}
