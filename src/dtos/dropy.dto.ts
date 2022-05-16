import { IsNumber } from 'class-validator';

export class DropyDTO {
  @IsNumber()
  public emitterId: number;

  @IsNumber()
  public latitude: number;

  @IsNumber()
  public longitude: number;
}
