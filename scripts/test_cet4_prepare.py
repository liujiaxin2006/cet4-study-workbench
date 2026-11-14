import unittest
from cet4_pipeline import set_number,parse_paper
from cet4_prepare import answer_keys,answer_appendix,normalize_group,core_issues,confirmed_answers,answer_layout
class ImportBoundaries(unittest.TestCase):
 def test_offset_gutter_and_short_column_regions_keep_answers_with_their_questions(self):
  words=[]
  for row,(left,right) in enumerate([('46. A) answer','48. C) answer'),('detail left','detail right'),('47. B) answer','49. D) answer')]):
   words.extend([{'text':left,'x':40,'y':row*15,'width':265,'height':10},{'text':right,'x':315,'y':row*15,'width':230,'height':10}])
  text=answer_layout(words,600)
  self.assertLess(text.index('47.'),text.index('48.'))
 def test_keys_appendix_is_recognized_without_a_reference_answer_heading(self):
  self.assertEqual(answer_appendix('Question paper\nKEYS\n1 2 3\nA B C')[0].strip(),'1 2 3\nA B C')
 def test_old_answer_headers_do_not_require_a_dot(self):
  self.assertEqual(answer_keys(['27 N) surprising 详解：本句需要形容词。'])[27]['answer'],'N')

 def test_answer_suffixes_match_the_correct_set(self):
  self.assertEqual(set_number('cet4_2022_06_2_ans.pdf'),'2')
  self.assertEqual(set_number('cet4_2021_12_3.pdf'),'3')
 def test_question_options_are_not_answer_prefixes(self):
  self.assertEqual(answer_keys(['46. What is the main idea?\nA) first\nB) second\nC) third\nD) fourth']),{})
 def test_explanatory_headers_allow_bare_answer_letters(self):
  self.assertEqual(answer_keys(['46.【答案】C\n【解析】定位原文。'])[46]['answer'],'C')
 def test_cloze_header_can_precede_a_printed_answer_line(self):
  self.assertEqual(answer_keys(['26. 【考点】形容词辨析题。\nO) unique\n【解析】根据语境选择。'])[26]['answer'],'O')
 def test_printed_options_are_not_mistaken_for_the_correct_answer(self):
  page='46. 文章说明了什么？\nA) 第一项。 B) 第二项。\nC) 第三项。 D) 第四项。\n【解析】定位原文，因此选项C正确。'
  self.assertEqual(answer_keys([page])[46]['answer'],'C')
 def test_negative_option_discussion_does_not_override_the_verdict(self):
  page='47. 关于蛋白质，作者说了什么？\nA) 第一项。 B) 第二项。 C) 第三项。 D) 第四项。\n【解析】与选项C含义一致，故选c。故选项B可排除；因此选项D与原文相矛盾。'
  self.assertEqual(answer_keys([page])[47]['answer'],'C')
 def test_an_explanation_may_continue_on_the_next_page(self):
  keys=answer_keys(['51. 题目。\nA) 第一项 B) 第二项 C) 第三项 D) 第四项','【解析】二者原因不同，故选项A正确。\n52. 下一题。'])
  self.assertEqual(keys[51]['answer'],'A')
 def test_a_verdict_may_wrap_around_a_table_border(self):
  self.assertEqual(answer_keys(['54. 题目。\n【解析】故选项B正\n《 确。选项A可排除。'])[54]['answer'],'B')
 def test_clean_answer_tables_take_priority_over_conflicting_ocr(self):
  self.assertEqual(confirmed_answers({26:[{'answer':'B','confidence':0},{'answer':'C','confidence':3}]}),{26:'B'})
  self.assertEqual(confirmed_answers({26:[{'answer':'B','confidence':1},{'answer':'C','confidence':1}]}),{})
 def test_numbered_and_ranged_answer_rows(self):
  keys=answer_keys(['26. A 27. B 28. C\n29-31: DEF'])
  self.assertEqual([keys[n]['answer'] for n in range(26,32)],list('ABCDEF'))
 def test_appendix_requires_a_preceding_final_question(self):
  self.assertIsNone(answer_appendix('Suggested Version\n46. original question'))
  self.assertIsNotNone(answer_appendix('55. final question\nTranslation\n参考答案\n1. C 2. D 3. A'))
 def test_normalization_preserves_part_in_an_ordinary_sentence(self):
  g={'kind':'writing','questions':[],'paragraphs':[],'task':'Suppose you have taken part in a seminar. You should write at least 120 words but no more than 180 words.'}
  self.assertEqual(core_issues(g),[]);self.assertIn('part in a seminar',g['task'])
 def test_cloze_instructions_do_not_become_fillable_blanks(self):
  g={'kind':'cloze','paragraphs':[{'label':'1','text':'Questions 26 to 35 are based on the following passage. '+ ' '.join('word ___'+str(n)+'___' for n in range(26,36))}],'questions':[]}
  normalize_group(g);first=g['paragraphs'][0]['text'];normalize_group(g)
  self.assertEqual(first,g['paragraphs'][0]['text'])
  for n in range(26,36):self.assertEqual(first.count('['+str(n)+']'),1)
if __name__=='__main__':unittest.main()
