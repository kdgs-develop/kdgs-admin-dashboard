import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getProducts(
  search: string,
  offset: number
): Promise<{
  products: Product[];
  newOffset: number | null;
  totalProducts: number;
}> {
  const where = search ? { name: { contains: search, mode: 'insensitive' } } : {};

  const [products, totalProducts] = await Promise.all([
    prisma.product.findMany({
      where,
      take: 5,
      skip: offset,
      orderBy: { id: 'asc' },
    }),
    prisma.product.count({ where }),
  ]);

  const newOffset = products.length === 5 ? offset + 5 : null;

  return {
    products,
    newOffset,
    totalProducts,
  };
}

export async function deleteProductById(id: number) {
  await prisma.product.delete({ where: { id } });
}

export type Product = Awaited<ReturnType<typeof prisma.product.findUnique>>;