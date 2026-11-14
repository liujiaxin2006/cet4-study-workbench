import unittest
from cet4_pipeline import set_number,parse_paper,strip_noise,choices
from cet4_prepare import answer_keys,answer_appendix,normalize_group,core_issues,confirmed_answers,answer_layout,question_text_ok,matching_marker_keys,source_answer_keys
class ImportBoundaries(unittest.TestCase):
 def test_numbered_chinese_explanation_header_survives_a_page_continuation(self):
  self.assertEqual(answer_keys(['47. B)。定位)由题干定位到第二段。','下一题详解：因此选D。'])[47]['answer'],'B')
 def test_exam_directions_are_not_usable_choices(self):
  q={'prompt':'Choose an answer.','choices':{'A':'He explained the situation.','B':',','C':'and','D':'Then mark the corresponding letter on Answer Sheet 1.'}}
  self.assertFalse(question_text_ok('news',q))
 def test_matching_statement_with_a_missing_full_stop_keeps_its_printed_number(self):
  raw='Part III Reading Comprehension\nSection B\nA) '+('A complete source paragraph. '*12)+'\n36. A statement about the source.\n40 Leah changed her career.\nSection C\nDirections: Read the next passage.'
  groups,_=parse_paper(raw,{36:'A',40:'A'});g=next(g for g in groups if g['kind']=='matching');self.assertEqual([q['number'] for q in g['questions']],[36,40]);self.assertEqual(g['questions'][1]['prompt'],'Leah changed her career.')
 def test_matching_keys_use_explicit_question_markers_in_translated_paragraphs(self):
  pages=['D)这是原书逐段翻译中的实际段落，其中特别标出的题号是（36），应对应本段。\nF)这是另一段完整翻译，其中标出的题号为（41），并保留定位语句。\nI)这是第三段完整翻译，其中的题号为[40]，并保留定位语句。\n详细讲析\n（45）这不是新的段落对应标记。']
  keys=matching_marker_keys(pages);self.assertEqual({n:k['answer'] for n,k in keys.items()},{36:'D',41:'F',40:'I'});self.assertNotIn(45,keys)
 def test_one_parenthesized_number_does_not_establish_a_matching_key_layout(self):
  self.assertEqual(matching_marker_keys(['A)一个包含很多中文说明的普通选项中偶然出现的数字（40），不能据此推断答案。']),{})
 def test_paragraph_beginning_with_a_question_marker_is_not_attributed_to_its_predecessor(self):
  raw='A)这里是一段完整的中文翻译，后面没有题号标记。\nB)（39）这是紧接题号的完整翻译句子，应该严格归属于本段。\nE)（42）这是另一段紧接题号的完整翻译句子，应该归属于本段。\nF)（45）这是第三段紧接题号的完整翻译句子，应该归属于本段。\n1)（41）这是无法确认段落字母的中文翻译，不应归属于前一段。'
  self.assertEqual({n:v['answer'] for n,v in matching_marker_keys([raw]).items()},{39:'B',42:'E',45:'F'})
 def test_first_option_row_trim_does_not_truncate_the_right_column(self):
  block='A) He has to play football with workmates.            C) He is going to visit a friend.\n        B) He has got some books to read.                     D) He is physically unfit for it.'
  bank=choices(block);self.assertEqual(bank['C'],'He is going to visit a friend.');self.assertEqual(bank['D'],'He is physically unfit for it.')
 def test_answer_letters_stay_with_their_publisher_option_order(self):
  refs=[{'path':'cet4_2023_12_1_ans.pdf','sha256':'latin','extension':'.pdf'},{'path':'中文解析第1套.pdf','sha256':'chinese','extension':'.pdf'}]
  records={10:[{'answer':'B','confidence':0,'sha256':'latin'},{'answer':'A','confidence':3,'sha256':'chinese'}]}
  self.assertEqual(source_answer_keys(records,{'path':'中文真题第1套.pdf','sha256':'paper'},refs)[0][10],'A')
  self.assertEqual(source_answer_keys(records,{'path':'cet4_2023_12_1.pdf','sha256':'paper'},refs)[0][10],'B')
 def test_chinese_answer_verdict_can_end_with_the_word_option(self):
  self.assertEqual(answer_keys(['10. What do we learn?\n解析：他身体非常健康，故答案为A项。'])[10]['answer'],'A')
 def test_reprinted_question_first_option_does_not_conflict_with_its_real_answer(self):
  text='54. A) First option. B) Second option. C) Third option. D) Fourth option.\n54. C)【定位】原文定位说明。'
  self.assertEqual(answer_keys([text])[54]['answer'],'C')
  self.assertNotIn(54,answer_keys(['54. A) First. B) Second. C) Third. D) Fourth.']))
 def test_plain_answer_labels_are_authoritative_not_another_option_discussion(self):
  self.assertEqual(answer_keys(['26.答案：F）innovation\n详解：排除其他选项，下一题的答案为G。'])[26]['answer'],'F')
 def test_square_bracket_paragraph_labels_remain_available_for_matching(self):
  raw='Part III Reading Comprehension\nSection B\n[A] '+('A complete paragraph with authentic reading material. '*8)+'\n36. A statement about this paragraph.\nSection C\nDirections: Read the next text.'
  groups,_=parse_paper(raw,{36:'A'});g=next(g for g in groups if g['kind']=='matching');self.assertEqual(g['paragraphs'][0]['label'],'A');self.assertNotIn('Directions',g['questions'][0]['prompt'])
 def test_footer_is_not_added_to_the_reading_passage(self):
  self.assertEqual(strip_noise('A real sentence.\n19 • 2023年 12月四级真题(第三套)・'),'A real sentence.')
 def test_truncated_options_do_not_pass_as_complete_questions(self):
  q={'prompt':'What happened during the interview?','choices':{'A':'He explained the situation.','B':'At the','C':'I','D':'They accepted the proposal.'}}
  self.assertFalse(question_text_ok('reading',q))

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
