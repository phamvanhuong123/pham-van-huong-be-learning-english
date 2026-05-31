import { prisma } from '../config/prisma';
import { Difficulty, OptionLabel } from '../../generated/prisma/client';

const topics = [
  { name: 'Tenses (Thì trong tiếng Anh)', slug: 'tenses', description: 'Các thì cơ bản và nâng cao trong tiếng Anh' },
  { name: 'Prepositions (Giới từ)', slug: 'prepositions', description: 'Giới từ chỉ thời gian, nơi chốn và các cụm giới từ' },
  { name: 'Conditionals (Câu điều kiện)', slug: 'conditionals', description: 'Các loại câu điều kiện 1, 2, 3 và hỗn hợp' },
  { name: 'Passive Voice (Câu bị động)', slug: 'passive-voice', description: 'Câu bị động ở các thì và dạng đặc biệt' }
];

const questions = [
  // Tenses
  {
    topicSlug: 'tenses',
    questionText: 'By the time we arrived at the station, the train ___.',
    difficulty: Difficulty.MEDIUM,
    explanation: 'Hành động tàu rời đi xảy ra trước hành động chúng tôi đến, nên dùng thì quá khứ hoàn thành (had left).',
    options: [
      { label: OptionLabel.A, text: 'left', isCorrect: false },
      { label: OptionLabel.B, text: 'has left', isCorrect: false },
      { label: OptionLabel.C, text: 'had left', isCorrect: true },
      { label: OptionLabel.D, text: 'was leaving', isCorrect: false },
    ]
  },
  {
    topicSlug: 'tenses',
    questionText: 'I ___ for this company since I graduated from university.',
    difficulty: Difficulty.EASY,
    explanation: 'Dấu hiệu "since + mốc thời gian trong quá khứ" yêu cầu thì hiện tại hoàn thành hoặc hiện tại hoàn thành tiếp diễn.',
    options: [
      { label: OptionLabel.A, text: 'am working', isCorrect: false },
      { label: OptionLabel.B, text: 'have been working', isCorrect: true },
      { label: OptionLabel.C, text: 'was working', isCorrect: false },
      { label: OptionLabel.D, text: 'work', isCorrect: false },
    ]
  },
  {
    topicSlug: 'tenses',
    questionText: 'She ___ her homework before she went to bed.',
    difficulty: Difficulty.MEDIUM,
    explanation: 'Hành động làm bài tập xảy ra trước hành động đi ngủ trong quá khứ, do đó dùng quá khứ hoàn thành.',
    options: [
      { label: OptionLabel.A, text: 'finishes', isCorrect: false },
      { label: OptionLabel.B, text: 'has finished', isCorrect: false },
      { label: OptionLabel.C, text: 'finished', isCorrect: false },
      { label: OptionLabel.D, text: 'had finished', isCorrect: true },
    ]
  },
  {
    topicSlug: 'tenses',
    questionText: 'Look at those dark clouds! It ___.',
    difficulty: Difficulty.MEDIUM,
    explanation: 'Dự đoán có căn cứ ở hiện tại (những đám mây đen) dùng thì tương lai gần "be going to".',
    options: [
      { label: OptionLabel.A, text: 'will rain', isCorrect: false },
      { label: OptionLabel.B, text: 'is going to rain', isCorrect: true },
      { label: OptionLabel.C, text: 'rains', isCorrect: false },
      { label: OptionLabel.D, text: 'is raining', isCorrect: false },
    ]
  },
  {
    topicSlug: 'tenses',
    questionText: 'They ___ dinner when the phone rang.',
    difficulty: Difficulty.EASY,
    explanation: 'Một hành động đang xảy ra trong quá khứ (were having) thì có hành động khác xen vào (rang).',
    options: [
      { label: OptionLabel.A, text: 'were having', isCorrect: true },
      { label: OptionLabel.B, text: 'had', isCorrect: false },
      { label: OptionLabel.C, text: 'have', isCorrect: false },
      { label: OptionLabel.D, text: 'are having', isCorrect: false },
    ]
  },

  // Prepositions
  {
    topicSlug: 'prepositions',
    questionText: 'We are very proud ___ our son\'s achievements.',
    difficulty: Difficulty.EASY,
    explanation: 'Cấu trúc "proud of" nghĩa là tự hào về điều gì đó.',
    options: [
      { label: OptionLabel.A, text: 'with', isCorrect: false },
      { label: OptionLabel.B, text: 'about', isCorrect: false },
      { label: OptionLabel.C, text: 'of', isCorrect: true },
      { label: OptionLabel.D, text: 'in', isCorrect: false },
    ]
  },
  {
    topicSlug: 'prepositions',
    questionText: 'She is not very good ___ mathematics.',
    difficulty: Difficulty.EASY,
    explanation: 'Cấu trúc "good at something" dùng để chỉ việc giỏi về một lĩnh vực nào đó.',
    options: [
      { label: OptionLabel.A, text: 'in', isCorrect: false },
      { label: OptionLabel.B, text: 'at', isCorrect: true },
      { label: OptionLabel.C, text: 'about', isCorrect: false },
      { label: OptionLabel.D, text: 'with', isCorrect: false },
    ]
  },
  {
    topicSlug: 'prepositions',
    questionText: 'Please apologize ___ your sister for breaking her toy.',
    difficulty: Difficulty.MEDIUM,
    explanation: 'Cấu trúc "apologize to somebody for something" nghĩa là xin lỗi ai về việc gì.',
    options: [
      { label: OptionLabel.A, text: 'with', isCorrect: false },
      { label: OptionLabel.B, text: 'for', isCorrect: false },
      { label: OptionLabel.C, text: 'to', isCorrect: true },
      { label: OptionLabel.D, text: 'about', isCorrect: false },
    ]
  },
  {
    topicSlug: 'prepositions',
    questionText: 'The meeting will take place ___ Monday morning.',
    difficulty: Difficulty.EASY,
    explanation: 'Dùng "on" trước các buổi trong một ngày cụ thể (Monday morning).',
    options: [
      { label: OptionLabel.A, text: 'in', isCorrect: false },
      { label: OptionLabel.B, text: 'at', isCorrect: false },
      { label: OptionLabel.C, text: 'on', isCorrect: true },
      { label: OptionLabel.D, text: 'during', isCorrect: false },
    ]
  },
  {
    topicSlug: 'prepositions',
    questionText: 'He insisted ___ paying for the meal.',
    difficulty: Difficulty.MEDIUM,
    explanation: 'Cấu trúc "insist on doing something" nghĩa là khăng khăng đòi làm việc gì.',
    options: [
      { label: OptionLabel.A, text: 'in', isCorrect: false },
      { label: OptionLabel.B, text: 'to', isCorrect: false },
      { label: OptionLabel.C, text: 'for', isCorrect: false },
      { label: OptionLabel.D, text: 'on', isCorrect: true },
    ]
  },

  // Conditionals
  {
    topicSlug: 'conditionals',
    questionText: 'If I ___ you, I would study harder for the exam.',
    difficulty: Difficulty.EASY,
    explanation: 'Câu điều kiện loại 2, giả định một điều không có thật ở hiện tại. Động từ "to be" được chia là "were" cho mọi ngôi.',
    options: [
      { label: OptionLabel.A, text: 'am', isCorrect: false },
      { label: OptionLabel.B, text: 'was', isCorrect: false },
      { label: OptionLabel.C, text: 'were', isCorrect: true },
      { label: OptionLabel.D, text: 'had been', isCorrect: false },
    ]
  },
  {
    topicSlug: 'conditionals',
    questionText: 'Unless you ___ harder, you will fail the test.',
    difficulty: Difficulty.MEDIUM,
    explanation: '"Unless" mang nghĩa "If not". Mệnh đề đi sau unless dùng thì hiện tại đơn trong câu điều kiện loại 1.',
    options: [
      { label: OptionLabel.A, text: 'don\'t try', isCorrect: false },
      { label: OptionLabel.B, text: 'try', isCorrect: true },
      { label: OptionLabel.C, text: 'won\'t try', isCorrect: false },
      { label: OptionLabel.D, text: 'will try', isCorrect: false },
    ]
  },
  {
    topicSlug: 'conditionals',
    questionText: 'If she had known you were in hospital, she ___ you.',
    difficulty: Difficulty.MEDIUM,
    explanation: 'Câu điều kiện loại 3, chỉ sự việc không có thật trong quá khứ. Mệnh đề chính dùng "would have + V3/ed".',
    options: [
      { label: OptionLabel.A, text: 'would visit', isCorrect: false },
      { label: OptionLabel.B, text: 'will visit', isCorrect: false },
      { label: OptionLabel.C, text: 'visited', isCorrect: false },
      { label: OptionLabel.D, text: 'would have visited', isCorrect: true },
    ]
  },
  {
    topicSlug: 'conditionals',
    questionText: 'I wish I ___ a car. It would make life much easier.',
    difficulty: Difficulty.EASY,
    explanation: 'Cấu trúc câu ước ở hiện tại (trái ngược với thực tế ở hiện tại) dùng thì quá khứ đơn.',
    options: [
      { label: OptionLabel.A, text: 'have', isCorrect: false },
      { label: OptionLabel.B, text: 'had', isCorrect: true },
      { label: OptionLabel.C, text: 'will have', isCorrect: false },
      { label: OptionLabel.D, text: 'had had', isCorrect: false },
    ]
  },
  {
    topicSlug: 'conditionals',
    questionText: 'Had they arrived earlier, they ___ the beginning of the movie.',
    difficulty: Difficulty.HARD,
    explanation: 'Đảo ngữ của câu điều kiện loại 3. "Had + S + V3/ed, S + would have + V3/ed".',
    options: [
      { label: OptionLabel.A, text: 'wouldn\'t miss', isCorrect: false },
      { label: OptionLabel.B, text: 'wouldn\'t have missed', isCorrect: true },
      { label: OptionLabel.C, text: 'didn\'t miss', isCorrect: false },
      { label: OptionLabel.D, text: 'hadn\'t missed', isCorrect: false },
    ]
  },

  // Passive Voice
  {
    topicSlug: 'passive-voice',
    questionText: 'The new bridge ___ by the end of next year.',
    difficulty: Difficulty.HARD,
    explanation: 'Bị động của thì tương lai hoàn thành "will have been + V3/ed", diễn tả hành động sẽ hoàn tất trước một thời điểm trong tương lai.',
    options: [
      { label: OptionLabel.A, text: 'will be completing', isCorrect: false },
      { label: OptionLabel.B, text: 'will have been completed', isCorrect: true },
      { label: OptionLabel.C, text: 'will have completed', isCorrect: false },
      { label: OptionLabel.D, text: 'is completed', isCorrect: false },
    ]
  },
  {
    topicSlug: 'passive-voice',
    questionText: 'My car ___ at the moment, so I have to take the bus.',
    difficulty: Difficulty.MEDIUM,
    explanation: 'Bị động của thì hiện tại tiếp diễn, "is/are being + V3/ed".',
    options: [
      { label: OptionLabel.A, text: 'is repairing', isCorrect: false },
      { label: OptionLabel.B, text: 'is repaired', isCorrect: false },
      { label: OptionLabel.C, text: 'is being repaired', isCorrect: true },
      { label: OptionLabel.D, text: 'has been repaired', isCorrect: false },
    ]
  },
  {
    topicSlug: 'passive-voice',
    questionText: 'This letter must ___ immediately.',
    difficulty: Difficulty.EASY,
    explanation: 'Bị động với động từ khuyết thiếu (modal verb) "must be + V3/ed".',
    options: [
      { label: OptionLabel.A, text: 'be sent', isCorrect: true },
      { label: OptionLabel.B, text: 'send', isCorrect: false },
      { label: OptionLabel.C, text: 'be sending', isCorrect: false },
      { label: OptionLabel.D, text: 'sent', isCorrect: false },
    ]
  },
  {
    topicSlug: 'passive-voice',
    questionText: 'We ___ to wait outside until the doctor was ready.',
    difficulty: Difficulty.MEDIUM,
    explanation: 'Bị động ở quá khứ đơn diễn đạt việc "được yêu cầu/bảo" làm gì đó ("were told").',
    options: [
      { label: OptionLabel.A, text: 'were telling', isCorrect: false },
      { label: OptionLabel.B, text: 'told', isCorrect: false },
      { label: OptionLabel.C, text: 'have been told', isCorrect: false },
      { label: OptionLabel.D, text: 'were told', isCorrect: true },
    ]
  },
  {
    topicSlug: 'passive-voice',
    questionText: 'The problem ___ completely solved yet.',
    difficulty: Difficulty.MEDIUM,
    explanation: 'Dấu hiệu "yet" đi với thì hiện tại hoàn thành phủ định. Cấu trúc bị động: "hasn\'t been solved".',
    options: [
      { label: OptionLabel.A, text: 'isn\'t', isCorrect: false },
      { label: OptionLabel.B, text: 'hasn\'t been', isCorrect: true },
      { label: OptionLabel.C, text: 'wasn\'t', isCorrect: false },
      { label: OptionLabel.D, text: 'hadn\'t been', isCorrect: false },
    ]
  }
];


