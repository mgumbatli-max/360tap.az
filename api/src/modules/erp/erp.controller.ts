import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { ErpPublishDto } from './dto/erp-publish.dto';
import { ErpPriceDto, ErpStockDto } from './dto/erp-sync.dto';
import { ErpAuthGuard, type ErpRequest } from './erp-auth.guard';
import { ErpService } from './erp.service';

@Controller()
export class ErpController {
  constructor(private readonly erp: ErpService) {}

  // ---- Provisioning (mağaza sahibi — JWT) ----
  @Post('me/store/erp/enable')
  enable(@CurrentUser() user: JwtPayload) {
    return this.erp.enableForOwner(user.sub);
  }

  @Get('me/store/erp')
  status(@CurrentUser() user: JwtPayload) {
    return this.erp.statusForOwner(user.sub);
  }

  // ---- Gateway (ERP sistem — API key + HMAC) ----
  @Public()
  @UseGuards(ErpAuthGuard)
  @Post('erp/v1/products/publish')
  publish(@Req() req: ErpRequest, @Body() dto: ErpPublishDto) {
    return this.erp.publish(req.erpIntegration!, dto);
  }

  @Public()
  @UseGuards(ErpAuthGuard)
  @Patch('erp/v1/products/:externalId/stock')
  stock(@Req() req: ErpRequest, @Param('externalId') ext: string, @Body() dto: ErpStockDto) {
    return this.erp.updateStock(req.erpIntegration!, ext, dto.stock_qty);
  }

  @Public()
  @UseGuards(ErpAuthGuard)
  @Patch('erp/v1/products/:externalId/price')
  price(@Req() req: ErpRequest, @Param('externalId') ext: string, @Body() dto: ErpPriceDto) {
    return this.erp.updatePrice(req.erpIntegration!, ext, dto.price, dto.old_price);
  }

  @Public()
  @UseGuards(ErpAuthGuard)
  @Delete('erp/v1/products/:externalId')
  remove(@Req() req: ErpRequest, @Param('externalId') ext: string) {
    return this.erp.remove(req.erpIntegration!, ext);
  }
}
