import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../src/config/database';

// ─── TYPE DEFINITIONS ─────────────────────────────────────
type Label = 'A' | 'B' | 'C' | 'D';
type GrammarTopic = 'verb_tense' | 'preposition' | 'pronoun' | 'conjunction' | 'vocabulary' | 'subject_verb_agreement' | 'article' | 'word_form';

interface OptionSeed { label: Label; text: string; isCorrect: boolean; }
interface QuestionSeed { order: number; grammarTopic: GrammarTopic; questionText: string; explanation: string; options: OptionSeed[]; passageContent?: string; }
interface ExamSeed { title: string; part: 'PART5' | 'PART6' | 'PART7'; type: 'FREE' | 'VIP'; difficulty: 'EASY' | 'MEDIUM' | 'HARD'; questions: QuestionSeed[]; }

// ─── 15 EXAMS DATA ────────────────────────────────────────
const EXAMS: ExamSeed[] = [

  // ══════════════════════════════════════════════════════
  // EXAM 1 — PART 5 | FREE | Difficulty 1
  // ══════════════════════════════════════════════════════
  {
    title: 'TOEIC Part 5 - Grammar Basics #1',
    part: 'PART5', type: 'FREE', difficulty: 'EASY',
    questions: [
      {
        order: 1, grammarTopic: 'verb_tense',
        questionText: 'The annual report ___ to all shareholders before the deadline last Friday.',
        explanation: '"Was sent" — thì quá khứ bị động (Past Simple Passive). Dấu hiệu: "last Friday". Cấu trúc: was/were + V3.',
        options: [
          { label: 'A', text: 'was sent',      isCorrect: true  },
          { label: 'B', text: 'has been sent', isCorrect: false },
          { label: 'C', text: 'is sent',       isCorrect: false },
          { label: 'D', text: 'will be sent',  isCorrect: false },
        ],
      },
      {
        order: 2, grammarTopic: 'preposition',
        questionText: 'The manager is responsible ___ overseeing the entire production process.',
        explanation: '"Responsible for" là cụm cố định. "for + V-ing" = chịu trách nhiệm về việc gì.',
        options: [
          { label: 'A', text: 'for', isCorrect: true  },
          { label: 'B', text: 'of',  isCorrect: false },
          { label: 'C', text: 'to',  isCorrect: false },
          { label: 'D', text: 'in',  isCorrect: false },
        ],
      },
      {
        order: 3, grammarTopic: 'article',
        questionText: '___ CEO of the company announced a major restructuring plan yesterday.',
        explanation: '"The" dùng cho danh từ xác định, duy nhất. Mỗi công ty chỉ có một CEO → dùng "The".',
        options: [
          { label: 'A', text: 'The',        isCorrect: true  },
          { label: 'B', text: 'A',          isCorrect: false },
          { label: 'C', text: 'An',         isCorrect: false },
          { label: 'D', text: 'No article', isCorrect: false },
        ],
      },
      {
        order: 4, grammarTopic: 'word_form',
        questionText: 'The new policy will ___ affect all full-time employees starting next month. (SIGNIFICANT)',
        explanation: 'Cần trạng từ "significantly" bổ nghĩa cho động từ "affect". Trạng từ = tính từ + -ly.',
        options: [
          { label: 'A', text: 'significantly', isCorrect: true  },
          { label: 'B', text: 'significant',   isCorrect: false },
          { label: 'C', text: 'significance',  isCorrect: false },
          { label: 'D', text: 'signify',        isCorrect: false },
        ],
      },
      {
        order: 5, grammarTopic: 'conjunction',
        questionText: '___ the weather was unfavorable, the outdoor event proceeded as planned.',
        explanation: '"Although" (mặc dù) theo sau là S + V (mệnh đề đầy đủ). Khác "despite/in spite of" theo sau danh từ.',
        options: [
          { label: 'A', text: 'Although',    isCorrect: true  },
          { label: 'B', text: 'Despite',     isCorrect: false },
          { label: 'C', text: 'Because of',  isCorrect: false },
          { label: 'D', text: 'In spite of', isCorrect: false },
        ],
      },
      {
        order: 6, grammarTopic: 'vocabulary',
        questionText: 'The company decided to ___ its operations to three new Asian markets.',
        explanation: '"Expand" (mở rộng) phù hợp với ngữ cảnh mở rộng thị trường. Phân biệt: "expend" = tiêu hao.',
        options: [
          { label: 'A', text: 'expand',  isCorrect: true  },
          { label: 'B', text: 'expend',  isCorrect: false },
          { label: 'C', text: 'expose',  isCorrect: false },
          { label: 'D', text: 'express', isCorrect: false },
        ],
      },
      {
        order: 7, grammarTopic: 'subject_verb_agreement',
        questionText: 'Neither the director nor the employees ___ informed about the merger talks.',
        explanation: 'Với "neither...nor", động từ chia theo chủ ngữ gần nhất — "employees" (số nhiều) → "were".',
        options: [
          { label: 'A', text: 'were',     isCorrect: true  },
          { label: 'B', text: 'was',      isCorrect: false },
          { label: 'C', text: 'has been', isCorrect: false },
          { label: 'D', text: 'is',       isCorrect: false },
        ],
      },
      {
        order: 8, grammarTopic: 'pronoun',
        questionText: 'Each employee must submit ___ timesheet by 5 PM every Friday.',
        explanation: '"His or her" — đại từ sở hữu trung lập giới tính cho "each employee" (số ít, không xác định giới tính).',
        options: [
          { label: 'A', text: 'his or her', isCorrect: true  },
          { label: 'B', text: 'their',      isCorrect: false },
          { label: 'C', text: 'its',        isCorrect: false },
          { label: 'D', text: 'our',        isCorrect: false },
        ],
      },
      {
        order: 9, grammarTopic: 'preposition',
        questionText: 'The invoice must be paid ___ 30 days of receiving the goods.',
        explanation: '"Within 30 days" (trong vòng 30 ngày) — cụm cố định trong thương mại. Khác "in 30 days" = sau 30 ngày.',
        options: [
          { label: 'A', text: 'within', isCorrect: true  },
          { label: 'B', text: 'during', isCorrect: false },
          { label: 'C', text: 'after',  isCorrect: false },
          { label: 'D', text: 'until',  isCorrect: false },
        ],
      },
      {
        order: 10, grammarTopic: 'verb_tense',
        questionText: 'By the time the auditors arrived, the accounting team ___ all documents.',
        explanation: '"Had prepared" — thì quá khứ hoàn thành (Past Perfect). Hành động hoàn thành trước một mốc quá khứ khác (arrived).',
        options: [
          { label: 'A', text: 'had prepared', isCorrect: true  },
          { label: 'B', text: 'prepared',     isCorrect: false },
          { label: 'C', text: 'has prepared', isCorrect: false },
          { label: 'D', text: 'was preparing',isCorrect: false },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════
  // EXAM 2 — PART 5 | FREE | Difficulty 2
  // ══════════════════════════════════════════════════════
  {
    title: 'TOEIC Part 5 - Grammar Basics #2',
    part: 'PART5', type: 'FREE', difficulty: 'MEDIUM',
    questions: [
      {
        order: 1, grammarTopic: 'word_form',
        questionText: 'The manager gave a very ___ presentation at the quarterly review. (IMPRESS)',
        explanation: '"Impressive" — tính từ bổ nghĩa cho danh từ "presentation". Phân biệt: "impressed" = người bị gây ấn tượng; "impressive" = thứ gây ấn tượng.',
        options: [
          { label: 'A', text: 'impressive',   isCorrect: true  },
          { label: 'B', text: 'impressed',    isCorrect: false },
          { label: 'C', text: 'impression',   isCorrect: false },
          { label: 'D', text: 'impressively', isCorrect: false },
        ],
      },
      {
        order: 2, grammarTopic: 'conjunction',
        questionText: 'The factory increased production ___ meet the surge in seasonal demand.',
        explanation: '"In order to" theo sau là động từ nguyên thể, diễn đạt mục đích. Phù hợp hơn "so that" (theo sau là S+V).',
        options: [
          { label: 'A', text: 'in order to',  isCorrect: true  },
          { label: 'B', text: 'so that',      isCorrect: false },
          { label: 'C', text: 'as long as',   isCorrect: false },
          { label: 'D', text: 'provided that',isCorrect: false },
        ],
      },
      {
        order: 3, grammarTopic: 'preposition',
        questionText: 'The conference will be held ___ the Grand Hilton Hotel next Tuesday.',
        explanation: '"At" chỉ địa điểm cụ thể (at a hotel/venue/address). Phân biệt: "in a city/country", "on a street".',
        options: [
          { label: 'A', text: 'at', isCorrect: true  },
          { label: 'B', text: 'in', isCorrect: false },
          { label: 'C', text: 'on', isCorrect: false },
          { label: 'D', text: 'by', isCorrect: false },
        ],
      },
      {
        order: 4, grammarTopic: 'vocabulary',
        questionText: 'The financial report must be ___ to the head office no later than March 31.',
        explanation: '"Submitted" — "submit a report" là colocation chuẩn trong tiếng Anh thương mại. "Send" ít trang trọng hơn.',
        options: [
          { label: 'A', text: 'submitted',   isCorrect: true  },
          { label: 'B', text: 'transmitted', isCorrect: false },
          { label: 'C', text: 'delivered',   isCorrect: false },
          { label: 'D', text: 'transferred', isCorrect: false },
        ],
      },
      {
        order: 5, grammarTopic: 'subject_verb_agreement',
        questionText: 'Either the supervisor or the team members ___ responsible for filing the weekly reports.',
        explanation: '"Either...or" → chia theo chủ ngữ gần nhất. "Team members" (số nhiều) → "are".',
        options: [
          { label: 'A', text: 'are',      isCorrect: true  },
          { label: 'B', text: 'is',       isCorrect: false },
          { label: 'C', text: 'was',      isCorrect: false },
          { label: 'D', text: 'has been', isCorrect: false },
        ],
      },
      {
        order: 6, grammarTopic: 'pronoun',
        questionText: 'All employees are required to update ___ contact information in the HR portal by Friday.',
        explanation: '"Their" — số nhiều trung lập giới tính cho "all employees" (số nhiều). Đây là dạng chuẩn nhất trong tiếng Anh hiện đại.',
        options: [
          { label: 'A', text: 'their', isCorrect: true  },
          { label: 'B', text: 'its',   isCorrect: false },
          { label: 'C', text: 'his',   isCorrect: false },
          { label: 'D', text: 'our',   isCorrect: false },
        ],
      },
      {
        order: 7, grammarTopic: 'verb_tense',
        questionText: 'The research team ___ on the new formula for over two years without a breakthrough.',
        explanation: '"Has been working" — Present Perfect Continuous nhấn mạnh hành động liên tục từ quá khứ đến hiện tại. Dấu hiệu: "for over two years".',
        options: [
          { label: 'A', text: 'has been working', isCorrect: true  },
          { label: 'B', text: 'worked',           isCorrect: false },
          { label: 'C', text: 'is working',       isCorrect: false },
          { label: 'D', text: 'had worked',       isCorrect: false },
        ],
      },
      {
        order: 8, grammarTopic: 'article',
        questionText: 'We are seeking ___ experienced accountant to strengthen our finance team.',
        explanation: '"An" dùng trước âm nguyên âm — "experienced" bắt đầu bằng /ɪ/ (nguyên âm). Quy tắc: a + phụ âm, an + nguyên âm.',
        options: [
          { label: 'A', text: 'an',         isCorrect: true  },
          { label: 'B', text: 'a',          isCorrect: false },
          { label: 'C', text: 'the',        isCorrect: false },
          { label: 'D', text: 'no article', isCorrect: false },
        ],
      },
      {
        order: 9, grammarTopic: 'word_form',
        questionText: 'It is the ___ of every staff member to report workplace hazards immediately. (RESPONSIBLE)',
        explanation: 'Cần danh từ "responsibility" làm bổ ngữ sau "the". Cấu trúc: "It is the responsibility of + người + to + V".',
        options: [
          { label: 'A', text: 'responsibility', isCorrect: true  },
          { label: 'B', text: 'responsible',    isCorrect: false },
          { label: 'C', text: 'responsibly',    isCorrect: false },
          { label: 'D', text: 'respond',         isCorrect: false },
        ],
      },
      {
        order: 10, grammarTopic: 'conjunction',
        questionText: 'The company will proceed with the expansion ___ it secures the necessary funding.',
        explanation: '"Once" (một khi) — điều kiện về thời gian: hành động xảy ra ngay sau khi điều kiện được đáp ứng. Khác "unless" = trừ khi.',
        options: [
          { label: 'A', text: 'once',    isCorrect: true  },
          { label: 'B', text: 'unless',  isCorrect: false },
          { label: 'C', text: 'whereas', isCorrect: false },
          { label: 'D', text: 'although',isCorrect: false },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════
  // EXAM 3 — PART 5 | FREE | Difficulty 1
  // ══════════════════════════════════════════════════════
  {
    title: 'TOEIC Part 5 - Grammar Basics #3',
    part: 'PART5', type: 'FREE', difficulty: 'EASY',
    questions: [
      {
        order: 1, grammarTopic: 'preposition',
        questionText: 'Mr. Johnson has been working ___ the sales department for the past three years.',
        explanation: '"In" dùng cho phòng ban (working in a department). Phân biệt: "at a company/office", "for a company" (làm việc cho).',
        options: [
          { label: 'A', text: 'in',  isCorrect: true  },
          { label: 'B', text: 'at',  isCorrect: false },
          { label: 'C', text: 'for', isCorrect: false },
          { label: 'D', text: 'on',  isCorrect: false },
        ],
      },
      {
        order: 2, grammarTopic: 'vocabulary',
        questionText: 'The new safety regulations will ___ all manufacturing facilities nationwide.',
        explanation: '"Apply to" (áp dụng cho) là cụm động từ đúng ngữ nghĩa. "Apply to all facilities" = có hiệu lực với tất cả cơ sở.',
        options: [
          { label: 'A', text: 'apply to',   isCorrect: true  },
          { label: 'B', text: 'comply to',  isCorrect: false },
          { label: 'C', text: 'relate for', isCorrect: false },
          { label: 'D', text: 'concern to', isCorrect: false },
        ],
      },
      {
        order: 3, grammarTopic: 'verb_tense',
        questionText: 'The company ___ its 50th anniversary next year with a major celebration.',
        explanation: '"Will celebrate" — thì tương lai đơn cho kế hoạch/sự kiện cụ thể trong tương lai. Dấu hiệu: "next year".',
        options: [
          { label: 'A', text: 'will celebrate', isCorrect: true  },
          { label: 'B', text: 'celebrates',     isCorrect: false },
          { label: 'C', text: 'celebrated',     isCorrect: false },
          { label: 'D', text: 'is celebrating', isCorrect: false },
        ],
      },
      {
        order: 4, grammarTopic: 'word_form',
        questionText: 'The ___ of the new product line exceeded all initial sales forecasts. (INTRODUCE)',
        explanation: 'Cần danh từ "introduction" làm chủ ngữ. "The introduction of..." = việc ra mắt/giới thiệu...',
        options: [
          { label: 'A', text: 'introduction',  isCorrect: true  },
          { label: 'B', text: 'introductory',  isCorrect: false },
          { label: 'C', text: 'introduce',     isCorrect: false },
          { label: 'D', text: 'introduced',    isCorrect: false },
        ],
      },
      {
        order: 5, grammarTopic: 'subject_verb_agreement',
        questionText: 'The number of online orders ___ increased by 40% compared to last quarter.',
        explanation: '"The number of" + danh từ số nhiều → động từ số ÍT. Phân biệt: "A number of" → động từ số nhiều.',
        options: [
          { label: 'A', text: 'has',  isCorrect: true  },
          { label: 'B', text: 'have', isCorrect: false },
          { label: 'C', text: 'were', isCorrect: false },
          { label: 'D', text: 'are',  isCorrect: false },
        ],
      },
      {
        order: 6, grammarTopic: 'article',
        questionText: 'Please submit ___ application form along with your resume and cover letter.',
        explanation: '"The" — "application form" đã được xác định cụ thể (người đọc biết đó là form nào). Không phải "a" (form không xác định).',
        options: [
          { label: 'A', text: 'the',        isCorrect: true  },
          { label: 'B', text: 'a',          isCorrect: false },
          { label: 'C', text: 'an',         isCorrect: false },
          { label: 'D', text: 'no article', isCorrect: false },
        ],
      },
      {
        order: 7, grammarTopic: 'conjunction',
        questionText: 'Please review the contract carefully ___ signing it.',
        explanation: '"Before" theo sau là V-ing khi cùng chủ ngữ. "Before signing" = trước khi ký.',
        options: [
          { label: 'A', text: 'before',    isCorrect: true  },
          { label: 'B', text: 'after',     isCorrect: false },
          { label: 'C', text: 'while',     isCorrect: false },
          { label: 'D', text: 'when',      isCorrect: false },
        ],
      },
      {
        order: 8, grammarTopic: 'pronoun',
        questionText: 'The board reviewed ___ decision after receiving feedback from shareholders.',
        explanation: '"Its" — đại từ sở hữu ngôi 3 số ít trung lập cho "the board" (được xem là thực thể duy nhất).',
        options: [
          { label: 'A', text: 'its',   isCorrect: true  },
          { label: 'B', text: 'their', isCorrect: false },
          { label: 'C', text: 'his',   isCorrect: false },
          { label: 'D', text: 'the',   isCorrect: false },
        ],
      },
      {
        order: 9, grammarTopic: 'preposition',
        questionText: 'The new branch will open ___ schedule, ahead of the original deadline.',
        explanation: '"On schedule" (đúng kế hoạch) là cụm cố định. Tương tự: "on time", "on budget".',
        options: [
          { label: 'A', text: 'on',  isCorrect: true  },
          { label: 'B', text: 'in',  isCorrect: false },
          { label: 'C', text: 'at',  isCorrect: false },
          { label: 'D', text: 'by',  isCorrect: false },
        ],
      },
      {
        order: 10, grammarTopic: 'vocabulary',
        questionText: 'Candidates who ___ all requirements will be contacted for an interview.',
        explanation: '"Meet the requirements" (đáp ứng yêu cầu) là colocation chuẩn và phổ biến nhất trong tuyển dụng TOEIC.',
        options: [
          { label: 'A', text: 'meet',   isCorrect: true  },
          { label: 'B', text: 'fill',   isCorrect: false },
          { label: 'C', text: 'reach',  isCorrect: false },
          { label: 'D', text: 'follow', isCorrect: false },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════
  // EXAM 4 — PART 5 | VIP | Difficulty 3
  // ══════════════════════════════════════════════════════
  {
    title: 'TOEIC Part 5 - Advanced #1',
    part: 'PART5', type: 'VIP', difficulty: 'HARD',
    questions: [
      {
        order: 1, grammarTopic: 'verb_tense',
        questionText: 'The CEO announced that profits ___ by 15% in the following fiscal quarter.',
        explanation: '"Would increase" — Reported Speech: câu tường thuật sau "announced that" chuyển "will" → "would".',
        options: [
          { label: 'A', text: 'would increase', isCorrect: true  },
          { label: 'B', text: 'will increase',  isCorrect: false },
          { label: 'C', text: 'had increased',  isCorrect: false },
          { label: 'D', text: 'increased',      isCorrect: false },
        ],
      },
      {
        order: 2, grammarTopic: 'vocabulary',
        questionText: 'The board ___ a new compliance policy requiring all transactions to be documented.',
        explanation: '"Implemented" — "implement a policy" là colocation chuẩn trong TOEIC. Không dùng "accomplished/fulfilled" với "policy".',
        options: [
          { label: 'A', text: 'implemented',  isCorrect: true  },
          { label: 'B', text: 'accomplished', isCorrect: false },
          { label: 'C', text: 'fulfilled',    isCorrect: false },
          { label: 'D', text: 'performed',    isCorrect: false },
        ],
      },
      {
        order: 3, grammarTopic: 'preposition',
        questionText: 'The proposal was rejected ___ grounds that it lacked sufficient market research.',
        explanation: '"On the grounds that" (với lý do rằng) — cụm giới từ cố định trong văn bản pháp lý/kinh doanh.',
        options: [
          { label: 'A', text: 'on',   isCorrect: true  },
          { label: 'B', text: 'for',  isCorrect: false },
          { label: 'C', text: 'with', isCorrect: false },
          { label: 'D', text: 'by',   isCorrect: false },
        ],
      },
      {
        order: 4, grammarTopic: 'word_form',
        questionText: 'The merger was completed ___ thanks to the diligence of the legal team. (SMOOTH)',
        explanation: '"Smoothly" — trạng từ bổ nghĩa cho động từ "was completed". Trạng từ trả lời câu hỏi "hoàn thành như thế nào?".',
        options: [
          { label: 'A', text: 'smoothly',  isCorrect: true  },
          { label: 'B', text: 'smooth',    isCorrect: false },
          { label: 'C', text: 'smoothness',isCorrect: false },
          { label: 'D', text: 'smoother',  isCorrect: false },
        ],
      },
      {
        order: 5, grammarTopic: 'conjunction',
        questionText: '___ the significant price increase, consumer demand remained surprisingly strong.',
        explanation: '"Despite" theo sau bởi danh từ/cụm danh từ. "Despite + N/V-ing" vs "Although + S + V". "The significant price increase" là cụm danh từ.',
        options: [
          { label: 'A', text: 'Despite',    isCorrect: true  },
          { label: 'B', text: 'Although',   isCorrect: false },
          { label: 'C', text: 'However',    isCorrect: false },
          { label: 'D', text: 'Even though',isCorrect: false },
        ],
      },
      {
        order: 6, grammarTopic: 'subject_verb_agreement',
        questionText: 'The quality of all products manufactured at this facility ___ been thoroughly inspected.',
        explanation: '"Has" — chủ ngữ thực là "quality" (số ít). Cụm "of all products manufactured..." không làm thay đổi động từ.',
        options: [
          { label: 'A', text: 'has',  isCorrect: true  },
          { label: 'B', text: 'have', isCorrect: false },
          { label: 'C', text: 'had',  isCorrect: false },
          { label: 'D', text: 'were', isCorrect: false },
        ],
      },
      {
        order: 7, grammarTopic: 'preposition',
        questionText: 'The new regulation will come ___ effect on the first business day of next quarter.',
        explanation: '"Come into effect" (có hiệu lực) — phrasal verb cố định. Không dùng "in effect" (= đang có hiệu lực) hay "to/for effect".',
        options: [
          { label: 'A', text: 'into', isCorrect: true  },
          { label: 'B', text: 'in',   isCorrect: false },
          { label: 'C', text: 'to',   isCorrect: false },
          { label: 'D', text: 'for',  isCorrect: false },
        ],
      },
      {
        order: 8, grammarTopic: 'article',
        questionText: 'This is ___ most comprehensive analysis the consulting firm has ever produced.',
        explanation: '"The" dùng trước so sánh nhất. Quy tắc bất biến: "the + most/least/best/worst + noun".',
        options: [
          { label: 'A', text: 'the',        isCorrect: true  },
          { label: 'B', text: 'a',          isCorrect: false },
          { label: 'C', text: 'an',         isCorrect: false },
          { label: 'D', text: 'no article', isCorrect: false },
        ],
      },
      {
        order: 9, grammarTopic: 'vocabulary',
        questionText: 'The audit revealed several ___ in the company\'s accounting records.',
        explanation: '"Discrepancies" (sự sai lệch, không nhất quán) — từ chuẩn TOEIC trong ngữ cảnh kiểm toán tài chính.',
        options: [
          { label: 'A', text: 'discrepancies', isCorrect: true  },
          { label: 'B', text: 'discoveries',   isCorrect: false },
          { label: 'C', text: 'differences',   isCorrect: false },
          { label: 'D', text: 'disruptions',   isCorrect: false },
        ],
      },
      {
        order: 10, grammarTopic: 'verb_tense',
        questionText: 'If the funding ___ approved last year, the project would have been completed by now.',
        explanation: '"Had been approved" — Điều kiện loại 3 (unreal past): If + S + had + V3, S + would have + V3. Sự việc không xảy ra trong quá khứ.',
        options: [
          { label: 'A', text: 'had been approved', isCorrect: true  },
          { label: 'B', text: 'was approved',      isCorrect: false },
          { label: 'C', text: 'were approved',     isCorrect: false },
          { label: 'D', text: 'has been approved', isCorrect: false },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════
  // EXAM 5 — PART 5 | VIP | Difficulty 3
  // ══════════════════════════════════════════════════════
  {
    title: 'TOEIC Part 5 - Advanced #2',
    part: 'PART5', type: 'VIP', difficulty: 'HARD',
    questions: [
      {
        order: 1, grammarTopic: 'vocabulary',
        questionText: 'Please ___ your attendance at the annual gala by responding to this email.',
        explanation: '"Confirm your attendance" là collocation chuẩn trong thư mời. Phân biệt: "ensure" (đảm bảo), "assure" (cam kết với ai), "affirm" (khẳng định niềm tin).',
        options: [
          { label: 'A', text: 'confirm', isCorrect: true  },
          { label: 'B', text: 'affirm',  isCorrect: false },
          { label: 'C', text: 'assure',  isCorrect: false },
          { label: 'D', text: 'ensure',  isCorrect: false },
        ],
      },
      {
        order: 2, grammarTopic: 'verb_tense',
        questionText: 'The contractor ___ the renovation by Friday if the materials arrive tomorrow.',
        explanation: '"Will have completed" — Future Perfect: hành động hoàn thành trước một mốc thời gian trong tương lai ("by Friday").',
        options: [
          { label: 'A', text: 'will have completed', isCorrect: true  },
          { label: 'B', text: 'will complete',       isCorrect: false },
          { label: 'C', text: 'has completed',       isCorrect: false },
          { label: 'D', text: 'would complete',      isCorrect: false },
        ],
      },
      {
        order: 3, grammarTopic: 'preposition',
        questionText: 'Sales figures for Q3 fell short ___ the targets set at the start of the fiscal year.',
        explanation: '"Fall short of" (không đạt được) — phrasal verb cố định hay xuất hiện trong TOEIC. "Fall short of the target" = không đạt chỉ tiêu.',
        options: [
          { label: 'A', text: 'of',   isCorrect: true  },
          { label: 'B', text: 'from', isCorrect: false },
          { label: 'C', text: 'by',   isCorrect: false },
          { label: 'D', text: 'in',   isCorrect: false },
        ],
      },
      {
        order: 4, grammarTopic: 'word_form',
        questionText: 'The government introduced new measures to ___ foreign investment in the tech sector. (COURAGE)',
        explanation: '"Encourage" — động từ tạo từ "en-" + "courage". "Encourage foreign investment" = khuyến khích đầu tư nước ngoài.',
        options: [
          { label: 'A', text: 'encourage',     isCorrect: true  },
          { label: 'B', text: 'courageous',    isCorrect: false },
          { label: 'C', text: 'encouragement', isCorrect: false },
          { label: 'D', text: 'courageously',  isCorrect: false },
        ],
      },
      {
        order: 5, grammarTopic: 'conjunction',
        questionText: 'The shipment was delayed; ___, we had to inform all clients immediately.',
        explanation: '"Therefore" (do đó) — conjunctive adverb nối hai mệnh đề độc lập sau dấu chấm phẩy, chỉ kết quả logic tất yếu.',
        options: [
          { label: 'A', text: 'therefore',  isCorrect: true  },
          { label: 'B', text: 'however',    isCorrect: false },
          { label: 'C', text: 'moreover',   isCorrect: false },
          { label: 'D', text: 'otherwise',  isCorrect: false },
        ],
      },
      {
        order: 6, grammarTopic: 'subject_verb_agreement',
        questionText: 'A number of complaints ___ received regarding the new billing system.',
        explanation: '"Have been received" — "A number of" (= many) → động từ số nhiều. Phân biệt: "The number of complaints HAS increased."',
        options: [
          { label: 'A', text: 'have been', isCorrect: true  },
          { label: 'B', text: 'has been',  isCorrect: false },
          { label: 'C', text: 'was',       isCorrect: false },
          { label: 'D', text: 'is',        isCorrect: false },
        ],
      },
      {
        order: 7, grammarTopic: 'preposition',
        questionText: 'The CEO stepped down ___ pressure from major institutional shareholders.',
        explanation: '"Under pressure" — "step down under pressure" là cụm cố định. Không dùng "from pressure" hay "with pressure".',
        options: [
          { label: 'A', text: 'under', isCorrect: true  },
          { label: 'B', text: 'from',  isCorrect: false },
          { label: 'C', text: 'with',  isCorrect: false },
          { label: 'D', text: 'by',    isCorrect: false },
        ],
      },
      {
        order: 8, grammarTopic: 'word_form',
        questionText: 'The committee was unable to reach a ___ on the proposed budget allocation. (CONCLUDE)',
        explanation: '"Conclusion" — "reach a conclusion" là cụm cố định. Tương tự: reach a decision / agreement / consensus.',
        options: [
          { label: 'A', text: 'conclusion',  isCorrect: true  },
          { label: 'B', text: 'conclusive',  isCorrect: false },
          { label: 'C', text: 'conclude',    isCorrect: false },
          { label: 'D', text: 'conclusively',isCorrect: false },
        ],
      },
      {
        order: 9, grammarTopic: 'vocabulary',
        questionText: 'The new model was ___ as a breakthrough in battery technology by industry analysts.',
        explanation: '"Hailed as" (được ca ngợi là) — collocation chuẩn trong văn phong báo chí/kinh doanh. "Hailed as a breakthrough" hay xuất hiện trong TOEIC Part 7.',
        options: [
          { label: 'A', text: 'hailed',    isCorrect: true  },
          { label: 'B', text: 'regarded',  isCorrect: false },
          { label: 'C', text: 'considered',isCorrect: false },
          { label: 'D', text: 'described', isCorrect: false },
        ],
      },
      {
        order: 10, grammarTopic: 'conjunction',
        questionText: 'Ms. Park will serve as interim director ___ a permanent replacement is identified.',
        explanation: '"Until" (cho đến khi) — diễn đạt trạng thái tạm thời kéo dài cho đến khi một điều kiện khác xảy ra. "Unless" = trừ phi (ngược nghĩa).',
        options: [
          { label: 'A', text: 'until',    isCorrect: true  },
          { label: 'B', text: 'unless',   isCorrect: false },
          { label: 'C', text: 'whenever', isCorrect: false },
          { label: 'D', text: 'while',    isCorrect: false },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════
  // EXAM 6 — PART 6 | FREE | Difficulty 1
  // Text: Internal memo – updated leave policy (4 questions/passage × 2 passages)
  // ══════════════════════════════════════════════════════
  {
    title: 'TOEIC Part 6 - Text Completion #1',
    part: 'PART6', type: 'FREE', difficulty: 'EASY',
    questions: [
      // ── Passage A: Internal Memo ──────────────────────
      {
        order: 1, grammarTopic: 'verb_tense',
        questionText:
          '[MEMO – Passage A, Q1]\n' +
          'To: All Staff\n' +
          'Subject: Updated Leave Policy\n\n' +
          'Effective next month, all annual leave requests must ___ at least two weeks in advance.',
        explanation: '"Be submitted" — thể bị động bắt buộc vì chủ thể "leave requests" nhận hành động. "Must + be + V3" = phải được nộp.',
        options: [
          { label: 'A', text: 'be submitted', isCorrect: true  },
          { label: 'B', text: 'submit',       isCorrect: false },
          { label: 'C', text: 'submitting',   isCorrect: false },
          { label: 'D', text: 'have submitted',isCorrect: false },
        ],
      },
      {
        order: 2, grammarTopic: 'vocabulary',
        questionText:
          '[MEMO – Passage A, Q2]\n' +
          '___ your direct line manager first, then forward the approved form to HR for processing.',
        explanation: '"Notify" (thông báo cho ai) — "notify someone" là colocation đúng. "Inform to" và "advise to" là sai ngữ pháp.',
        options: [
          { label: 'A', text: 'Notify',      isCorrect: true  },
          { label: 'B', text: 'Inform to',   isCorrect: false },
          { label: 'C', text: 'Advise to',   isCorrect: false },
          { label: 'D', text: 'Contact with',isCorrect: false },
        ],
      },
      {
        order: 3, grammarTopic: 'conjunction',
        questionText:
          '[MEMO – Passage A, Q3]\n' +
          'Requests will be approved on a first-come, first-served basis, ___ the operational requirements of each team.',
        explanation: '"Subject to" (tùy thuộc vào / có điều kiện là) — cụm giới từ cố định trong văn bản hành chính. "Subject to operational requirements" = điều kiện ràng buộc.',
        options: [
          { label: 'A', text: 'subject to',    isCorrect: true  },
          { label: 'B', text: 'regardless of', isCorrect: false },
          { label: 'C', text: 'as well as',    isCorrect: false },
          { label: 'D', text: 'in spite of',   isCorrect: false },
        ],
      },
      {
        order: 4, grammarTopic: 'word_form',
        questionText:
          '[MEMO – Passage A, Q4]\n' +
          'For ___ information on the updated leave policy, please refer to Section 4 of the Employee Handbook. (ADD)',
        explanation: '"Additional" — tính từ bổ nghĩa cho "information". "For additional information" là công thức kết thúc chuẩn trong văn bản hành chính.',
        options: [
          { label: 'A', text: 'additional',   isCorrect: true  },
          { label: 'B', text: 'addition',     isCorrect: false },
          { label: 'C', text: 'additionally', isCorrect: false },
          { label: 'D', text: 'added',        isCorrect: false },
        ],
      },
      // ── Passage B: Business Email ─────────────────────
      {
        order: 5, grammarTopic: 'preposition',
        questionText:
          '[EMAIL – Passage B, Q5]\n' +
          'Dear Mr. Tanaka,\n\n' +
          'I am writing ___ behalf of our Managing Director to extend a formal invitation to our annual gala dinner.',
        explanation: '"On behalf of" (thay mặt cho) — cụm giới từ cố định trong thư trang trọng. Không dùng "in/by/for behalf of".',
        options: [
          { label: 'A', text: 'on',  isCorrect: true  },
          { label: 'B', text: 'in',  isCorrect: false },
          { label: 'C', text: 'at',  isCorrect: false },
          { label: 'D', text: 'by',  isCorrect: false },
        ],
      },
      {
        order: 6, grammarTopic: 'verb_tense',
        questionText:
          '[EMAIL – Passage B, Q6]\n' +
          'The event ___ at the Grand Ballroom of the Marriott Hotel on the evening of December 15.',
        explanation: '"Will be held" — thì tương lai bị động cho sự kiện được tổ chức (held = passive). Dấu hiệu: "on the evening of December 15" = thời điểm tương lai.',
        options: [
          { label: 'A', text: 'will be held', isCorrect: true  },
          { label: 'B', text: 'is held',      isCorrect: false },
          { label: 'C', text: 'was held',     isCorrect: false },
          { label: 'D', text: 'holds',        isCorrect: false },
        ],
      },
      {
        order: 7, grammarTopic: 'vocabulary',
        questionText:
          '[EMAIL – Passage B, Q7]\n' +
          'Kindly ___ your attendance by November 30 so that we can make the necessary seating arrangements.',
        explanation: '"Confirm your attendance" — collocation chuẩn và duy nhất đúng trong thư mời. Đây là cụm xuất hiện thường xuyên trong TOEIC.',
        options: [
          { label: 'A', text: 'confirm',  isCorrect: true  },
          { label: 'B', text: 'verify',   isCorrect: false },
          { label: 'C', text: 'validate', isCorrect: false },
          { label: 'D', text: 'certify',  isCorrect: false },
        ],
      },
      {
        order: 8, grammarTopic: 'word_form',
        questionText:
          '[EMAIL – Passage B, Q8]\n' +
          'We look forward to your ___ presence at this important occasion. (GRACE)',
        explanation: '"Gracious" — tính từ bổ nghĩa cho "presence". "Gracious presence" là cách diễn đạt lịch sự trang trọng trong thư mời.',
        options: [
          { label: 'A', text: 'gracious',  isCorrect: true  },
          { label: 'B', text: 'grace',     isCorrect: false },
          { label: 'C', text: 'gracefully',isCorrect: false },
          { label: 'D', text: 'graced',    isCorrect: false },
        ],
      },
      {
        order: 9, grammarTopic: 'conjunction',
        questionText:
          '[EMAIL – Passage B, Q9]\n' +
          'Please do not hesitate to contact us ___ you require any further assistance regarding the event.',
        explanation: '"Should" (đảo ngữ điều kiện lịch sự) — "Should you require" = "If you should require". Đây là cấu trúc trang trọng phổ biến trong thư kinh doanh TOEIC.',
        options: [
          { label: 'A', text: 'should',   isCorrect: true  },
          { label: 'B', text: 'if',       isCorrect: false },
          { label: 'C', text: 'whenever', isCorrect: false },
          { label: 'D', text: 'unless',   isCorrect: false },
        ],
      },
      {
        order: 10, grammarTopic: 'preposition',
        questionText:
          '[EMAIL – Passage B, Q10]\n' +
          'We sincerely hope you will be able to join us ___ this special occasion.',
        explanation: '"On this occasion" (nhân dịp này) — cụm giới từ cố định. "On a special occasion" = vào dịp đặc biệt.',
        options: [
          { label: 'A', text: 'on',   isCorrect: true  },
          { label: 'B', text: 'at',   isCorrect: false },
          { label: 'C', text: 'for',  isCorrect: false },
          { label: 'D', text: 'in',   isCorrect: false },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════
  // EXAM 7 — PART 6 | FREE | Difficulty 2
  // ══════════════════════════════════════════════════════
  {
    title: 'TOEIC Part 6 - Text Completion #2',
    part: 'PART6', type: 'FREE', difficulty: 'MEDIUM',
    questions: [
      // ── Passage A: Job Advertisement ─────────────────
      {
        order: 1, grammarTopic: 'vocabulary',
        questionText:
          '[JOB AD – Passage A, Q1]\n' +
          'Nexus Technologies is ___ applications for the position of Senior Software Engineer.',
        explanation: '"Accepting applications" — "accept applications" là collocation chuẩn trong thông báo tuyển dụng. "Receiving" cũng có thể dùng nhưng "accepting" là chính xác nhất.',
        options: [
          { label: 'A', text: 'accepting',  isCorrect: true  },
          { label: 'B', text: 'requesting', isCorrect: false },
          { label: 'C', text: 'demanding',  isCorrect: false },
          { label: 'D', text: 'collecting', isCorrect: false },
        ],
      },
      {
        order: 2, grammarTopic: 'word_form',
        questionText:
          '[JOB AD – Passage A, Q2]\n' +
          'The ideal candidate must have ___ communication skills and proven project management experience. (EXCEL)',
        explanation: '"Excellent" — tính từ bổ nghĩa cho danh từ "skills". "Excellent communication skills" là cụm phổ biến nhất trong Job Description TOEIC.',
        options: [
          { label: 'A', text: 'excellent',  isCorrect: true  },
          { label: 'B', text: 'excellence', isCorrect: false },
          { label: 'C', text: 'excel',      isCorrect: false },
          { label: 'D', text: 'excelling',  isCorrect: false },
        ],
      },
      {
        order: 3, grammarTopic: 'preposition',
        questionText:
          '[JOB AD – Passage A, Q3]\n' +
          'Applicants must be proficient ___ at least two programming languages including Python or Java.',
        explanation: '"Proficient in" — "be proficient in a skill/language" là collocation cố định. Không dùng "proficient at/with/on".',
        options: [
          { label: 'A', text: 'in',   isCorrect: true  },
          { label: 'B', text: 'at',   isCorrect: false },
          { label: 'C', text: 'with', isCorrect: false },
          { label: 'D', text: 'on',   isCorrect: false },
        ],
      },
      {
        order: 4, grammarTopic: 'conjunction',
        questionText:
          '[JOB AD – Passage A, Q4]\n' +
          'Candidates who meet all the requirements listed ___ will be invited to a panel interview.',
        explanation: '"Above" (ở trên, như đã liệt kê) — dùng để chỉ thông tin đã đề cập trước đó trong văn bản. Đây là từ thông dụng trong Job Description TOEIC.',
        options: [
          { label: 'A', text: 'above',   isCorrect: true  },
          { label: 'B', text: 'below',   isCorrect: false },
          { label: 'C', text: 'herein',  isCorrect: false },
          { label: 'D', text: 'thereof', isCorrect: false },
        ],
      },
      // ── Passage B: Customer Service Email ────────────
      {
        order: 5, grammarTopic: 'verb_tense',
        questionText:
          '[EMAIL – Passage B, Q5]\n' +
          'Dear Ms. Rivera, Thank you for contacting us. We ___ your complaint and are currently reviewing it.',
        explanation: '"Have received" — Present Perfect phù hợp vì hành động vừa xảy ra và có liên quan đến hiện tại (đang xử lý). Dùng trong thư phản hồi khách hàng.',
        options: [
          { label: 'A', text: 'have received', isCorrect: true  },
          { label: 'B', text: 'received',      isCorrect: false },
          { label: 'C', text: 'are receiving', isCorrect: false },
          { label: 'D', text: 'had received',  isCorrect: false },
        ],
      },
      {
        order: 6, grammarTopic: 'vocabulary',
        questionText:
          '[EMAIL – Passage B, Q6]\n' +
          'We sincerely ___ for any inconvenience this delay may have caused.',
        explanation: '"Apologize for" (xin lỗi vì) — "apologize for + N/V-ing" là cụm cố định. Đây là công thức thư customer service chuẩn TOEIC.',
        options: [
          { label: 'A', text: 'apologize', isCorrect: true  },
          { label: 'B', text: 'regret',    isCorrect: false },
          { label: 'C', text: 'excuse',    isCorrect: false },
          { label: 'D', text: 'sorry',     isCorrect: false },
        ],
      },
      {
        order: 7, grammarTopic: 'conjunction',
        questionText:
          '[EMAIL – Passage B, Q7]\n' +
          'Our team will process your refund within 5-7 business days, ___ your bank\'s processing time may add an additional 2 days.',
        explanation: '"Although" (mặc dù) — nối hai vế tương phản: cam kết xử lý trong 5-7 ngày nhưng thời gian ngân hàng có thể thêm. Đây là cách diễn đạt minh bạch trong thư khách hàng.',
        options: [
          { label: 'A', text: 'although',  isCorrect: true  },
          { label: 'B', text: 'because',   isCorrect: false },
          { label: 'C', text: 'provided',  isCorrect: false },
          { label: 'D', text: 'therefore', isCorrect: false },
        ],
      },
      {
        order: 8, grammarTopic: 'preposition',
        questionText:
          '[EMAIL – Passage B, Q8]\n' +
          'Please feel free to reach out ___ us if you have any further questions.',
        explanation: '"Reach out to" (liên hệ với) — phrasal verb cố định. "Reach out to someone" = liên hệ với ai. Phổ biến trong thư kinh doanh hiện đại.',
        options: [
          { label: 'A', text: 'to',   isCorrect: true  },
          { label: 'B', text: 'for',  isCorrect: false },
          { label: 'C', text: 'with', isCorrect: false },
          { label: 'D', text: 'at',   isCorrect: false },
        ],
      },
      {
        order: 9, grammarTopic: 'word_form',
        questionText:
          '[EMAIL – Passage B, Q9]\n' +
          'We value your ___ and are committed to resolving this matter promptly. (PATIENT)',
        explanation: '"Patience" (sự kiên nhẫn) — danh từ làm tân ngữ của "value". "We value your patience" là câu thông dụng trong thư xin lỗi khách hàng TOEIC.',
        options: [
          { label: 'A', text: 'patience',   isCorrect: true  },
          { label: 'B', text: 'patient',    isCorrect: false },
          { label: 'C', text: 'patiently',  isCorrect: false },
          { label: 'D', text: 'impatience', isCorrect: false },
        ],
      },
      {
        order: 10, grammarTopic: 'verb_tense',
        questionText:
          '[EMAIL – Passage B, Q10]\n' +
          'We hope to ___ your trust and look forward to serving you again in the future.',
        explanation: '"Regain" (lấy lại) — thì nguyên thể sau "hope to". "Hope to regain your trust" = mong lấy lại lòng tin — công thức kết thúc thư xin lỗi.',
        options: [
          { label: 'A', text: 'regain',   isCorrect: true  },
          { label: 'B', text: 'retain',   isCorrect: false },
          { label: 'C', text: 'maintain', isCorrect: false },
          { label: 'D', text: 'obtain',   isCorrect: false },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════
  // EXAM 8 — PART 6 | VIP | Difficulty 3
  // ══════════════════════════════════════════════════════
  {
    title: 'TOEIC Part 6 - Text Completion #3',
    part: 'PART6', type: 'VIP', difficulty: 'HARD',
    questions: [
      // ── Passage A: Press Release ──────────────────────
      {
        order: 1, grammarTopic: 'vocabulary',
        questionText:
          '[PRESS RELEASE – Passage A, Q1]\n' +
          'FOR IMMEDIATE RELEASE\n\n' +
          'Vertex Corporation is pleased to ___ the acquisition of BioSync Ltd., a leader in biotechnology.',
        explanation: '"Announce" (thông báo) — "announce an acquisition" là collocation chuẩn trong thông cáo báo chí. "Declare" thường dùng cho tuyên bố chính thức/pháp lý.',
        options: [
          { label: 'A', text: 'announce', isCorrect: true  },
          { label: 'B', text: 'declare',  isCorrect: false },
          { label: 'C', text: 'disclose', isCorrect: false },
          { label: 'D', text: 'release',  isCorrect: false },
        ],
      },
      {
        order: 2, grammarTopic: 'preposition',
        questionText:
          '[PRESS RELEASE – Passage A, Q2]\n' +
          'The deal, valued ___ $2.4 billion, is expected to close by the end of this fiscal year.',
        explanation: '"Valued at" (trị giá) — "valued at + số tiền" là cụm cố định trong tài chính. "A deal valued at $X" = thương vụ trị giá X.',
        options: [
          { label: 'A', text: 'at',   isCorrect: true  },
          { label: 'B', text: 'for',  isCorrect: false },
          { label: 'C', text: 'in',   isCorrect: false },
          { label: 'D', text: 'with', isCorrect: false },
        ],
      },
      {
        order: 3, grammarTopic: 'word_form',
        questionText:
          '[PRESS RELEASE – Passage A, Q3]\n' +
          'This strategic move will ___ enhance Vertex\'s position in the global healthcare market. (CONSIDER)',
        explanation: '"Considerably" (đáng kể) — trạng từ bổ nghĩa cho "enhance". "Considerably enhance = tăng cường đáng kể" — cụm phổ biến trong TOEIC formal texts.',
        options: [
          { label: 'A', text: 'considerably', isCorrect: true  },
          { label: 'B', text: 'considerable', isCorrect: false },
          { label: 'C', text: 'consideration',isCorrect: false },
          { label: 'D', text: 'consider',     isCorrect: false },
        ],
      },
      {
        order: 4, grammarTopic: 'conjunction',
        questionText:
          '[PRESS RELEASE – Passage A, Q4]\n' +
          'The transaction remains ___ to regulatory approval from relevant government authorities.',
        explanation: '"Subject to regulatory approval" (phụ thuộc vào sự chấp thuận của cơ quan quản lý) — cụm cố định bắt buộc trong thông cáo M&A.',
        options: [
          { label: 'A', text: 'subject',    isCorrect: true  },
          { label: 'B', text: 'open',       isCorrect: false },
          { label: 'C', text: 'dependent',  isCorrect: false },
          { label: 'D', text: 'conditional',isCorrect: false },
        ],
      },
      // ── Passage B: Meeting Minutes ────────────────────
      {
        order: 5, grammarTopic: 'verb_tense',
        questionText:
          '[MINUTES – Passage B, Q5]\n' +
          'MEETING MINUTES – Q3 Strategy Review\n\n' +
          'The chairperson ___ the meeting to order at 9:00 AM with 12 members in attendance.',
        explanation: '"Called" (quá khứ đơn) — biên bản họp luôn viết ở thì quá khứ. "Call the meeting to order" = tuyên bố khai mạc họp.',
        options: [
          { label: 'A', text: 'called',    isCorrect: true  },
          { label: 'B', text: 'has called',isCorrect: false },
          { label: 'C', text: 'calls',     isCorrect: false },
          { label: 'D', text: 'was calling',isCorrect: false },
        ],
      },
      {
        order: 6, grammarTopic: 'vocabulary',
        questionText:
          '[MINUTES – Passage B, Q6]\n' +
          'Ms. Chen ___ a detailed report on Q3 revenue performance, highlighting a 12% year-on-year growth.',
        explanation: '"Presented" — "present a report" là collocation chuẩn trong biên bản họp. Khác "submitted" (nộp lên cấp trên) hay "delivered" (ít trang trọng hơn trong ngữ cảnh này).',
        options: [
          { label: 'A', text: 'presented', isCorrect: true  },
          { label: 'B', text: 'submitted', isCorrect: false },
          { label: 'C', text: 'delivered', isCorrect: false },
          { label: 'D', text: 'showed',    isCorrect: false },
        ],
      },
      {
        order: 7, grammarTopic: 'conjunction',
        questionText:
          '[MINUTES – Passage B, Q7]\n' +
          '___ the strong revenue figures, the board expressed concern over rising operational costs.',
        explanation: '"Despite" (mặc dù) theo sau danh từ "the strong revenue figures". Sự tương phản: doanh thu tốt NHƯNG chi phí vẫn đáng lo ngại.',
        options: [
          { label: 'A', text: 'Despite',    isCorrect: true  },
          { label: 'B', text: 'Because of', isCorrect: false },
          { label: 'C', text: 'Given',      isCorrect: false },
          { label: 'D', text: 'Following',  isCorrect: false },
        ],
      },
      {
        order: 8, grammarTopic: 'word_form',
        questionText:
          '[MINUTES – Passage B, Q8]\n' +
          'The board reached a ___ decision to allocate an additional budget for digital marketing. (UNANIMOUS)',
        explanation: '"Unanimous" — tính từ bổ nghĩa cho "decision". "A unanimous decision" (quyết định nhất trí) là cụm phổ biến trong biên bản họp TOEIC.',
        options: [
          { label: 'A', text: 'unanimous',   isCorrect: true  },
          { label: 'B', text: 'unanimously', isCorrect: false },
          { label: 'C', text: 'unanimity',   isCorrect: false },
          { label: 'D', text: 'unanimous\'s',isCorrect: false },
        ],
      },
      {
        order: 9, grammarTopic: 'preposition',
        questionText:
          '[MINUTES – Passage B, Q9]\n' +
          'Action items were assigned to each department head, who must report back ___ the next scheduled meeting.',
        explanation: '"By the next meeting" (trước buổi họp tiếp theo) — "by" chỉ hạn chót. "At the next meeting" = tại buổi họp (không phải trước).',
        options: [
          { label: 'A', text: 'by',     isCorrect: true  },
          { label: 'B', text: 'at',     isCorrect: false },
          { label: 'C', text: 'before', isCorrect: false },
          { label: 'D', text: 'during', isCorrect: false },
        ],
      },
      {
        order: 10, grammarTopic: 'verb_tense',
        questionText:
          '[MINUTES – Passage B, Q10]\n' +
          'The meeting ___ at 11:30 AM after all agenda items had been addressed.',
        explanation: '"Was adjourned" — thì quá khứ bị động. "The meeting was adjourned" (cuộc họp được bế mạc) là cụm kết thúc biên bản họp chuẩn.',
        options: [
          { label: 'A', text: 'was adjourned',  isCorrect: true  },
          { label: 'B', text: 'adjourned',      isCorrect: false },
          { label: 'C', text: 'has adjourned',  isCorrect: false },
          { label: 'D', text: 'were adjourned', isCorrect: false },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════
  // EXAM 9 — PART 6 | VIP | Difficulty 3
  // ══════════════════════════════════════════════════════
  {
    title: 'TOEIC Part 6 - Text Completion #4',
    part: 'PART6', type: 'VIP', difficulty: 'HARD',
    questions: [
      // ── Passage A: Annual Report Excerpt ─────────────
      {
        order: 1, grammarTopic: 'vocabulary',
        questionText:
          '[ANNUAL REPORT – Passage A, Q1]\n' +
          'Fiscal Year 2024 saw remarkable growth ___ all business segments, with total revenue reaching $4.2 billion.',
        explanation: '"Across" (trên toàn bộ) — "across all segments" = trên tất cả các phân khúc. Phân biệt: "in" (trong một), "throughout" (xuyên suốt).',
        options: [
          { label: 'A', text: 'across',     isCorrect: true  },
          { label: 'B', text: 'throughout', isCorrect: false },
          { label: 'C', text: 'among',      isCorrect: false },
          { label: 'D', text: 'between',    isCorrect: false },
        ],
      },
      {
        order: 2, grammarTopic: 'word_form',
        questionText:
          '[ANNUAL REPORT – Passage A, Q2]\n' +
          'This ___ performance is a testament to our team\'s dedication and strategic focus. (EXCEPTION)',
        explanation: '"Exceptional" — tính từ bổ nghĩa cho "performance". "Exceptional performance" (hiệu suất xuất sắc) là cụm phổ biến trong báo cáo thường niên.',
        options: [
          { label: 'A', text: 'exceptional',   isCorrect: true  },
          { label: 'B', text: 'exception',     isCorrect: false },
          { label: 'C', text: 'exceptionally', isCorrect: false },
          { label: 'D', text: 'excepted',      isCorrect: false },
        ],
      },
      {
        order: 3, grammarTopic: 'conjunction',
        questionText:
          '[ANNUAL REPORT – Passage A, Q3]\n' +
          'Operating expenses were carefully managed, ___ the company was able to maintain a healthy profit margin.',
        explanation: '"Allowing" (cho phép / tạo điều kiện) — participle clause. "Carefully managed, allowing the company to..." = quản lý tốt → nhờ đó công ty có thể duy trì biên lợi nhuận tốt.',
        options: [
          { label: 'A', text: 'allowing',   isCorrect: true  },
          { label: 'B', text: 'therefore',  isCorrect: false },
          { label: 'C', text: 'so that',    isCorrect: false },
          { label: 'D', text: 'which',      isCorrect: false },
        ],
      },
      {
        order: 4, grammarTopic: 'preposition',
        questionText:
          '[ANNUAL REPORT – Passage A, Q4]\n' +
          'Looking ___ to the coming fiscal year, management remains cautiously optimistic about continued growth.',
        explanation: '"Looking ahead to" (hướng tới / nhìn về phía trước) — phrasal verb cố định. "Look ahead to the future/next year" là cụm kết thúc báo cáo thường niên.',
        options: [
          { label: 'A', text: 'ahead',    isCorrect: true  },
          { label: 'B', text: 'forward',  isCorrect: false },
          { label: 'C', text: 'into',     isCorrect: false },
          { label: 'D', text: 'through',  isCorrect: false },
        ],
      },
      // ── Passage B: Notice to Tenants ─────────────────
      {
        order: 5, grammarTopic: 'verb_tense',
        questionText:
          '[NOTICE – Passage B, Q5]\n' +
          'This notice is to inform all tenants that essential maintenance work ___ in the lobby area from Monday to Wednesday next week.',
        explanation: '"Will be carried out" — tương lai bị động cho công việc được lên kế hoạch. "Carry out maintenance" = tiến hành bảo trì.',
        options: [
          { label: 'A', text: 'will be carried out', isCorrect: true  },
          { label: 'B', text: 'is carried out',      isCorrect: false },
          { label: 'C', text: 'was carried out',     isCorrect: false },
          { label: 'D', text: 'carries out',         isCorrect: false },
        ],
      },
      {
        order: 6, grammarTopic: 'vocabulary',
        questionText:
          '[NOTICE – Passage B, Q6]\n' +
          'During this period, access to the main entrance may be temporarily ___.',
        explanation: '"Restricted" (bị hạn chế) — "access may be restricted" là cụm thông dụng trong thông báo bảo trì. Phân biệt: "limited" (hạn chế số lượng), "blocked" (chặn hoàn toàn).',
        options: [
          { label: 'A', text: 'restricted', isCorrect: true  },
          { label: 'B', text: 'limited',    isCorrect: false },
          { label: 'C', text: 'blocked',    isCorrect: false },
          { label: 'D', text: 'reduced',    isCorrect: false },
        ],
      },
      {
        order: 7, grammarTopic: 'conjunction',
        questionText:
          '[NOTICE – Passage B, Q7]\n' +
          'Tenants are advised to use the side entrance ___ the maintenance work is in progress.',
        explanation: '"While" (trong khi) — chỉ sự đồng thời xảy ra. "While the work is in progress" = trong thời gian công việc đang được tiến hành.',
        options: [
          { label: 'A', text: 'while',    isCorrect: true  },
          { label: 'B', text: 'until',    isCorrect: false },
          { label: 'C', text: 'although', isCorrect: false },
          { label: 'D', text: 'before',   isCorrect: false },
        ],
      },
      {
        order: 8, grammarTopic: 'word_form',
        questionText:
          '[NOTICE – Passage B, Q8]\n' +
          'We apologize for any ___ this may cause and appreciate your cooperation. (CONVENIENT)',
        explanation: '"Inconvenience" (sự bất tiện) — danh từ làm tân ngữ. "Apologize for any inconvenience" là câu mẫu kết thúc thông báo bảo trì trong TOEIC.',
        options: [
          { label: 'A', text: 'inconvenience',   isCorrect: true  },
          { label: 'B', text: 'inconvenient',    isCorrect: false },
          { label: 'C', text: 'inconveniently',  isCorrect: false },
          { label: 'D', text: 'convenience',     isCorrect: false },
        ],
      },
      {
        order: 9, grammarTopic: 'preposition',
        questionText:
          '[NOTICE – Passage B, Q9]\n' +
          'For more details, please contact the building management office ___ extension 205.',
        explanation: '"At extension 205" — "contact someone at extension X" là cụm cố định trong thông báo nội bộ. Khác "on extension" (British English).',
        options: [
          { label: 'A', text: 'at',   isCorrect: true  },
          { label: 'B', text: 'on',   isCorrect: false },
          { label: 'C', text: 'by',   isCorrect: false },
          { label: 'D', text: 'with', isCorrect: false },
        ],
      },
      {
        order: 10, grammarTopic: 'verb_tense',
        questionText:
          '[NOTICE – Passage B, Q10]\n' +
          'Normal access ___ once all work has been completed and the area has been inspected.',
        explanation: '"Will be restored" — tương lai bị động. "Normal access will be restored" (việc đi lại bình thường sẽ được khôi phục) = cụm kết thúc thông báo bảo trì.',
        options: [
          { label: 'A', text: 'will be restored', isCorrect: true  },
          { label: 'B', text: 'is restored',      isCorrect: false },
          { label: 'C', text: 'restores',         isCorrect: false },
          { label: 'D', text: 'was restored',     isCorrect: false },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════
  // EXAM 10 — PART 7 | FREE | Difficulty 1
  // Single Passage: Email
  // ══════════════════════════════════════════════════════
  {
    title: 'TOEIC Part 7 - Reading Comprehension #1',
    part: 'PART7', type: 'FREE', difficulty: 'EASY',
    questions: [
      // Passage embedded in Q1 for reference — subsequent Qs reference same passage
      {
        order: 1, grammarTopic: 'vocabulary',
        questionText:
          '[READ THE EMAIL BELOW, THEN ANSWER Q1–5]\n\n' +
          'From: hr@globaltech.com\n' +
          'To: all_staff@globaltech.com\n' +
          'Subject: Mandatory IT Security Training\n\n' +
          'Dear All,\n\n' +
          'As part of our commitment to data protection, all employees are required to complete the mandatory IT Security Training by November 15. The training is available on the Learning Portal under the "Compliance" tab.\n\n' +
          'The course takes approximately 90 minutes to complete. Upon completion, you will receive a digital certificate which must be submitted to your line manager for verification.\n\n' +
          'Employees who do not complete the training by the deadline will be required to attend an in-person session on November 22. Please note that attendance at this session is not optional.\n\n' +
          'Should you experience any technical difficulties accessing the portal, please contact the IT helpdesk at helpdesk@globaltech.com.\n\n' +
          'Best regards,\nHuman Resources Department\n\n' +
          '──────────────────────────────────\n' +
          'Q1: What is the primary purpose of this email?',
        explanation: 'Câu mở đầu nêu rõ: "all employees are required to complete the mandatory IT Security Training" — thông báo về đào tạo bắt buộc.',
        options: [
          { label: 'A', text: 'To notify staff of a required training program',           isCorrect: true  },
          { label: 'B', text: 'To introduce a new data protection software',              isCorrect: false },
          { label: 'C', text: 'To announce changes to the company\'s IT department',      isCorrect: false },
          { label: 'D', text: 'To remind employees about their annual performance review',isCorrect: false },
        ],
      },
      {
        order: 2, grammarTopic: 'vocabulary',
        questionText: 'Q2: Where can employees access the training?',
        explanation: 'Email nêu rõ: "available on the Learning Portal under the \'Compliance\' tab".',
        options: [
          { label: 'A', text: 'The Learning Portal',          isCorrect: true  },
          { label: 'B', text: 'The IT helpdesk',              isCorrect: false },
          { label: 'C', text: 'The HR office',                isCorrect: false },
          { label: 'D', text: 'The company intranet homepage', isCorrect: false },
        ],
      },
      {
        order: 3, grammarTopic: 'vocabulary',
        questionText: 'Q3: What must employees do after completing the training?',
        explanation: '"You will receive a digital certificate which must be submitted to your line manager for verification." = nộp chứng chỉ cho quản lý trực tiếp.',
        options: [
          { label: 'A', text: 'Submit a digital certificate to their line manager',    isCorrect: true  },
          { label: 'B', text: 'Email the HR department with their completion status',  isCorrect: false },
          { label: 'C', text: 'Register for the in-person session on November 22',    isCorrect: false },
          { label: 'D', text: 'Print and file the certificate in the HR department',  isCorrect: false },
        ],
      },
      {
        order: 4, grammarTopic: 'vocabulary',
        questionText: 'Q4: What happens if an employee misses the November 15 deadline?',
        explanation: '"Employees who do not complete the training by the deadline will be required to attend an in-person session on November 22."',
        options: [
          { label: 'A', text: 'They must attend an in-person session on November 22',  isCorrect: true  },
          { label: 'B', text: 'They will receive a formal written warning',            isCorrect: false },
          { label: 'C', text: 'They will lose access to the Learning Portal',          isCorrect: false },
          { label: 'D', text: 'They must complete extra compliance paperwork',         isCorrect: false },
        ],
      },
      {
        order: 5, grammarTopic: 'vocabulary',
        questionText: 'Q5: Who should employees contact if they cannot access the portal?',
        explanation: '"Should you experience any technical difficulties accessing the portal, please contact the IT helpdesk at helpdesk@globaltech.com."',
        options: [
          { label: 'A', text: 'The IT helpdesk',               isCorrect: true  },
          { label: 'B', text: 'Their line manager',             isCorrect: false },
          { label: 'C', text: 'The HR department',             isCorrect: false },
          { label: 'D', text: 'The Learning Portal administrator',isCorrect: false },
        ],
      },
      {
        order: 6, grammarTopic: 'vocabulary',
        questionText: 'Q6: Which word in the email is closest in meaning to "obligatory"?',
        explanation: '"Mandatory" = obligatory (bắt buộc). Câu "mandatory IT Security Training" = đào tạo bắt buộc.',
        options: [
          { label: 'A', text: 'mandatory',   isCorrect: true  },
          { label: 'B', text: 'optional',    isCorrect: false },
          { label: 'C', text: 'digital',     isCorrect: false },
          { label: 'D', text: 'approximate', isCorrect: false },
        ],
      },
      {
        order: 7, grammarTopic: 'vocabulary',
        questionText: 'Q7: How long does the training course take?',
        explanation: '"The course takes approximately 90 minutes to complete."',
        options: [
          { label: 'A', text: 'Approximately 90 minutes', isCorrect: true  },
          { label: 'B', text: 'One full working day',     isCorrect: false },
          { label: 'C', text: '30 minutes',               isCorrect: false },
          { label: 'D', text: 'Two hours',                isCorrect: false },
        ],
      },
      {
        order: 8, grammarTopic: 'vocabulary',
        questionText: 'Q8: What is stated about the in-person session on November 22?',
        explanation: '"Please note that attendance at this session is not optional." = tham dự là bắt buộc, không phải tùy chọn.',
        options: [
          { label: 'A', text: 'Attendance is compulsory',             isCorrect: true  },
          { label: 'B', text: 'It will be held at the main office',   isCorrect: false },
          { label: 'C', text: 'It replaces the online training',      isCorrect: false },
          { label: 'D', text: 'It is limited to 20 participants',     isCorrect: false },
        ],
      },
      {
        order: 9, grammarTopic: 'vocabulary',
        questionText: 'Q9: The phrase "commitment to data protection" in the email suggests that the company___.',
        explanation: '"As part of our commitment to data protection" — cho thấy công ty ưu tiên bảo mật thông tin và coi đây là giá trị cốt lõi.',
        options: [
          { label: 'A', text: 'Prioritizes the security of information',          isCorrect: true  },
          { label: 'B', text: 'Has recently experienced a data breach',           isCorrect: false },
          { label: 'C', text: 'Is required by law to train all employees',        isCorrect: false },
          { label: 'D', text: 'Is introducing new data management software',      isCorrect: false },
        ],
      },
      {
        order: 10, grammarTopic: 'vocabulary',
        questionText: 'Q10: Who sent this email?',
        explanation: 'Cuối email ghi "Best regards, Human Resources Department" và from "hr@globaltech.com".',
        options: [
          { label: 'A', text: 'The Human Resources Department',isCorrect: true  },
          { label: 'B', text: 'The IT Security team',          isCorrect: false },
          { label: 'C', text: 'The company CEO',               isCorrect: false },
          { label: 'D', text: 'The Learning Portal admin',     isCorrect: false },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════
  // EXAM 11 — PART 7 | FREE | Difficulty 2
  // Single Passage: Advertisement / Job Posting
  // ══════════════════════════════════════════════════════
  {
    title: 'TOEIC Part 7 - Reading Comprehension #2',
    part: 'PART7', type: 'FREE', difficulty: 'MEDIUM',
    questions: [
      {
        order: 1, grammarTopic: 'vocabulary',
        questionText:
          '[READ THE JOB POSTING BELOW, THEN ANSWER Q1–5]\n\n' +
          'CAREER OPPORTUNITY – MARKETING MANAGER\n' +
          'Horizon Media Group | Singapore\n\n' +
          'Horizon Media Group, one of Asia\'s fastest-growing digital marketing agencies, is seeking a dynamic and results-driven Marketing Manager to join our Singapore office.\n\n' +
          'KEY RESPONSIBILITIES:\n' +
          '• Develop and execute integrated marketing campaigns across digital platforms\n' +
          '• Lead a team of 8 marketing specialists and coordinate with external agencies\n' +
          '• Analyze campaign performance data and present monthly reports to senior management\n' +
          '• Manage an annual marketing budget of SGD 500,000\n\n' +
          'REQUIREMENTS:\n' +
          '• Bachelor\'s degree in Marketing, Business, or a related field\n' +
          '• Minimum 5 years of experience in digital marketing, with at least 2 years in a managerial role\n' +
          '• Proficiency in Google Analytics, HubSpot, and major social media platforms\n' +
          '• Strong written and verbal communication skills in English\n\n' +
          'BENEFITS:\n' +
          '• Competitive salary commensurate with experience\n' +
          '• Annual performance bonus and health insurance\n' +
          '• Opportunities for regional travel and career advancement\n\n' +
          'To apply, send your CV and a cover letter to careers@horizonmedia.sg by October 31.\n\n' +
          '──────────────────────────────────\n' +
          'Q1: What type of company is Horizon Media Group?',
        explanation: '"One of Asia\'s fastest-growing digital marketing agencies" — đây là công ty chuyên về marketing kỹ thuật số.',
        options: [
          { label: 'A', text: 'A digital marketing agency',   isCorrect: true  },
          { label: 'B', text: 'A financial consulting firm',  isCorrect: false },
          { label: 'C', text: 'A software development company',isCorrect: false },
          { label: 'D', text: 'A media production studio',   isCorrect: false },
        ],
      },
      {
        order: 2, grammarTopic: 'vocabulary',
        questionText: 'Q2: How many people will the Marketing Manager oversee?',
        explanation: '"Lead a team of 8 marketing specialists" — quản lý 8 chuyên viên marketing.',
        options: [
          { label: 'A', text: '8',  isCorrect: true  },
          { label: 'B', text: '5',  isCorrect: false },
          { label: 'C', text: '10', isCorrect: false },
          { label: 'D', text: '12', isCorrect: false },
        ],
      },
      {
        order: 3, grammarTopic: 'vocabulary',
        questionText: 'Q3: What is the minimum required experience for this position?',
        explanation: '"Minimum 5 years of experience in digital marketing, with at least 2 years in a managerial role."',
        options: [
          { label: 'A', text: '5 years in digital marketing, including 2 in management', isCorrect: true  },
          { label: 'B', text: '3 years in a managerial role',                           isCorrect: false },
          { label: 'C', text: '2 years in digital marketing',                           isCorrect: false },
          { label: 'D', text: '7 years of total work experience',                       isCorrect: false },
        ],
      },
      {
        order: 4, grammarTopic: 'vocabulary',
        questionText: 'Q4: What does "commensurate with experience" mean in the context of this job posting?',
        explanation: '"Commensurate with experience" = tương xứng với kinh nghiệm. Mức lương sẽ phụ thuộc vào kinh nghiệm của ứng viên.',
        options: [
          { label: 'A', text: 'Proportional to the candidate\'s level of experience', isCorrect: true  },
          { label: 'B', text: 'Fixed regardless of background',                       isCorrect: false },
          { label: 'C', text: 'Based solely on academic qualifications',              isCorrect: false },
          { label: 'D', text: 'Determined after a probationary period',               isCorrect: false },
        ],
      },
      {
        order: 5, grammarTopic: 'vocabulary',
        questionText: 'Q5: What should applicants submit along with their CV?',
        explanation: '"Send your CV and a cover letter to careers@horizonmedia.sg" — ứng viên cần nộp CV kèm thư xin việc.',
        options: [
          { label: 'A', text: 'A CV and a cover letter',          isCorrect: true  },
          { label: 'B', text: 'A CV and a portfolio',             isCorrect: false },
          { label: 'C', text: 'A CV and two reference letters',   isCorrect: false },
          { label: 'D', text: 'A CV and a completed application form',isCorrect: false },
        ],
      },
      {
        order: 6, grammarTopic: 'vocabulary',
        questionText: 'Q6: Which of the following is NOT listed as a requirement?',
        explanation: 'Các yêu cầu bao gồm: bằng cấp, kinh nghiệm, kỹ năng phần mềm, tiếng Anh. Không đề cập đến khả năng nói tiếng Mandarin.',
        options: [
          { label: 'A', text: 'Proficiency in Mandarin',         isCorrect: true  },
          { label: 'B', text: 'A bachelor\'s degree',            isCorrect: false },
          { label: 'C', text: 'Experience with Google Analytics',isCorrect: false },
          { label: 'D', text: 'Strong communication skills',     isCorrect: false },
        ],
      },
      {
        order: 7, grammarTopic: 'vocabulary',
        questionText: 'Q7: What benefit relates to career growth?',
        explanation: '"Opportunities for regional travel and career advancement" — cơ hội thăng tiến nghề nghiệp được liệt kê trong phần Benefits.',
        options: [
          { label: 'A', text: 'Career advancement opportunities', isCorrect: true  },
          { label: 'B', text: 'Annual performance bonus',         isCorrect: false },
          { label: 'C', text: 'Health insurance',                 isCorrect: false },
          { label: 'D', text: 'Flexible working hours',           isCorrect: false },
        ],
      },
      {
        order: 8, grammarTopic: 'vocabulary',
        questionText: 'Q8: When is the application deadline?',
        explanation: '"To apply... by October 31." — hạn chót nộp hồ sơ là ngày 31 tháng 10.',
        options: [
          { label: 'A', text: 'October 31',  isCorrect: true  },
          { label: 'B', text: 'November 15', isCorrect: false },
          { label: 'C', text: 'October 15',  isCorrect: false },
          { label: 'D', text: 'November 30', isCorrect: false },
        ],
      },
      {
        order: 9, grammarTopic: 'vocabulary',
        questionText: 'Q9: The word "dynamic" in the posting most likely means ___.',
        explanation: '"Dynamic" (năng động, có nhiều năng lượng và sáng kiến) — được dùng để mô tả ứng viên lý tưởng trong các tin tuyển dụng.',
        options: [
          { label: 'A', text: 'Energetic and driven',     isCorrect: true  },
          { label: 'B', text: 'Calm and methodical',      isCorrect: false },
          { label: 'C', text: 'Creative and introverted', isCorrect: false },
          { label: 'D', text: 'Experienced and cautious', isCorrect: false },
        ],
      },
      {
        order: 10, grammarTopic: 'vocabulary',
        questionText: 'Q10: Where is the position located?',
        explanation: '"Horizon Media Group | Singapore" — vị trí này đặt tại Singapore.',
        options: [
          { label: 'A', text: 'Singapore',     isCorrect: true  },
          { label: 'B', text: 'Hong Kong',     isCorrect: false },
          { label: 'C', text: 'Kuala Lumpur',  isCorrect: false },
          { label: 'D', text: 'Jakarta',       isCorrect: false },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════
  // EXAM 12 — PART 7 | FREE | Difficulty 2
  // Double Passage: Email + Reply
  // ══════════════════════════════════════════════════════
  {
    title: 'TOEIC Part 7 - Reading Comprehension #3',
    part: 'PART7', type: 'FREE', difficulty: 'MEDIUM',
    questions: [
      {
        order: 1, grammarTopic: 'vocabulary',
        questionText:
          '[READ THE TWO EMAILS BELOW, THEN ANSWER Q1–5]\n\n' +
          '── EMAIL 1 ──\n' +
          'From: sarah.kim@primelogistics.com\n' +
          'To: support@officesupplies-pro.com\n' +
          'Subject: Order #OP-4892 – Delayed Shipment\n\n' +
          'To Whom It May Concern,\n\n' +
          'I placed an order (#OP-4892) for 200 boxes of A4 paper and 50 printer cartridges on September 5. According to your website, delivery was estimated within 3–5 business days. Today is September 13, and I have yet to receive the items or any shipping notification.\n\n' +
          'This delay is causing significant disruption to our operations, as we are running critically low on supplies. I would appreciate an urgent update on the status of my order and an estimated delivery date.\n\n' +
          'Please treat this matter with the utmost urgency.\n\n' +
          'Regards,\nSarah Kim\nProcurement Officer, Prime Logistics\n\n' +
          '── EMAIL 2 (REPLY) ──\n' +
          'From: support@officesupplies-pro.com\n' +
          'To: sarah.kim@primelogistics.com\n' +
          'Subject: RE: Order #OP-4892 – Delayed Shipment\n\n' +
          'Dear Ms. Kim,\n\n' +
          'Thank you for bringing this to our attention. We sincerely apologize for the delay with your order #OP-4892. Upon investigation, we found that the delay was caused by an unexpected inventory shortage at our central warehouse.\n\n' +
          'We are pleased to inform you that your order has now been fully processed and dispatched. You should receive your items no later than September 15. A tracking number has been sent to your registered email address.\n\n' +
          'As a gesture of goodwill, we would like to offer you a 10% discount on your next order. Please use promo code PRIORITY10 at checkout.\n\n' +
          'We value your continued business and regret any inconvenience caused.\n\n' +
          'Best regards,\nCustomer Support Team\nOfficeSupplie-Pro\n\n' +
          '──────────────────────────────────\n' +
          'Q1: Why did Ms. Kim write the first email?',
        explanation: 'Ms. Kim viết email vì đơn hàng đặt ngày 5/9 chưa được giao sau 8 ngày, vượt quá thời gian ước tính 3-5 ngày làm việc.',
        options: [
          { label: 'A', text: 'To complain about a delayed order',               isCorrect: true  },
          { label: 'B', text: 'To cancel her existing order',                    isCorrect: false },
          { label: 'C', text: 'To request a refund for damaged goods',           isCorrect: false },
          { label: 'D', text: 'To inquire about product availability',           isCorrect: false },
        ],
      },
      {
        order: 2, grammarTopic: 'vocabulary',
        questionText: 'Q2: What did Ms. Kim originally order?',
        explanation: '"200 boxes of A4 paper and 50 printer cartridges" — đây là nội dung đơn hàng #OP-4892.',
        options: [
          { label: 'A', text: '200 boxes of A4 paper and 50 printer cartridges', isCorrect: true  },
          { label: 'B', text: '50 boxes of A4 paper and 200 printer cartridges', isCorrect: false },
          { label: 'C', text: '200 printer cartridges and office furniture',     isCorrect: false },
          { label: 'D', text: 'Toner cartridges and filing cabinets',            isCorrect: false },
        ],
      },
      {
        order: 3, grammarTopic: 'vocabulary',
        questionText: 'Q3: According to the reply, what caused the delay?',
        explanation: '"The delay was caused by an unexpected inventory shortage at our central warehouse." — nguyên nhân là thiếu hàng đột xuất tại kho trung tâm.',
        options: [
          { label: 'A', text: 'An unexpected inventory shortage at the warehouse', isCorrect: true  },
          { label: 'B', text: 'A system error in order processing',                isCorrect: false },
          { label: 'C', text: 'A courier company strike',                          isCorrect: false },
          { label: 'D', text: 'Incorrect delivery address on the order',           isCorrect: false },
        ],
      },
      {
        order: 4, grammarTopic: 'vocabulary',
        questionText: 'Q4: When is Ms. Kim expected to receive her order?',
        explanation: '"You should receive your items no later than September 15."',
        options: [
          { label: 'A', text: 'By September 15',  isCorrect: true  },
          { label: 'B', text: 'By September 13',  isCorrect: false },
          { label: 'C', text: 'By September 10',  isCorrect: false },
          { label: 'D', text: 'By September 20',  isCorrect: false },
        ],
      },
      {
        order: 5, grammarTopic: 'vocabulary',
        questionText: 'Q5: What is offered to Ms. Kim as compensation?',
        explanation: '"We would like to offer you a 10% discount on your next order. Please use promo code PRIORITY10." — giảm 10% cho đơn hàng tiếp theo.',
        options: [
          { label: 'A', text: 'A 10% discount on her next purchase',       isCorrect: true  },
          { label: 'B', text: 'A full refund of the delayed order',        isCorrect: false },
          { label: 'C', text: 'Free expedited shipping on future orders',  isCorrect: false },
          { label: 'D', text: 'A complimentary box of printer cartridges', isCorrect: false },
        ],
      },
      {
        order: 6, grammarTopic: 'vocabulary',
        questionText: 'Q6: What does "as a gesture of goodwill" mean in the reply?',
        explanation: '"A gesture of goodwill" = hành động thiện chí, được đưa ra không phải vì nghĩa vụ mà để thể hiện sự quan tâm và mong muốn hàn gắn quan hệ.',
        options: [
          { label: 'A', text: 'As a voluntary act to show good intentions',      isCorrect: true  },
          { label: 'B', text: 'As required by the company\'s return policy',     isCorrect: false },
          { label: 'C', text: 'As compensation for financial losses',            isCorrect: false },
          { label: 'D', text: 'As part of a standard promotional campaign',      isCorrect: false },
        ],
      },
      {
        order: 7, grammarTopic: 'vocabulary',
        questionText: 'Q7: What information was sent to Ms. Kim\'s email after the order was dispatched?',
        explanation: '"A tracking number has been sent to your registered email address." — số theo dõi đơn hàng đã được gửi.',
        options: [
          { label: 'A', text: 'A tracking number',          isCorrect: true  },
          { label: 'B', text: 'A revised invoice',          isCorrect: false },
          { label: 'C', text: 'The promo code PRIORITY10',  isCorrect: false },
          { label: 'D', text: 'A delivery confirmation form',isCorrect: false },
        ],
      },
      {
        order: 8, grammarTopic: 'vocabulary',
        questionText: 'Q8: How many business days after placing the order did Ms. Kim send her complaint email? (September 5 to September 13)',
        explanation: 'Ngày đặt hàng: 5/9. Ngày gửi email: 13/9. Theo thông tin trong email: "delivery was estimated within 3–5 business days" nhưng đã qua 8 ngày.',
        options: [
          { label: 'A', text: '8 days after placing the order', isCorrect: true  },
          { label: 'B', text: '3 days after the estimated delivery',isCorrect: false },
          { label: 'C', text: '5 days after placing the order',  isCorrect: false },
          { label: 'D', text: '10 days after placing the order', isCorrect: false },
        ],
      },
      {
        order: 9, grammarTopic: 'vocabulary',
        questionText: 'Q9: What does Ms. Kim\'s job title tell us about her role?',
        explanation: '"Procurement Officer, Prime Logistics" — Procurement Officer = người chịu trách nhiệm mua hàng/vật tư cho công ty.',
        options: [
          { label: 'A', text: 'She is responsible for purchasing supplies for her company', isCorrect: true  },
          { label: 'B', text: 'She manages customer support at Prime Logistics',           isCorrect: false },
          { label: 'C', text: 'She oversees financial reporting at Prime Logistics',       isCorrect: false },
          { label: 'D', text: 'She handles shipping and delivery logistics',               isCorrect: false },
        ],
      },
      {
        order: 10, grammarTopic: 'vocabulary',
        questionText: 'Q10: Which phrase from Email 1 conveys the urgency of Ms. Kim\'s situation?',
        explanation: '"Please treat this matter with the utmost urgency." — đây là cụm thể hiện sự khẩn cấp rõ ràng nhất trong email.',
        options: [
          { label: 'A', text: '"treat this matter with the utmost urgency"',    isCorrect: true  },
          { label: 'B', text: '"I placed an order"',                            isCorrect: false },
          { label: 'C', text: '"I would appreciate an urgent update"',          isCorrect: false },
          { label: 'D', text: '"causing significant disruption to our operations"',isCorrect: false },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════
  // EXAM 13 — PART 7 | VIP | Difficulty 3
  // Single Passage: Notice / Announcement
  // ══════════════════════════════════════════════════════
  {
    title: 'TOEIC Part 7 - Reading Comprehension #4',
    part: 'PART7', type: 'VIP', difficulty: 'HARD',
    questions: [
      {
        order: 1, grammarTopic: 'vocabulary',
        questionText:
          '[READ THE NOTICE BELOW, THEN ANSWER Q1–5]\n\n' +
          'NOTICE TO ALL TENANTS AND VISITORS\n' +
          'Meridian Tower – Building Management\n\n' +
          'We wish to inform all tenants and visitors that the annual fire safety inspection and mandatory fire drill will take place on Thursday, October 24, from 10:00 AM to 12:00 PM.\n\n' +
          'IMPORTANT PROCEDURES:\n' +
          '1. All occupants must evacuate the building immediately when the alarm is activated. Do not use the elevators.\n' +
          '2. All floors must be cleared within 3 minutes of the alarm sounding.\n' +
          '3. Assemble at the designated muster point on Level B1 of the car park.\n' +
          '4. Floor wardens on each level are responsible for conducting a headcount and reporting to the Fire Safety Officer.\n' +
          '5. Re-entry to the building will only be permitted once the all-clear signal has been given by the Fire Safety Officer.\n\n' +
          'Please note that the drill is a statutory requirement under the Fire Safety Act and participation is mandatory for all building occupants.\n\n' +
          'Tenants are requested to inform their staff and any visitors expected on that day accordingly.\n\n' +
          'For inquiries, contact the Building Management Office at ext. 1800 or bmo@meridiantower.com.\n\n' +
          '──────────────────────────────────\n' +
          'Q1: What is the purpose of this notice?',
        explanation: 'Mục đích: thông báo về đợt kiểm tra an toàn phòng cháy thường niên và diễn tập sơ tán bắt buộc.',
        options: [
          { label: 'A', text: 'To announce an upcoming fire drill and inspection',      isCorrect: true  },
          { label: 'B', text: 'To report the findings of a recent safety inspection',  isCorrect: false },
          { label: 'C', text: 'To introduce new fire safety equipment in the building',isCorrect: false },
          { label: 'D', text: 'To notify tenants of a building renovation project',    isCorrect: false },
        ],
      },
      {
        order: 2, grammarTopic: 'vocabulary',
        questionText: 'Q2: Where should occupants gather during the fire drill?',
        explanation: '"Assemble at the designated muster point on Level B1 of the car park." — điểm tập hợp ở Level B1 của bãi đỗ xe.',
        options: [
          { label: 'A', text: 'Level B1 of the car park',    isCorrect: true  },
          { label: 'B', text: 'The lobby on the ground floor',isCorrect: false },
          { label: 'C', text: 'The rooftop terrace',          isCorrect: false },
          { label: 'D', text: 'Outside the main entrance',    isCorrect: false },
        ],
      },
      {
        order: 3, grammarTopic: 'vocabulary',
        questionText: 'Q3: According to the notice, which of the following is PROHIBITED during an evacuation?',
        explanation: '"Do not use the elevators." — không được sử dụng thang máy khi sơ tán.',
        options: [
          { label: 'A', text: 'Using the elevators',               isCorrect: true  },
          { label: 'B', text: 'Using the stairways',               isCorrect: false },
          { label: 'C', text: 'Assembling at the muster point',    isCorrect: false },
          { label: 'D', text: 'Following the floor warden\'s instructions', isCorrect: false },
        ],
      },
      {
        order: 4, grammarTopic: 'vocabulary',
        questionText: 'Q4: What must floor wardens do during the drill?',
        explanation: '"Floor wardens... are responsible for conducting a headcount and reporting to the Fire Safety Officer." — điểm danh và báo cáo cho Sĩ quan An toàn Phòng cháy.',
        options: [
          { label: 'A', text: 'Conduct a headcount and report to the Fire Safety Officer', isCorrect: true  },
          { label: 'B', text: 'Operate the fire alarm system',                             isCorrect: false },
          { label: 'C', text: 'Guide visitors to the nearest exit only',                   isCorrect: false },
          { label: 'D', text: 'Contact the fire department directly',                      isCorrect: false },
        ],
      },
      {
        order: 5, grammarTopic: 'vocabulary',
        questionText: 'Q5: What does "statutory requirement" mean in this context?',
        explanation: '"Statutory requirement" = yêu cầu theo luật định (bắt buộc theo pháp luật). "Under the Fire Safety Act" xác nhận đây là quy định pháp lý.',
        options: [
          { label: 'A', text: 'A legally mandated obligation',      isCorrect: true  },
          { label: 'B', text: 'A voluntary best practice guideline',isCorrect: false },
          { label: 'C', text: 'An internal company policy',         isCorrect: false },
          { label: 'D', text: 'A recommendation by the building management', isCorrect: false },
        ],
      },
      {
        order: 6, grammarTopic: 'vocabulary',
        questionText: 'Q6: Within what time frame must all floors be cleared?',
        explanation: '"All floors must be cleared within 3 minutes of the alarm sounding." — phải sơ tán toàn bộ trong vòng 3 phút.',
        options: [
          { label: 'A', text: '3 minutes',  isCorrect: true  },
          { label: 'B', text: '5 minutes',  isCorrect: false },
          { label: 'C', text: '10 minutes', isCorrect: false },
          { label: 'D', text: '2 minutes',  isCorrect: false },
        ],
      },
      {
        order: 7, grammarTopic: 'vocabulary',
        questionText: 'Q7: Who gives permission for occupants to re-enter the building?',
        explanation: '"Re-entry to the building will only be permitted once the all-clear signal has been given by the Fire Safety Officer."',
        options: [
          { label: 'A', text: 'The Fire Safety Officer',       isCorrect: true  },
          { label: 'B', text: 'The Building Management Office',isCorrect: false },
          { label: 'C', text: 'The floor wardens',             isCorrect: false },
          { label: 'D', text: 'The fire department',           isCorrect: false },
        ],
      },
      {
        order: 8, grammarTopic: 'vocabulary',
        questionText: 'Q8: What are tenants asked to do before the drill date?',
        explanation: '"Tenants are requested to inform their staff and any visitors expected on that day accordingly." — thông báo cho nhân viên và khách.',
        options: [
          { label: 'A', text: 'Notify their staff and expected visitors',          isCorrect: true  },
          { label: 'B', text: 'Submit a list of employees to the management office',isCorrect: false },
          { label: 'C', text: 'Register their attendance online',                  isCorrect: false },
          { label: 'D', text: 'Reschedule any meetings on that day',               isCorrect: false },
        ],
      },
      {
        order: 9, grammarTopic: 'vocabulary',
        questionText: 'Q9: How can tenants contact the Building Management Office?',
        explanation: '"Contact the Building Management Office at ext. 1800 or bmo@meridiantower.com." — qua số nội bộ 1800 hoặc email.',
        options: [
          { label: 'A', text: 'By calling ext. 1800 or emailing bmo@meridiantower.com', isCorrect: true  },
          { label: 'B', text: 'By visiting the office in person only',                  isCorrect: false },
          { label: 'C', text: 'By submitting a written request form',                   isCorrect: false },
          { label: 'D', text: 'By calling the main reception number',                   isCorrect: false },
        ],
      },
      {
        order: 10, grammarTopic: 'vocabulary',
        questionText: 'Q10: The notice implies that non-participation in the drill ___.',
        explanation: '"Participation is mandatory for all building occupants" — không được vắng mặt. "Mandatory" = bắt buộc, do đó không tham gia là vi phạm quy định.',
        options: [
          { label: 'A', text: 'Is not permitted under the Fire Safety Act',      isCorrect: true  },
          { label: 'B', text: 'Will result in immediate eviction',               isCorrect: false },
          { label: 'C', text: 'Requires written permission from management',     isCorrect: false },
          { label: 'D', text: 'Is allowed with prior notice to the floor warden',isCorrect: false },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════
  // EXAM 14 — PART 7 | VIP | Difficulty 3
  // Triple Passage: Article + Chart info + Letter
  // ══════════════════════════════════════════════════════
  {
    title: 'TOEIC Part 7 - Reading Comprehension #5',
    part: 'PART7', type: 'VIP', difficulty: 'HARD',
    questions: [
      {
        order: 1, grammarTopic: 'vocabulary',
        questionText:
          '[READ ALL THREE PASSAGES BELOW, THEN ANSWER Q1–5]\n\n' +
          '── PASSAGE 1: NEWS ARTICLE ──\n' +
          'REMOTE WORK DRIVES DEMAND FOR FLEXIBLE OFFICE LEASES\n\n' +
          'The rise of hybrid working models has significantly altered commercial real estate dynamics. According to a report by CoreStrategy Consulting, demand for traditional long-term office leases has declined by 23% over the past three years, while flexible co-working space subscriptions have surged by 67%.\n\n' +
          'Industry experts attribute this shift to companies seeking greater agility in their real estate commitments. "Businesses are no longer willing to sign 10-year leases," said Dr. Helen Marsh of the Urban Property Institute. "They want scalable, short-term solutions."\n\n' +
          '── PASSAGE 2: TABLE ──\n' +
          'COWORKING SPACE USAGE BY SECTOR (Q2 2024)\n' +
          '┌─────────────────────┬───────────┬───────────────────┐\n' +
          '│ Sector              │ % Usage   │ YoY Change        │\n' +
          '├─────────────────────┼───────────┼───────────────────┤\n' +
          '│ Technology          │   38%     │ +12%              │\n' +
          '│ Finance             │   22%     │  +8%              │\n' +
          '│ Consulting          │   18%     │  +5%              │\n' +
          '│ Healthcare          │   11%     │  +3%              │\n' +
          '│ Other               │   11%     │  +2%              │\n' +
          '└─────────────────────┴───────────┴───────────────────┘\n\n' +
          '── PASSAGE 3: LETTER ──\n' +
          'From: Marcus Webb, FlexOffice Solutions\n' +
          'To: Patricia Lim, Head of Operations, Zenith Capital\n\n' +
          'Dear Ms. Lim,\n\n' +
          'Thank you for your interest in FlexOffice Solutions. Following our telephone conversation, I am pleased to confirm that we can accommodate Zenith Capital\'s requirement for 25 dedicated workstations in our downtown facility, effective from November 1.\n\n' +
          'Given Zenith Capital\'s profile in the finance sector, I believe our Premium Business membership would be the most suitable option. This includes 24/7 building access, 20 hours of meeting room credits per month, and priority IT support.\n\n' +
          'I have attached a detailed proposal for your review. I look forward to welcoming Zenith Capital to our community.\n\n' +
          'Kind regards,\nMarcus Webb | Business Development Manager | FlexOffice Solutions\n\n' +
          '──────────────────────────────────\n' +
          'Q1: What trend is described in the news article?',
        explanation: 'Bài báo mô tả xu hướng: "demand for traditional long-term office leases has declined... while flexible co-working space subscriptions have surged."',
        options: [
          { label: 'A', text: 'A decline in traditional leases and a rise in co-working spaces',    isCorrect: true  },
          { label: 'B', text: 'A decrease in the overall demand for office space globally',         isCorrect: false },
          { label: 'C', text: 'An increase in companies building their own office facilities',      isCorrect: false },
          { label: 'D', text: 'A shift from remote work back to full-time office attendance',       isCorrect: false },
        ],
      },
      {
        order: 2, grammarTopic: 'vocabulary',
        questionText: 'Q2: According to the table, which sector has the highest co-working space usage in Q2 2024?',
        explanation: 'Bảng cho thấy "Technology" chiếm 38% — tỷ lệ cao nhất trong tất cả các lĩnh vực.',
        options: [
          { label: 'A', text: 'Technology',  isCorrect: true  },
          { label: 'B', text: 'Finance',     isCorrect: false },
          { label: 'C', text: 'Consulting',  isCorrect: false },
          { label: 'D', text: 'Healthcare',  isCorrect: false },
        ],
      },
      {
        order: 3, grammarTopic: 'vocabulary',
        questionText: 'Q3: Based on the table, in which sector does Zenith Capital operate?',
        explanation: 'Thư (Passage 3) nêu "Zenith Capital\'s profile in the finance sector". Theo bảng, Finance có mức tăng trưởng +8% YoY.',
        options: [
          { label: 'A', text: 'Finance',     isCorrect: true  },
          { label: 'B', text: 'Technology',  isCorrect: false },
          { label: 'C', text: 'Consulting',  isCorrect: false },
          { label: 'D', text: 'Healthcare',  isCorrect: false },
        ],
      },
      {
        order: 4, grammarTopic: 'vocabulary',
        questionText: 'Q4: What does the Premium Business membership at FlexOffice include?',
        explanation: '"24/7 building access, 20 hours of meeting room credits per month, and priority IT support" — đây là ba đặc quyền của gói Premium Business.',
        options: [
          { label: 'A', text: '24/7 access, 20 hours of meeting room credits, and priority IT support', isCorrect: true  },
          { label: 'B', text: 'Unlimited meeting room usage and free parking',                          isCorrect: false },
          { label: 'C', text: 'Dedicated IT staff and 10 hours of meeting room credits',               isCorrect: false },
          { label: 'D', text: '24/7 access and complimentary catering services',                       isCorrect: false },
        ],
      },
      {
        order: 5, grammarTopic: 'vocabulary',
        questionText: 'Q5: What connection can be made between all three passages?',
        explanation: 'Tất cả ba đoạn đều liên quan đến xu hướng co-working: bài báo mô tả xu hướng vĩ mô, bảng thống kê ngành sử dụng, thư giới thiệu dịch vụ cho một doanh nghiệp cụ thể.',
        options: [
          { label: 'A', text: 'They all relate to the growing trend of flexible office space usage',           isCorrect: true  },
          { label: 'B', text: 'They all focus on the decline of the financial services industry',             isCorrect: false },
          { label: 'C', text: 'They all describe the challenges of managing remote teams',                    isCorrect: false },
          { label: 'D', text: 'They all present arguments for returning to traditional office environments', isCorrect: false },
        ],
      },
      {
        order: 6, grammarTopic: 'vocabulary',
        questionText: 'Q6: The word "agility" in the article most nearly means ___.',
        explanation: '"Agility" = sự linh hoạt, khả năng thích nghi nhanh. Trong ngữ cảnh bất động sản thương mại: khả năng thay đổi cam kết thuê văn phòng một cách nhanh chóng.',
        options: [
          { label: 'A', text: 'Flexibility and adaptability',    isCorrect: true  },
          { label: 'B', text: 'Speed of production',             isCorrect: false },
          { label: 'C', text: 'Financial strength',              isCorrect: false },
          { label: 'D', text: 'Technological capability',        isCorrect: false },
        ],
      },
      {
        order: 7, grammarTopic: 'vocabulary',
        questionText: 'Q7: How many workstations does Zenith Capital require?',
        explanation: '"We can accommodate Zenith Capital\'s requirement for 25 dedicated workstations." — 25 workstations.',
        options: [
          { label: 'A', text: '25', isCorrect: true  },
          { label: 'B', text: '20', isCorrect: false },
          { label: 'C', text: '30', isCorrect: false },
          { label: 'D', text: '10', isCorrect: false },
        ],
      },
      {
        order: 8, grammarTopic: 'vocabulary',
        questionText: 'Q8: By what percentage did co-working subscriptions increase according to the article?',
        explanation: '"Flexible co-working space subscriptions have surged by 67%."',
        options: [
          { label: 'A', text: '67%', isCorrect: true  },
          { label: 'B', text: '23%', isCorrect: false },
          { label: 'C', text: '38%', isCorrect: false },
          { label: 'D', text: '12%', isCorrect: false },
        ],
      },
      {
        order: 9, grammarTopic: 'vocabulary',
        questionText: 'Q9: When will Zenith Capital\'s membership at FlexOffice begin?',
        explanation: '"We can accommodate Zenith Capital\'s requirement for 25 dedicated workstations in our downtown facility, effective from November 1."',
        options: [
          { label: 'A', text: 'November 1',  isCorrect: true  },
          { label: 'B', text: 'October 15',  isCorrect: false },
          { label: 'C', text: 'December 1',  isCorrect: false },
          { label: 'D', text: 'November 15', isCorrect: false },
        ],
      },
      {
        order: 10, grammarTopic: 'vocabulary',
        questionText: 'Q10: What does Dr. Helen Marsh\'s quote suggest about current business preferences?',
        explanation: '"They want scalable, short-term solutions" — doanh nghiệp hiện nay ưu tiên giải pháp linh hoạt, ngắn hạn thay vì cam kết dài hạn 10 năm.',
        options: [
          { label: 'A', text: 'Companies prefer scalable, short-term real estate commitments',    isCorrect: true  },
          { label: 'B', text: 'Companies are investing more in purchasing office buildings',       isCorrect: false },
          { label: 'C', text: 'Companies are reverting to pre-pandemic office-only policies',     isCorrect: false },
          { label: 'D', text: 'Companies are reducing their overall workforce significantly',     isCorrect: false },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════
  // EXAM 15 — PART 7 | VIP | Difficulty 3
  // Double Passage: Memo + Survey Results
  // ══════════════════════════════════════════════════════
  {
    title: 'TOEIC Part 7 - Reading Comprehension #6',
    part: 'PART7', type: 'VIP', difficulty: 'HARD',
    questions: [
      {
        order: 1, grammarTopic: 'vocabulary',
        questionText:
          '[READ BOTH PASSAGES BELOW, THEN ANSWER Q1–5]\n\n' +
          '── PASSAGE 1: INTERNAL MEMO ──\n' +
          'TO: All Department Heads\n' +
          'FROM: James Holden, Chief People Officer\n' +
          'RE: Employee Satisfaction Survey Results & Action Plan\n\n' +
          'Following the completion of our annual Employee Satisfaction Survey, I am writing to share key findings and outline the steps we will be taking in response.\n\n' +
          'Overall, 72% of respondents reported being satisfied or highly satisfied with their roles. However, several areas require immediate attention. The lowest satisfaction scores were recorded in three categories: career development opportunities (54%), internal communication (61%), and work-life balance (65%).\n\n' +
          'In response, the People & Culture team will be launching three initiatives:\n' +
          '1. A new mentorship program paired with quarterly career development workshops\n' +
          '2. A bi-weekly all-hands meeting to improve transparency and two-way communication\n' +
          '3. A flexible work hours pilot program for all non-customer-facing roles\n\n' +
          'These initiatives will be implemented progressively beginning Q1 next year. Department heads are requested to communicate these updates to their respective teams by end of this month.\n\n' +
          '── PASSAGE 2: SURVEY DATA EXCERPT ──\n' +
          'EMPLOYEE SATISFACTION SURVEY – KEY METRICS\n' +
          '┌──────────────────────────────────┬────────────────────┬──────────────────┐\n' +
          '│ Category                         │ Satisfaction Rate  │ vs. Last Year    │\n' +
          '├──────────────────────────────────┼────────────────────┼──────────────────┤\n' +
          '│ Overall Satisfaction             │ 72%                │ +4%              │\n' +
          '│ Compensation & Benefits          │ 78%                │ +2%              │\n' +
          '│ Management Support               │ 74%                │ +6%              │\n' +
          '│ Work-Life Balance                │ 65%                │ -3%              │\n' +
          '│ Internal Communication           │ 61%                │ -5%              │\n' +
          '│ Career Development Opportunities │ 54%                │ -8%              │\n' +
          '└──────────────────────────────────┴────────────────────┴──────────────────┘\n\n' +
          '──────────────────────────────────\n' +
          'Q1: What is the main purpose of the memo?',
        explanation: 'Mục đích: chia sẻ kết quả khảo sát và thông báo kế hoạch hành động đáp lại. "Share key findings and outline the steps we will be taking."',
        options: [
          { label: 'A', text: 'To share survey results and announce response initiatives',      isCorrect: true  },
          { label: 'B', text: 'To request department heads to conduct the annual survey',       isCorrect: false },
          { label: 'C', text: 'To introduce a new performance management system',              isCorrect: false },
          { label: 'D', text: 'To announce the results of the Q1 financial review',            isCorrect: false },
        ],
      },
      {
        order: 2, grammarTopic: 'vocabulary',
        questionText: 'Q2: According to both passages, which category had the lowest satisfaction score?',
        explanation: 'Memo và bảng đều cho thấy "Career Development Opportunities" đạt 54% — thấp nhất trong tất cả các hạng mục.',
        options: [
          { label: 'A', text: 'Career Development Opportunities (54%)', isCorrect: true  },
          { label: 'B', text: 'Internal Communication (61%)',           isCorrect: false },
          { label: 'C', text: 'Work-Life Balance (65%)',                isCorrect: false },
          { label: 'D', text: 'Management Support (74%)',               isCorrect: false },
        ],
      },
      {
        order: 3, grammarTopic: 'vocabulary',
        questionText: 'Q3: Which category showed the most significant year-on-year decline?',
        explanation: 'Bảng cho thấy "Career Development Opportunities" giảm -8% so với năm trước — mức giảm lớn nhất.',
        options: [
          { label: 'A', text: 'Career Development Opportunities (-8%)', isCorrect: true  },
          { label: 'B', text: 'Internal Communication (-5%)',           isCorrect: false },
          { label: 'C', text: 'Work-Life Balance (-3%)',                isCorrect: false },
          { label: 'D', text: 'Compensation & Benefits (+2%)',          isCorrect: false },
        ],
      },
      {
        order: 4, grammarTopic: 'vocabulary',
        questionText: 'Q4: What initiative addresses the lowest-scoring category?',
        explanation: 'Hạng mục thấp nhất là Career Development → Initiative 1: "A new mentorship program paired with quarterly career development workshops".',
        options: [
          { label: 'A', text: 'A mentorship program and career development workshops',      isCorrect: true  },
          { label: 'B', text: 'A flexible work hours pilot program',                       isCorrect: false },
          { label: 'C', text: 'A bi-weekly all-hands meeting',                             isCorrect: false },
          { label: 'D', text: 'An updated compensation and benefits package',              isCorrect: false },
        ],
      },
      {
        order: 5, grammarTopic: 'vocabulary',
        questionText: 'Q5: What are department heads asked to do by end of this month?',
        explanation: '"Department heads are requested to communicate these updates to their respective teams by end of this month."',
        options: [
          { label: 'A', text: 'Inform their teams about the survey results and planned initiatives', isCorrect: true  },
          { label: 'B', text: 'Submit their team\'s satisfaction scores to the HR department',      isCorrect: false },
          { label: 'C', text: 'Enroll their staff in the new mentorship program',                  isCorrect: false },
          { label: 'D', text: 'Develop their own departmental action plans',                       isCorrect: false },
        ],
      },
      {
        order: 6, grammarTopic: 'vocabulary',
        questionText: 'Q6: When will the new initiatives begin?',
        explanation: '"These initiatives will be implemented progressively beginning Q1 next year."',
        options: [
          { label: 'A', text: 'Q1 of next year',          isCorrect: true  },
          { label: 'B', text: 'The end of the current month',isCorrect: false },
          { label: 'C', text: 'Immediately after the memo',isCorrect: false },
          { label: 'D', text: 'Q3 of next year',           isCorrect: false },
        ],
      },
      {
        order: 7, grammarTopic: 'vocabulary',
        questionText: 'Q7: Which category improved the MOST compared to last year?',
        explanation: 'Bảng: Management Support tăng +6% — mức tăng cao nhất so với các hạng mục khác.',
        options: [
          { label: 'A', text: 'Management Support (+6%)',      isCorrect: true  },
          { label: 'B', text: 'Overall Satisfaction (+4%)',    isCorrect: false },
          { label: 'C', text: 'Compensation & Benefits (+2%)', isCorrect: false },
          { label: 'D', text: 'Work-Life Balance (-3%)',        isCorrect: false },
        ],
      },
      {
        order: 8, grammarTopic: 'vocabulary',
        questionText: 'Q8: The flexible work hours pilot program is designed for ___.',
        explanation: '"A flexible work hours pilot program for all non-customer-facing roles" — chương trình thí điểm cho các vị trí không trực tiếp tiếp xúc khách hàng.',
        options: [
          { label: 'A', text: 'All non-customer-facing roles',      isCorrect: true  },
          { label: 'B', text: 'Senior management only',             isCorrect: false },
          { label: 'C', text: 'All employees regardless of role',   isCorrect: false },
          { label: 'D', text: 'Employees with over 5 years\' tenure',isCorrect: false },
        ],
      },
      {
        order: 9, grammarTopic: 'vocabulary',
        questionText: 'Q9: Who sent this memo?',
        explanation: '"FROM: James Holden, Chief People Officer" — người gửi là CPO (Chief People Officer = Giám đốc Nhân sự cấp cao).',
        options: [
          { label: 'A', text: 'The Chief People Officer',    isCorrect: true  },
          { label: 'B', text: 'The Chief Executive Officer', isCorrect: false },
          { label: 'C', text: 'The Head of Finance',         isCorrect: false },
          { label: 'D', text: 'A department head',           isCorrect: false },
        ],
      },
      {
        order: 10, grammarTopic: 'vocabulary',
        questionText: 'Q10: What does the data suggest about employee satisfaction with compensation?',
        explanation: '"Compensation & Benefits" đạt 78% (+2% so với năm trước) — đây là hạng mục có điểm hài lòng cao và đang cải thiện, cho thấy nhân viên khá hài lòng về mức lương.',
        options: [
          { label: 'A', text: 'Employees are relatively satisfied and it has improved slightly year-on-year', isCorrect: true  },
          { label: 'B', text: 'It is the area of greatest concern for the company',                          isCorrect: false },
          { label: 'C', text: 'Satisfaction with compensation has fallen sharply',                          isCorrect: false },
          { label: 'D', text: 'Compensation is tied with work-life balance as the lowest-rated category',  isCorrect: false },
        ],
      },
    ],
  },
];

// ─── MAIN SEED FUNCTION ───────────────────────────────────
async function main() {
  console.log('🌱 Bắt đầu seed 15 TOEIC Exams...\n');

  // ── Users ───────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const testPassword  = await bcrypt.hash('Test@123456',  12);

  await prisma.user.upsert({
    where: { email: 'admin@toeicmaster.vn' },
    update: {},
    create: { email: 'admin@toeicmaster.vn', passwordHash: adminPassword, name: 'Admin',     role: 'ADMIN',    emailVerified: true },
  });
  await prisma.user.upsert({
    where: { email: 'user@test.vn' },
    update: {},
    create: { email: 'user@test.vn',         passwordHash: testPassword,  name: 'Test User', role: 'STANDARD', emailVerified: true },
  });
  await prisma.user.upsert({
    where: { email: 'vip@test.vn' },
    update: {},
    create: {
      email: 'vip@test.vn', passwordHash: testPassword, name: 'VIP User', role: 'VIP', emailVerified: true,
      vipExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('✅ Users: 3 accounts upserted');

  // ── Exams + Questions ────────────────────────────────────
  let totalExams = 0;
  let totalQuestions = 0;

  for (const examData of EXAMS) {
    const exam = await prisma.exam.create({
      data: {
        title:       examData.title,
        part:        examData.part        as any,
        type:        examData.type        as any,
        difficulty:  examData.difficulty,
        duration:    examData.part === 'PART7' ? 30 : 20,
        isPublished: true,
      },
    });

    // Logic gộp nhóm cho Part 6 & 7
    if (examData.part === 'PART6' || examData.part === 'PART7') {
      // Ví dụ: Gom 4 câu vào 1 nhóm cho Part 6, 5 câu cho Part 7
      const questionsPerGroup = examData.part === 'PART6' ? 4 : 5;
      for (let i = 0; i < examData.questions.length; i += questionsPerGroup) {
        const groupQuestions = examData.questions.slice(i, i + questionsPerGroup);
        const firstQuestion = groupQuestions[0];

        // Tạo PassageGroup
        const passageGroup = await prisma.passageGroup.create({
          data: {
            examId: exam.id,
            order: Math.floor(i / questionsPerGroup) + 1,
            passages: {
              create: [
                {
                  content: firstQuestion.passageContent || "Đây là nội dung bài đọc mẫu cho phần thi này. Bạn có thể thay đổi nội dung này trong trang quản trị.",
                  order: 1,
                }
              ]
            }
          }
        });

        // Tạo Questions cho nhóm này
        for (const q of groupQuestions) {
          await prisma.question.create({
            data: {
              examId: exam.id,
              passageGroupId: passageGroup.id,
              order: q.order,
              questionText: q.questionText,
              grammarTopic: q.grammarTopic,
              explanation: q.explanation,
              difficulty: examData.difficulty,
              options: { create: q.options },
            }
          });
          totalQuestions++;
        }
      }
    } else {
      // Part 5 — Không có passage
      for (const q of examData.questions) {
        await prisma.question.create({
          data: {
            examId: exam.id,
            order: q.order,
            questionText: q.questionText,
            grammarTopic: q.grammarTopic,
            explanation: q.explanation,
            difficulty: examData.difficulty,
            options: { create: q.options },
          }
        });
        totalQuestions++;
      }
    }

    totalExams++;
    console.log(`  ✓ [${examData.type}] ${examData.title} — ${examData.questions.length} câu`);
  }

  const freeCount = EXAMS.filter(e => e.type === 'FREE').length;
  const vipCount  = EXAMS.filter(e => e.type === 'VIP' ).length;
  const p5Count   = EXAMS.filter(e => e.part === 'PART5').length;
  const p6Count   = EXAMS.filter(e => e.part === 'PART6').length;
  const p7Count   = EXAMS.filter(e => e.part === 'PART7').length;

  console.log(`
📊 Tổng kết:
  • Exams:     ${totalExams} đề (${freeCount} FREE + ${vipCount} VIP)
  • Questions: ${totalQuestions} câu (${p5Count * 10} Part 5 + ${p6Count * 10} Part 6 + ${p7Count * 10} Part 7)
  • Parts:     Part 5 × ${p5Count} | Part 6 × ${p6Count} | Part 7 × ${p7Count}

🎉 Seed hoàn thành!`);
}

main()
  .catch((e) => {
    console.error('❌ Seed thất bại:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