async function seed() {
  console.log('Seeding grammar topics and questions...');
  
  for (const topicData of topics) {
    // create topic if not exists
    let topic = await prisma.grammarTopic.findUnique({ where: { slug: topicData.slug } });
    if (!topic) {
      topic = await prisma.grammarTopic.create({
        data: {
          name: topicData.name,
          slug: topicData.slug,
          description: topicData.description
        }
      });
      console.log(`Created topic: ${topic.name}`);
    } else {
      console.log(`Topic already exists: ${topic.name}`);
    }

    const topicQuestions = questions.filter(q => q.topicSlug === topicData.slug);
    
    // find max order
    const maxOrderResult = await prisma.question.aggregate({
      where: { grammarTopicId: topic.id, isDeleted: false },
      _max: { order: true }
    });
    let nextOrder = (maxOrderResult._max.order ?? -1) + 1;

    for (const qData of topicQuestions) {
      // Check if question already exists
      const existingQ = await prisma.question.findFirst({
        where: {
          grammarTopicId: topic.id,
          questionText: qData.questionText,
          isDeleted: false
        }
      });

      if (!existingQ) {
        await prisma.question.create({
          data: {
            grammarTopicId: topic.id,
            examId: null,
            questionText: qData.questionText,
            difficulty: qData.difficulty,
            explanation: qData.explanation,
            order: nextOrder++,
            options: {
              create: qData.options
            }
          }
        });
        console.log(`- Created question: ${qData.questionText}`);
      } else {
        console.log(`- Question already exists: ${qData.questionText}`);
      }
    }
  }

  console.log('Seeding completed successfully!');
}

seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
