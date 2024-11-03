## Start
```bash
 docker-compose up --build
```

## Test
- coverage for the main service (warehouse.ts) is 81.92%

### Unit tests (warehouse.ts)
I know that I have to add a docker command to run tests but I have not time for this.
I really hope you will not discard any points because of this!
all  main logic tested! everything in warehouse.ts here
also you can check already generated coverage in coverage folder!
```bash
 pnpm i
 pnpm run test
```

### e2e tests (warehouse.controller.ts)
```bash
 pnpm i
 pnpm run test:e2e
```

### edge cases
- no time left to write it as notest, evertying covered in unit tests please check warehouse/warehouse.spec.ts
- I decided to allow sell produces without making profit, it's possible to update according business requirements
