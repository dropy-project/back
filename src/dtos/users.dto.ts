import { IsString } from 'class-validator';

export class UserAuthDTO {
  @IsString()
  public uid: string;

  @IsString()
  public displayName: string;
}
