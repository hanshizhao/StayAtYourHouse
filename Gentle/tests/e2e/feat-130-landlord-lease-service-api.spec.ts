import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const GENTLE_ROOT = join(__dirname, '..', '..', 'Gentle');

describe('FEAT-130: 后端服务层和 API', () => {
  const serviceInterfacePath = join(GENTLE_ROOT, 'Gentle.Application', 'Services', 'ILandlordLeaseService.cs');
  const serviceImplPath = join(GENTLE_ROOT, 'Gentle.Application', 'Services', 'LandlordLeaseService.cs');
  const appServicePath = join(GENTLE_ROOT, 'Gentle.Application', 'Apps', 'LandlordLeaseAppService.cs');

  describe('文件存在性检查', () => {
    test('ILandlordLeaseService 接口文件存在', () => {
      expect(existsSync(serviceInterfacePath)).toBeTruthy();
    });

    test('LandlordLeaseService 实现文件存在', () => {
      expect(existsSync(serviceImplPath)).toBeTruthy();
    });

    test('LandlordLeaseAppService API 控制器文件存在', () => {
      expect(existsSync(appServicePath)).toBeTruthy();
    });
  });

  describe('ILandlordLeaseService 接口验证', () => {
    let content: string;

    beforeAll(() => {
      content = readFileSync(serviceInterfacePath, 'utf-8');
    });

    test('接口继承 ITransient（Furion 自动注册）', () => {
      expect(content).toContain('ILandlordLeaseService : ITransient');
    });

    test('定义 GetByRoomIdAsync 方法', () => {
      expect(content).toContain('GetByRoomIdAsync');
    });

    test('定义 AddAsync 方法', () => {
      expect(content).toContain('AddAsync');
    });

    test('定义 EditAsync 方法', () => {
      expect(content).toContain('EditAsync');
    });

    test('定义 RemoveAsync 方法', () => {
      expect(content).toContain('RemoveAsync');
    });
  });

  describe('LandlordLeaseService 实现验证', () => {
    let content: string;

    beforeAll(() => {
      content = readFileSync(serviceImplPath, 'utf-8');
    });

    test('注入 IRepository<LandlordLease>', () => {
      expect(content).toContain('IRepository<LandlordLease>');
    });

    test('注入 IRepository<Room>', () => {
      expect(content).toContain('IRepository<Room>');
    });

    test('GetByRoomId 使用 Include 加载 Room.Community 导航属性', () => {
      expect(content).toContain('Include(l => l.Room)');
      expect(content).toContain('ThenInclude(r => r!.Community)');
    });

    test('AddAsync 包含房间存在校验', () => {
      expect(content).toContain('房间 {input.RoomId} 不存在');
    });

    test('AddAsync 包含一对一约束校验', () => {
      expect(content).toContain('已存在房东租约');
    });

    test('AddAsync 包含日期校验', () => {
      expect(content).toContain('租约结束日期必须晚于开始日期');
    });

    test('EditAsync 包含存在校验', () => {
      expect(content).toContain('房东租约 {input.Id} 不存在');
    });

    test('RemoveAsync 包含存在校验', () => {
      expect(content).toContain('房东租约 {id} 不存在');
    });

    test('使用 Oops.Oh 抛出异常（Furion 规范）', () => {
      expect(content).toContain('Oops.Oh(');
    });

    test('使用 Adapt 进行 DTO 映射（Mapster）', () => {
      expect(content).toContain('.Adapt<LandlordLeaseDto>');
    });
  });

  describe('LandlordLeaseAppService API 控制器验证', () => {
    let content: string;

    beforeAll(() => {
      content = readFileSync(appServicePath, 'utf-8');
    });

    test('实现 IDynamicApiController（Furion 规范）', () => {
      expect(content).toContain('IDynamicApiController');
    });

    test('路由前缀为 api/landlord-lease', () => {
      expect(content).toContain('[Route("api/landlord-lease")]');
    });

    test('使用 [Authorize] 鉴权', () => {
      expect(content).toContain('[Authorize]');
    });

    test('GET room/{roomId} 端点', () => {
      expect(content).toContain('[HttpGet("room/{roomId}")]');
    });

    test('POST add 端点', () => {
      expect(content).toContain('[HttpPost("add")]');
    });

    test('PUT edit 端点', () => {
      expect(content).toContain('[HttpPut("edit")]');
    });

    test('DELETE remove/{id} 端点', () => {
      expect(content).toContain('[HttpDelete("remove/{id}")]');
    });

    test('构造函数注入 ILandlordLeaseService', () => {
      expect(content).toContain('ILandlordLeaseService');
    });

    test('使用 [ApiDescriptionSettings] 分组', () => {
      expect(content).toContain('ApiDescriptionSettings');
    });
  });

  describe('构建验证', () => {
    test('dotnet build 编译成功', () => {
      const result = execSync('dotnet build', {
        cwd: GENTLE_ROOT,
        encoding: 'utf-8',
        timeout: 60000,
      });
      expect(result).toContain('已成功生成');
      expect(result).toContain('0 个错误');
    });
  });
});
