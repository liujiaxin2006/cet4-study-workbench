import unittest
from cet4_frequency import lemma
class WordForms(unittest.TestCase):
 def test_ambiguous_forms_stay_distinct(self):
  entries={w:{'translations':['word']} for w in ['find','found','leave','left','mean','means','see','saw']}
  for w in ['found','left','means','saw']:self.assertEqual(lemma(w,entries),w)
 def test_irregular_and_unambiguous_regular_forms(self):
  entries={w:{'translations':['word']} for w in ['child','write','study','run','make','box','student']}
  for surface,base in [('children','child'),('written','write'),('studies','study'),('running','run'),('making','make'),('boxes','box'),("student's",'student')]:self.assertEqual(lemma(surface,entries),base)
 def test_does_not_guess_multiple_roots(self):
  self.assertIsNone(lemma('hoping',{'hop':{},'hope':{}}))
if __name__=='__main__':unittest.main()
