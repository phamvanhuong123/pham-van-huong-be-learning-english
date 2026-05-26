import { prisma } from "@/config/prisma";

const upsertNote = async (userId: string, questionId: string, content: string) => {
  return await prisma.questionNote.upsert({
    where: {
      userId_questionId: {
        userId,
        questionId
      }
    },
    update: {
      content
    },
    create: {
      userId,
      questionId,
      content
    }
  });
};

const getNote = async (userId: string, questionId: string) => {
  return await prisma.questionNote.findUnique({
    where: {
      userId_questionId: {
        userId,
        questionId
      }
    }
  });
};

export const questionNoteService = {
  upsertNote,
  getNote
};
