import csvParse from 'csv-parse';
import path from 'path';
import fs from 'fs';
import { getCustomRepository, getRepository, In } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateOrFindCategoryService from './CreateOrFindCategoryService';
import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import Category from '../models/Category';

interface Request {
  filename: string;
}

interface TransactionToSave {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  public async execute({ filename }: Request): Promise<Transaction[]> {
    const csvFilePath = path.resolve(uploadConfig.directory, filename);
    const readCsvStream = fs.createReadStream(csvFilePath);
    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });
    const parseCsv = readCsvStream.pipe(parseStream);

    const transactionsToCreate: TransactionToSave[] = [];
    const categoriesToSave: string[] = [];
    parseCsv.on('data', line => {
      const [title, type, value, category]: string[] = line;
      categoriesToSave.push(category);
      const valueInNumber = Number(value);
      transactionsToCreate.push({
        title,
        value: valueInNumber,
        type: type === 'income' ? 'income' : 'outcome',
        category,
      });
    });

    await new Promise(resolve => {
      parseCsv.on('end', resolve);
    });

    const csvFileExists = await fs.promises.stat(csvFilePath);
    if (csvFileExists) {
      await fs.promises.unlink(csvFilePath);
    }

    const categoriesRepository = getRepository(Category);
    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categoriesToSave),
      },
    });

    const categoryTitles = existentCategories.map(category => category.title);

    const addCategoryTitles = categoriesToSave.filter(
      category => !categoryTitles.includes(category),
    );

    const addCategoryTitlesUniques: string[] = [];

    addCategoryTitles.forEach(title => {
      if (!addCategoryTitlesUniques.includes(title)) {
        addCategoryTitlesUniques.push(title);
      }
    });

    const createOrFindCategory = new CreateOrFindCategoryService();

    const categories = await Promise.all(
      addCategoryTitlesUniques.map(async categoryTitle => {
        const category = await createOrFindCategory.execute({
          title: categoryTitle,
        });
        return category;
      }),
    );

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transactionsToSave = transactionsToCreate.map(transactionToCreate => {
      const category = categories.find(
        categoryCurrent =>
          categoryCurrent.title === transactionToCreate.category,
      ) as Category;
      const transaction = transactionsRepository.create({
        title: transactionToCreate.title,
        value: transactionToCreate.value,
        type: transactionToCreate.type,
        category_id: category.id,
      });
      return transaction;
    });

    const transactions = await transactionsRepository.save(transactionsToSave);
    return transactions;
  }
}

export default ImportTransactionsService;
