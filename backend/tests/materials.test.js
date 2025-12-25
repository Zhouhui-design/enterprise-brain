const request = require('supertest');
const app = require('../server');
const MaterialService = require('../services/materialService');

describe('Materials API', () => {
  let testMaterialId = null;
  const testMaterialCode = 'TEST-MAT-001';

  // 测试数据
  const testMaterial = {
    materialCode: testMaterialCode,
    materialName: '测试物料',
    majorCategory: '测试类别',
    baseUnit: '个',
    source: ['测试来源'],
    purchasePrice: 100,
    purchaseConversionRate: 1,
    basePrice: 100,
  };

  describe('GET /api/materials/list', () => {
    it('should return all materials', async () => {
      const res = await request(app).get('/api/materials/list').expect('Content-Type', /json/).expect(200);

      expect(res.body).toHaveProperty('code', 200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBeTruthy();
    });
  });

  describe('POST /api/materials/create', () => {
    it('should create a new material', async () => {
      const res = await request(app)
        .post('/api/materials/create')
        .send(testMaterial)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('code', 200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');

      testMaterialId = res.body.data.id;
    });

    it('should fail to create a material with duplicate code', async () => {
      const res = await request(app)
        .post('/api/materials/create')
        .send(testMaterial)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(res.body).toHaveProperty('code', 500);
    });
  });

  describe('GET /api/materials/by-code/:materialCode', () => {
    it('should return a material by its code', async () => {
      const res = await request(app)
        .get(`/api/materials/by-code/${testMaterialCode}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('code', 200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('material_code', testMaterialCode);
    });

    it('should return 404 for non-existent material code', async () => {
      const res = await request(app)
        .get('/api/materials/by-code/NON-EXISTENT')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(res.body).toHaveProperty('code', 404);
    });
  });

  describe('PUT /api/materials/update/:id', () => {
    it('should update an existing material', async () => {
      const updatedMaterial = {
        ...testMaterial,
        materialName: '更新后的测试物料',
        purchasePrice: 150,
      };

      const res = await request(app)
        .put(`/api/materials/update/${testMaterialId}`)
        .send(updatedMaterial)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('code', 200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id', testMaterialId);

      // 验证更新是否成功
      const getRes = await request(app).get(`/api/materials/by-code/${testMaterialCode}`).expect(200);

      expect(getRes.body.data).toHaveProperty('material_name', '更新后的测试物料');
    });

    it('should fail to update non-existent material', async () => {
      const res = await request(app)
        .put('/api/materials/update/999999')
        .send(testMaterial)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(res.body).toHaveProperty('code', 500);
    });
  });

  describe('GET /api/materials/search', () => {
    it('should search materials by keyword', async () => {
      const res = await request(app)
        .get('/api/materials/search?keyword=测试')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('code', 200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBeTruthy();
    });

    it('should return all materials when keyword is empty', async () => {
      const res = await request(app).get('/api/materials/search?keyword=').expect('Content-Type', /json/).expect(200);

      expect(res.body).toHaveProperty('code', 200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBeTruthy();
    });
  });

  describe('DELETE /api/materials/delete/:id', () => {
    it('should delete an existing material', async () => {
      const res = await request(app)
        .delete(`/api/materials/delete/${testMaterialId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('code', 200);

      // 验证删除是否成功
      const getRes = await request(app).get(`/api/materials/by-code/${testMaterialCode}`).expect(404);

      expect(getRes.body).toHaveProperty('code', 404);
    });

    it('should fail to delete non-existent material', async () => {
      const res = await request(app).delete('/api/materials/delete/999999').expect('Content-Type', /json/).expect(500);

      expect(res.body).toHaveProperty('code', 500);
    });
  });
});
