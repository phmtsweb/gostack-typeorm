import { getRepository } from 'typeorm';
import Category from '../models/Category';

interface Request {
  title: string;
}
class CreateOrFindCategoryService {
  public async execute({ title }: Request): Promise<Category> {
    const categoriesRepository = getRepository(Category);
    const categoryFound = await categoriesRepository.findOne({
      where: { title },
    });
    if (categoryFound) {
      return categoryFound;
    }
    const category = await categoriesRepository.save({ title });
    return category;
  }
}

export default CreateOrFindCategoryService;
