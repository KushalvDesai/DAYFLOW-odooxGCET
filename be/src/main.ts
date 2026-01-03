import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  
  await app.listen(port);
  
  console.log('\n🚀 DayFlow HRMS Backend is running!');
  console.log('═════════════════════════════════════════════════════');
  console.log(`📡 GraphQL API: http://localhost:${port}/graphql`);
  console.log(`🎮 GraphQL Playground: http://localhost:${port}/graphql`);
  console.log(`📋 Use this URL in Postman: http://localhost:${port}/graphql`);
  console.log('═════════════════════════════════════════════════════\n');
}
bootstrap();
