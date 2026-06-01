import { IsInt } from 'class-validator';

export class CreateDispatchItemDto {
  @IsInt()
  dispatchId!: number;

  @IsInt()
  batchId!: number;

  @IsInt()
  quantity!: number;
}
