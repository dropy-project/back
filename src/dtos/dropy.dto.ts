import { IsNumber } from 'class-validator';

export class DropyDTO {
  @IsNumber()
  public userId: number;

  @IsNumber()
  public latitude: number;

  @IsNumber()
  public longitude: number;
}
