import { PrismaClient, ExamPart, Difficulty, ExamType, PassageType, MediaType, OptionLabel } from "../../generated/prisma/client";
import bcrypt from "bcrypt";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Bắt đầu gieo mầm dữ liệu Bài Thi (Seeding Exams)...');

  // 1. Tạo User Học viên test
  const passwordHash = await bcrypt.hash('123456', 10);
  const user = await prisma.user.upsert({
    where: { id: "86ee1cbf-2882-4f3f-aa6c-3229652e56b1" },
    update: {},
    create: {
      id: "86ee1cbf-2882-4f3f-aa6c-3229652e56b1", // ID cố định đã mock trong Controller
      email: 'student@example.com',
      passwordHash,
      name: 'Test Student',
      isSuperAdmin: false,
    },
  });
  console.log('✅ Đã tạo/kiểm tra User Test:', user.email);

  // 2. Tạo Đề thi (Exam) - Part 1
  const examPart1 = await prisma.exam.create({
    data: {
      title: 'TOEIC Part 1 Mini Test (Hình ảnh)',
      description: 'Bài kiểm tra nhỏ kỹ năng nghe mô tả hình ảnh.',
      part: ExamPart.PART1,
      difficulty: Difficulty.EASY,
      type: ExamType.FREE,
      duration: 5, // 5 phút
      isPublished: true,
      
      passageGroups: {
        create: [
          {
            type: PassageType.SINGLE,
            passages: {
              create: [
                {
                  order: 1,
                  mediaType: MediaType.IMAGE,
                  mediaUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800',
                },
                {
                  order: 2,
                  mediaType: MediaType.AUDIO,
                  mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Audio mẫu
                }
              ]
            },
            questions: {
              create: [
                {
                  order: 1,
                  questionText: 'Look at the picture and listen to the audio.', // Sẽ bị ẩn ở Client
                  options: {
                    create: [
                      { label: OptionLabel.A, text: 'They are looking at a laptop.', isCorrect: true }, // Sẽ bị ẩn ở Client
                      { label: OptionLabel.B, text: 'They are drinking coffee.', isCorrect: false },
                      { label: OptionLabel.C, text: 'They are standing up.', isCorrect: false },
                      { label: OptionLabel.D, text: 'They are walking outside.', isCorrect: false },
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    }
  });

  console.log(`✅ Tạo Đề thi Part 1 thành công (ID: ${examPart1.id})`);

  // 3. Tạo Đề thi (Exam) - Part 5
  const examPart5 = await prisma.exam.create({
    data: {
      title: 'TOEIC Part 5 Mini Test (Ngữ pháp)',
      description: 'Bài kiểm tra nhỏ kỹ năng điền từ vào chỗ trống.',
      part: ExamPart.PART5,
      difficulty: Difficulty.MEDIUM,
      type: ExamType.FREE,
      duration: 10,
      isPublished: true,

      questions: {
        create: [
          {
            order: 1,
            questionText: 'The new software update will ________ the system performance significantly.',
            options: {
              create: [
                { label: OptionLabel.A, text: 'improvement', isCorrect: false },
                { label: OptionLabel.B, text: 'improve', isCorrect: true },
                { label: OptionLabel.C, text: 'improved', isCorrect: false },
                { label: OptionLabel.D, text: 'improving', isCorrect: false },
              ]
            }
          },
          {
            order: 2,
            questionText: 'All employees are required to submit their reports ________ Friday.',
            options: {
              create: [
                { label: OptionLabel.A, text: 'in', isCorrect: false },
                { label: OptionLabel.B, text: 'on', isCorrect: false },
                { label: OptionLabel.C, text: 'by', isCorrect: true },
                { label: OptionLabel.D, text: 'at', isCorrect: false },
              ]
            }
          }
        ]
      }
    }
  });

  console.log(`✅ Tạo Đề thi Part 5 thành công (ID: ${examPart5.id})`);
  console.log('\n🎉 Hoàn thành quá trình Seed Exam Data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
