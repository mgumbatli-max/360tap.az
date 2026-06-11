import { IsBoolean, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSavedSearchDto {
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsObject() query!: Record<string, unknown>; // /elanlar filtr parametrləri
  @IsOptional() @IsBoolean() notify?: boolean;
}
