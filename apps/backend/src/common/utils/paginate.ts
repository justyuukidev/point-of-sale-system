import { Repository, FindManyOptions, ObjectLiteral } from 'typeorm';
import { PaginatedResult } from '../dto/pagination.dto.js';

export async function paginate<T extends ObjectLiteral>(
  repo: Repository<T>,
  options: FindManyOptions<T>,
  page: number = 1,
  limit: number = 50,
): Promise<PaginatedResult<T>> {
  const skip = (page - 1) * limit;
  const [data, total] = await repo.findAndCount({
    ...options,
    skip,
    take: limit,
  });
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
