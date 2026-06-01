import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOptionsWhere } from 'typeorm';
import { Customer } from './entities/customer.entity.js';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/index.js';
import {
  PaginationQueryDto,
  PaginatedResult,
} from '../common/dto/pagination.dto.js';
import { paginate } from '../common/utils/paginate.js';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  async create(dto: CreateCustomerDto, tenantId: number): Promise<Customer> {
    const customer = this.customerRepo.create({ ...dto, tenantId });
    return this.customerRepo.save(customer);
  }

  async findAllByTenant(
    tenantId: number,
    pagination?: PaginationQueryDto,
    search?: string,
  ): Promise<PaginatedResult<Customer>> {
    const where: FindOptionsWhere<Customer>[] | FindOptionsWhere<Customer> =
      search
        ? [
            { tenantId, firstName: ILike(`%${search}%`) },
            { tenantId, lastName: ILike(`%${search}%`) },
            { tenantId, phone: ILike(`%${search}%`) },
          ]
        : { tenantId };

    return paginate(
      this.customerRepo,
      { where, order: { lastName: 'ASC', firstName: 'ASC' } },
      pagination?.page,
      pagination?.limit,
    );
  }

  async findOneByUuid(uuid: string, tenantId: number): Promise<Customer> {
    const customer = await this.customerRepo.findOne({
      where: { uuid, tenantId },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(
    uuid: string,
    dto: UpdateCustomerDto,
    tenantId: number,
  ): Promise<Customer> {
    const customer = await this.findOneByUuid(uuid, tenantId);
    Object.assign(customer, dto);
    return this.customerRepo.save(customer);
  }

  async remove(uuid: string, tenantId: number): Promise<void> {
    const customer = await this.findOneByUuid(uuid, tenantId);
    await this.customerRepo.softRemove(customer);
  }
}
