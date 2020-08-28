import { validate } from 'uuid';
import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    if (!validate(id)) {
      throw new AppError('Transaction is not found', 400);
    }
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transaction = await transactionsRepository.findOne(id);
    if (!transaction) {
      throw new AppError('Transaction is not found', 400);
    }
    await transactionsRepository.remove(transaction);
  }
}

export default DeleteTransactionService;
