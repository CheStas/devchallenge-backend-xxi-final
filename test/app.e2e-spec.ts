import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('1. POST /api/supply', () => {
    return request(app.getHttpServer())
      .post('/api/supply')
      .send({
        "data": [
            {
                "when": "2024-10-28T17:41:38",
                "sku": "A",
                "qty": 2,
                "price": 100
            },
            {
                "when": "2024-10-29T12:22:11",
                "sku": "A",
                "qty": 2,
                "price": 105
            },
            {
                "when": "2024-10-29T12:22:11",
                "sku": "B",
                "qty": 5,
                "price": 110
            },
            {
                "when": "2024-10-29T12:33:33",
                "sku": "B",
                "qty": 5,
                "price": 115
            }
        ]
    })
      .expect(201)
      .expect('Content-Type', /json/)
      .expect({
        "data": {
          "success": 4
        }
      });
  });

  it('1. POST /api/supply error response', () => {
    return request(app.getHttpServer())
      .post('/api/supply')
      .send({
        "data": [
        ]
    })
      .expect(422)
      .expect('Content-Type', /json/)
      .expect({
        "errors": ['Data should be an array of objects']
      });
  });

  it('2. POST /api/sales', () => {
    return request(app.getHttpServer())
      .post('/api/sales')
      .send({
        "data": [
            {
                "when": "2024-10-29T19:45:00",
                "sku": "A",
                "qty": 3,
                "price": 120
            },
            {
                "when": "2024-10-29T19:45:01",
                "sku": "B",
                "qty": 7,
                "price": 125
            },
            {
                "when": "2024-10-29T19:45:21",
                "sku": "C",
                "qty": 2,
                "price": 150
            }
        ]
    })
      .expect(201)
      .expect('Content-Type', /json/)
      .expect({
        "data": {
          "success": 2,
          "issues": 1
        }
      });
  });

  it('2. POST /api/sales, no success results out of stock error', () => {
    return request(app.getHttpServer())
      .post('/api/sales')
      .send({
        "data": [
            {
                "when": "2024-10-29T19:45:21",
                "sku": "C",
                "qty": 2,
                "price": 150
            }
        ]
    })
      .expect('Content-Type', /json/)
      .expect(422)
      .expect({
        "errors": ['C is out of stock']
      });
  });

  it('3. GET /api/profit?from{{from}}&to={{to}}', () => {
    return request(app.getHttpServer())
      .get('api/profit?from=2020-10-28&to=2025-10-28')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect({
        "data": [
            {
                "sku": "A",
                "qty": 3,
                "sum": 360,
                "profit": 55,
                "margin": 15.28
            },
            {
                "sku": "B",
                "qty": 2,
                "sum": 875,
                "profit": 85,
                "margin": 9.71
            }
        ]
    });
  });

  it('4. GET /api/availability?to={{to}}', () => {
    return request(app.getHttpServer())
      .get('api/availability?to=2025-10-28')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect({
        "data": [
            {
                "sku": "A",
                "qty": 1,
                "cost": 105
            },
            {
                "sku": "B",
                "qty": 3,
                "cost": 345
            }
        ]
    });
  });

  it('5. GET /api/issues?from{{from}}&to={{to}}', () => {
    return request(app.getHttpServer())
      .get('api/issues')
      .query({  to: '2025-10-28' })
      .expect(200)
      .expect('Content-Type', /json/)
      .expect({
        "data": [
            {
                "when": "2024-10-29T19:45:21",
                "sku": "C",
                "qty": 2,
                "price": 150,
                "message": "out_of_stock"
            }
        ]
    });
  });

  it('6. GET /api/top?from{{from}}&to={{to}}&top=100&by=profit', () => {
    return request(app.getHttpServer())
      .get('api/top')
      .query({  from: '2020-10-28' })
      .query({  to: '2025-10-28' })
      .expect(200)
      .expect('Content-Type', /json/)
      .expect({
        "data": [
            {
                "sku": "A",
            },
            {
                "sku": "A",
            }
        ]
    });
  });
});
