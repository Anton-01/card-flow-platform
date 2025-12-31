import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CompaniesService } from './companies.service';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  UpdateBrandingDto,
  UpdateLockedFieldsDto,
} from './dto';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';

@ApiTags('Companies')
@Controller('companies')
@ApiBearerAuth()
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({ status: 201, description: 'Company created' })
  @ApiResponse({ status: 400, description: 'User already has a company' })
  async createCompany(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCompanyDto,
  ) {
    return this.companiesService.createCompany(user.id, dto);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current user company' })
  @ApiResponse({ status: 200, description: 'Company details' })
  @ApiResponse({ status: 404, description: 'No company found' })
  async getCurrentCompany(@CurrentUser() user: CurrentUserPayload) {
    return this.companiesService.getCurrentCompany(user);
  }

  @Patch('current')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update company details' })
  @ApiResponse({ status: 200, description: 'Company updated' })
  async updateCompany(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.updateCompany(user, dto);
  }

  @Patch('branding')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update company branding' })
  @ApiResponse({ status: 200, description: 'Branding updated' })
  async updateBranding(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateBrandingDto,
  ) {
    return this.companiesService.updateBranding(user, dto);
  }

  @Patch('template')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update company template configuration' })
  @ApiResponse({ status: 200, description: 'Template updated' })
  async updateTemplate(
    @CurrentUser() user: CurrentUserPayload,
    @Body() templateConfig: Record<string, unknown>,
  ) {
    return this.companiesService.updateTemplate(user, templateConfig);
  }

  @Get('locked-fields')
  @ApiOperation({ summary: 'Get locked fields for the company' })
  @ApiResponse({ status: 200, description: 'Locked fields list' })
  async getLockedFields(@CurrentUser() user: CurrentUserPayload) {
    return this.companiesService.getLockedFields(user);
  }

  @Patch('locked-fields')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update locked fields' })
  @ApiResponse({ status: 200, description: 'Locked fields updated' })
  async updateLockedFields(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateLockedFieldsDto,
  ) {
    return this.companiesService.updateLockedFields(user, dto);
  }

  @Get('members')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get company members' })
  @ApiResponse({ status: 200, description: 'List of members' })
  async getMembers(@CurrentUser() user: CurrentUserPayload) {
    return this.companiesService.getMembers(user);
  }

  @Delete('members/:userId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a member from company' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  async removeMember(
    @CurrentUser() user: CurrentUserPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.companiesService.removeMember(user, userId);
  }

  @Patch('members/:userId/department')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update member department' })
  @ApiResponse({ status: 200, description: 'Department updated' })
  async updateMemberDepartment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body('departmentId') departmentId: string | null,
  ) {
    return this.companiesService.updateMemberDepartment(user, userId, departmentId);
  }
}
