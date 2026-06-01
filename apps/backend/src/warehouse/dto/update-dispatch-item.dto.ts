import { PartialType } from '@nestjs/mapped-types';
import { CreateDispatchItemDto } from './create-dispatch-item.dto.js';

export class UpdateDispatchItemDto extends PartialType(CreateDispatchItemDto) {}
