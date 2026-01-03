import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UserService } from './user.service';
import { UserType } from './schema/user.schema';
import { UpdateUserInput } from './dto/user.input';

@Resolver(() => UserType)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [UserType], { name: 'users' })
  async findAll() {
    return this.userService.findAll();
  }

  @Query(() => UserType, { name: 'user', nullable: true })
  async findOne(@Args('id') id: string) {
    return this.userService.findOne(id);
  }

  @Query(() => UserType, { name: 'userByEmail', nullable: true })
  async findByEmail(@Args('email') email: string) {
    return this.userService.findByEmail(email);
  }

  @Mutation(() => UserType)
  async updateUser(
    @Args('id') id: string,
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
  ) {
    return this.userService.update(id, updateUserInput);
  }

  @Mutation(() => Boolean)
  async removeUser(@Args('id') id: string): Promise<boolean> {
    return this.userService.remove(id);
  }
}
