import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  profilePicture?: string;

  @Field({ nullable: true })
  department?: string;

  @Field({ nullable: true })
  designation?: string;
}
