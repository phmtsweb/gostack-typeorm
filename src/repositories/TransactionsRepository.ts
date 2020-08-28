import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface TransactionsWithBalance {
  transactions: Transaction[];
  balance: Balance;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();

    const entries = {
      income: 0,
      outcome: 0,
    };
    transactions.forEach(transaction => {
      if (transaction.type === 'income' || transaction.type === 'outcome') {
        const value = Number(transaction.value);
        entries[transaction.type] += value;
      }
    });
    const { income, outcome } = entries;
    const total = income - outcome;
    return {
      income,
      outcome,
      total,
    };
  }

  public async all(): Promise<TransactionsWithBalance> {
    const transactionsWithCategory = await this.find({
      relations: ['category'],
    });
    const transactions = transactionsWithCategory.map(transaction => {
      const value = Number(transaction.value);
      const mappedTransaction = { ...transaction, value };
      delete mappedTransaction.category_id;
      return mappedTransaction;
    });
    const balance = await this.getBalance();
    return {
      transactions,
      balance,
    };
  }
}

export default TransactionsRepository;
