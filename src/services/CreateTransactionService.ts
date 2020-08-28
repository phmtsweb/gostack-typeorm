import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateOrFindCategoryService from './CreateOrFindCategoryService';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

interface Response {
  id: string;
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Response> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const balance = await transactionsRepository.getBalance();
    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('This type is not valid', 400);
    } else if (typeof value !== 'number' || value <= 0) {
      throw new AppError('This value is not valid', 400);
    } else if (type === 'outcome' && balance.total < value) {
      throw new AppError('This value does not debited', 400);
    }

    const createOrFoundCategory = new CreateOrFindCategoryService();
    const categoryCreatedOrFound = await createOrFoundCategory.execute({
      title: category,
    });

    const category_id = categoryCreatedOrFound.id;

    const transactionToCreate = transactionsRepository.create({
      title,
      value,
      type,
      category_id,
    });

    const transaction = await transactionsRepository.save(transactionToCreate);
    delete transaction.category_id;
    delete transaction.created_at;
    delete transaction.updated_at;
    const transactionWithCategoryName = {
      ...transaction,
      category,
    };
    return transactionWithCategoryName;
  }
}

export default CreateTransactionService;
