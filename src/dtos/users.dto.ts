import { IsDate, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  public userName: string;

  @IsString()
  public UID: string;
  
  @IsString()
  public displayName: string;
  
  @IsDate()
  public registerDate: Date;
}
