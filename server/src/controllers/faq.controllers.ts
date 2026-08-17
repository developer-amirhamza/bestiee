import { Request, Response } from 'express';
import { errorHandler } from '../utils/errorHandler';
import { prisma } from '../lib/prisma';

// Public: FAQs for the standalone "Long FAQ" page (blogId not given) or for
// a specific article's embedded FAQ section (?blogId=...).
export const getFaqs = async (req: Request, res: Response) => {
  try {
    const { blogId } = req.query;
    const faqs = await prisma.faq.findMany({
      where: { isActive: true, blogId: blogId ? String(blogId) : null },
      orderBy: { order: 'asc' },
    });
    return errorHandler(res, 200, 'FAQs retrieved', false, faqs);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

export const getAllFaqs = async (_req: Request, res: Response) => {
  try {
    const faqs = await prisma.faq.findMany({
      orderBy: [{ blogId: 'asc' }, { order: 'asc' }],
    });
    return errorHandler(res, 200, 'All FAQs retrieved', false, faqs);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

export const createFaq = async (req: Request, res: Response) => {
  try {
    const { question, answer, blogId, order, isActive } = req.body;
    if (!question || !answer) return errorHandler(res, 400, 'Question and answer are required');
    const faq = await prisma.faq.create({
      data: {
        question,
        answer,
        blogId: blogId || null,
        order: order ?? 0,
        isActive: isActive ?? true,
      },
    });
    return errorHandler(res, 201, 'FAQ created', false, faq);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

export const updateFaq = async (req: Request, res: Response) => {
  try {
    const { id, question, answer, blogId, order, isActive } = req.body;
    if (!id) return errorHandler(res, 400, 'FAQ ID is required');
    const existing = await prisma.faq.findUnique({ where: { id } });
    if (!existing) return errorHandler(res, 404, 'FAQ not found');
    const data: any = {};
    if (question !== undefined) data.question = question;
    if (answer !== undefined) data.answer = answer;
    if (blogId !== undefined) data.blogId = blogId || null;
    if (order !== undefined) data.order = order;
    if (isActive !== undefined) data.isActive = isActive;
    const updated = await prisma.faq.update({ where: { id }, data });
    return errorHandler(res, 200, 'FAQ updated', false, updated);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};

export const deleteFaq = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) return errorHandler(res, 400, 'FAQ ID is required');
    const existing = await prisma.faq.findUnique({ where: { id } });
    if (!existing) return errorHandler(res, 404, 'FAQ not found');
    await prisma.faq.delete({ where: { id } });
    return errorHandler(res, 200, 'FAQ deleted', false, null);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || 'Internal server error');
  }
};
