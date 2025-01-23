import { Prisma } from '@prisma/client';

// Get the base type from Prisma
type PeriodicalPayload = Prisma.PeriodicalGetPayload<{
  include: {
    id: true;
    name: true;
    url: true;
    city: {
      include: {
        country: true;
      };
    };
    _count: {
      select: {
        obituaries: true;
      };
    };
  };
}>;

// Create the interface with relationships
interface PeriodicalWithRelations extends PeriodicalPayload {
  _count: {
    obituaries: number;
  };
}

// Export the type
export type { PeriodicalWithRelations };

type CityPayload = Prisma.CityGetPayload<{
  include: {
    id: true;
    name: true;
    country: true;
  };
}>;

interface CityWithRelations extends CityPayload {}

export type { CityWithRelations };
