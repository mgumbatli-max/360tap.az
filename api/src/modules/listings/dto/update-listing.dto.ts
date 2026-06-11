import { PartialType } from '@nestjs/mapped-types';
import { CreateListingDto } from './create-listing.dto';

// Bütün sahələr opsional — yalnız dəyişənləri göndərmək olar
export class UpdateListingDto extends PartialType(CreateListingDto) {}
