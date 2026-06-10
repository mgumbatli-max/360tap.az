import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class ErpStockDto {
  @Type(() => Number) @IsInt() @Min(0) stock_qty!: number;
}

export class ErpPriceDto {
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) price!: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) old_price?: number;
}
