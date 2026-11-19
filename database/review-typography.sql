-- Preserve originals and apply only reviewed typography/word-boundary repairs.
DO $repair$
DECLARE p record; v jsonb; g jsonb; q jsonb; para jsonb; choices jsonb; groups jsonb; questions jsonb; paragraphs jsonb; t text; k text; item text;
BEGIN
 INSERT INTO cet_corpus_imports(id,inventory) SELECT 'backup-before-review-fix-2026-11-19',jsonb_build_object('savedAt',now(),'papers',jsonb_agg(payload ORDER BY id)) FROM cet_review_papers ON CONFLICT(id) DO NOTHING;
 FOR p IN SELECT id,payload FROM cet_review_papers FOR UPDATE LOOP
  groups='[]'::jsonb;
  FOR g IN SELECT value FROM jsonb_array_elements(p.payload->'groups') LOOP
   questions='[]'::jsonb;
   FOR q IN SELECT value FROM jsonb_array_elements(g->'questions') LOOP
    choices='{}'::jsonb;
    FOR k,item IN SELECT key,value FROM jsonb_each_text(q->'choices') LOOP
     choices=choices||jsonb_build_object(k,regexp_replace(item,'(?<=[A-Za-z])\.\.$','.'));
    END LOOP;
    questions=questions||jsonb_build_array(jsonb_set(q,'{choices}',choices));
   END LOOP;
   g=jsonb_set(g,'{questions}',questions);
   IF p.id='cet4-2026-06-3' AND g->>'id'='cloze' THEN
    paragraphs='[]'::jsonb;
    FOR para IN SELECT value FROM jsonb_array_elements(g->'paragraphs') LOOP
     t=para->>'text';t=replace(replace(replace(replace(replace(t,'ofthe','of the'),'firstevidence','first evidence'),'fifthdays','fifth days'),' isa ',' is a '),'ofhighly','of highly');
     paragraphs=paragraphs||jsonb_build_array(jsonb_set(para,'{text}',to_jsonb(t)));
    END LOOP;
    g=jsonb_set(g,'{paragraphs}',paragraphs);
   END IF;
   IF g->>'kind'='translation' THEN
    t=g->>'task';t=regexp_replace(t,'([一-龥])\s*,\s*','\1，','g');t=regexp_replace(t,'\s*([，。；：！？])\s*','\1','g');
    g=jsonb_set(g,'{task}',to_jsonb(t));
   END IF;
   groups=groups||jsonb_build_array(g);
  END LOOP;
  IF groups IS DISTINCT FROM p.payload->'groups' THEN
   v=jsonb_set(jsonb_set(p.payload,'{groups}',groups),'{version}',to_jsonb((p.payload->>'version')::int+1));
   UPDATE cet_review_papers SET payload=v,updated_at=now() WHERE id=p.id;
  END IF;
 END LOOP;
END $repair$;
